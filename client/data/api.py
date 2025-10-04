# api.py
import os
import time
import tempfile
import asyncio
import logging
import inspect
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException, Query as QParam
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
try:
    from dotenv import load_dotenv
    ENV_CANDIDATES = [
        Path(__file__).resolve().parent / ".env",
        Path(__file__).resolve().parents[1] / ".env",
    ]
    for p in ENV_CANDIDATES:
        if p.exists():
            load_dotenv(dotenv_path=p, override=False)
except Exception:
    pass
os.environ.setdefault("PGHOST", "localhost")
os.environ.setdefault("PGPORT", os.getenv("PGPORT", "55432"))

os.environ.setdefault("QDRANT_HOST", "localhost")
os.environ.setdefault("QDRANT_PORT", "6333")

# Tên collection (dùng cả các biến thường gặp trong code)
os.environ.setdefault("QDRANT_COLLECTION", "books_rag")
os.environ.setdefault("BOOKS_COLLECTION", os.getenv("QDRANT_COLLECTION", "books_rag"))
os.environ.setdefault("BOOKS_SEED_COLLECTION", "books_rag_seed")

if os.name == "nt":
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    except Exception:
        pass
from app.ingest import ingest_pdf  # noqa: E402
from app import ingest as ingest_mod  # dùng PG*, collection từ ingest.py  # noqa: E402
from app.query import QueryEngine  # noqa: E402

from sqlalchemy import create_engine, text as sql_text  # noqa: E402
from qdrant_client import QdrantClient  # noqa: E402

# ---------------------------------------------------------
# 4) FastAPI app & middlewares
# ---------------------------------------------------------
app = FastAPI(title="Books RAG API", version="0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"]
)

log = logging.getLogger("api")
logging.basicConfig(level=logging.INFO)

@app.middleware("http")
async def timing_logger(request, call_next):
    start = time.perf_counter()
    resp = await call_next(request)
    dur_ms = (time.perf_counter() - start) * 1000
    log.info("%s %s -> %s (%.1f ms)", request.method, request.url.path, resp.status_code, dur_ms)
    return resp

@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")

# ---------------------------------------------------------
# 5) Engines / Clients (singleton)
# ---------------------------------------------------------
RAG = QueryEngine()
# Band-aid nếu query.py cũ không set thuộc tính này:
if not hasattr(RAG, "has_summary"):
    RAG.has_summary = False

ENGINE = create_engine(
    f"postgresql+psycopg2://{ingest_mod.PGUSER}:{ingest_mod.PGPASSWORD}"
    f"@{os.getenv('PGHOST','localhost')}:{ingest_mod.PGPORT}/{ingest_mod.PGDATABASE}"
)

QDRANT = QdrantClient(
    host=os.getenv("QDRANT_HOST", "localhost"),
    port=int(os.getenv("QDRANT_PORT", "6333")),
)

COLLECTION = os.getenv("QDRANT_COLLECTION", getattr(ingest_mod, "BOOKS_COLLECTION", "books_rag"))

# ---------------------------------------------------------
# 6) Utils
# ---------------------------------------------------------
def _ensure_event_loop():
    """Đảm bảo worker thread có event loop (fix lỗi AnyIO worker thread)."""
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

# Pydantic v1/v2 compatibility cho extra fields
try:
    from pydantic import ConfigDict
    _PYD_V2 = True
except Exception:
    _PYD_V2 = False

class QueryIn(BaseModel):
    question: str = Field(..., description="Câu hỏi cho RAG")
    book_id: str | None = Field(None, description="ID sách (để ghim vào 1 cuốn cụ thể)")
    k: int | None = Field(20, description="Top-K retrieve (nếu query.py hỗ trợ)")
    target_chars: int | None = Field(1200, description="Độ dài mục tiêu (nếu hỗ trợ)")
    dry_run: bool | None = Field(False, description="Chỉ retrieve, không generate (nếu hỗ trợ)")

    if _PYD_V2:
        model_config = ConfigDict(extra="allow")
    else:
        class Config:
            extra = "allow"

# ---------------------------------------------------------
# 7) Routes
# ---------------------------------------------------------
@app.get("/health")
def health():
    return {"ok": True}

@app.post("/ingest/pdf")
def api_ingest_pdf(file: UploadFile = File(...)):
    _ensure_event_loop()  # fix "no event loop in AnyIO worker thread"
    name = (file.filename or "").lower()
    if not name.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only .pdf is accepted")

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(file.file.read())
        tmp_path = Path(tmp.name)

    try:
        ingest_pdf(tmp_path)  # Ghi DB + upsert Qdrant theo ingest.py
        return {"filename": file.filename, "ingested": True}
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            tmp_path.unlink(missing_ok=True)
        except Exception:
            pass

@app.get("/books")
def list_books():
    sql = """
    SELECT b.id::text AS book_id, b.title,
           COALESCE(MIN(p.page_no), 1) AS min_page,
           COALESCE(MAX(p.page_no), 0) AS max_page,
           COUNT(p.page_id) AS total_pages
    FROM books b
    LEFT JOIN pages p ON p.book_id = b.id
    GROUP BY b.id, b.title
    ORDER BY b.title ASC;
    """
    with ENGINE.begin() as conn:
        rows = conn.execute(sql_text(sql)).mappings().all()
    return {"items": [dict(r) for r in rows]}

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, validator
from typing import List
from sqlalchemy import text as sql_text
import json
from datetime import datetime

class BookUpload(BaseModel):
    title: str
    author: str
    isbn: str
    publisher: str
    year: str
    pages: int
    contentType: str  # Sẽ map thành content_type
    description: str
    digitalPrice: str  # Sẽ map thành digital_price
    digitalQuantity: str  # Sẽ map thành digital_quantity
    physicalPrice: str  # Sẽ map thành physical_price
    physicalQuantity: str  # Sẽ map thành physical_quantity
    genres: List[str]
    allowPhoneAccess: bool  # Sẽ map thành allow_phone_access
    allowPhysicalAccess: bool  # Sẽ map thành allow_physical_access

    @validator('isbn')
    def validate_isbn(cls, v):
        if not v or len(v) < 10:
            raise ValueError('ISBN must be at least 10 characters')
        return v
    
    @validator('pages')
    def validate_pages(cls, v):
        if v <= 0:
            raise ValueError('Pages must be greater than 0')
        return v

@app.post("/booksUpload")
def uploadBooksInformation(book_data: BookUpload):
    try:
        sql = """
        INSERT INTO booksUpload (
            title, author, isbn, publisher, year, pages,
            content_type, description, digital_price, digital_quantity,
            physical_price, physical_quantity, genres,
            allow_phone_access, allow_physical_access
        ) VALUES (
            :title, :author, :isbn, :publisher, :year, :pages,
            :content_type, :description, :digital_price, :digital_quantity,
            :physical_price, :physical_quantity, :genres,
            :allow_phone_access, :allow_physical_access
        )
        RETURNING id, created_at
        """
        
        # Convert genres array to comma-separated string
        genres_str = ','.join(book_data.genres)
        
        with ENGINE.begin() as conn:
            result = conn.execute(sql_text(sql), {
                "title": book_data.title,
                "author": book_data.author,
                "isbn": book_data.isbn,
                "publisher": book_data.publisher,
                "year": book_data.year,
                "pages": book_data.pages,
                "content_type": book_data.contentType,
                "description": book_data.description,
                "digital_price": book_data.digitalPrice,
                "digital_quantity": book_data.digitalQuantity,
                "physical_price": book_data.physicalPrice,
                "physical_quantity": book_data.physicalQuantity,
                "genres": genres_str,
                "allow_phone_access": book_data.allowPhoneAccess,
                "allow_physical_access": book_data.allowPhysicalAccess
            })
            
            row = result.fetchone()
            book_id = row[0]
            created_at = row[1]
            
        return {
            "message": "Book uploaded successfully",
            "book_id": book_id,
            "created_at": created_at,
            "data": book_data.dict()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get all uploaded books
@app.get("/booksUpload")
def getBooksUpload():
    try:
        sql = """
        SELECT * FROM booksUpload 
        ORDER BY created_at DESC
        """
        
        with ENGINE.begin() as conn:
            rows = conn.execute(sql_text(sql)).mappings().all()
            
        return {"items": [dict(r) for r in rows]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get book by ID
@app.get("/booksUpload/{book_id}")
def getBookUpload(book_id: int):
    try:
        sql = """
        SELECT * FROM booksUpload 
        WHERE id = :book_id
        """
        
        with ENGINE.begin() as conn:
            rows = conn.execute(sql_text(sql), {"book_id": book_id}).mappings().all()
            
        if not rows:
            raise HTTPException(status_code=404, detail="Book not found")
            
        return {"item": dict(rows[0])}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    try:
        # Convert genres array to string (hoặc JSON)
        genres_str = ','.join(book_data.genres)  # "Kỹ năng sống,Kinh doanh"
        # Hoặc: genres_json = json.dumps(book_data.genres)
        
        sql = """
        INSERT INTO booksUpload (
            title, author, isbn, publisher, year, pages,
            content_type, description, digital_price, digital_quantity,
            physical_price, physical_quantity, genres,
            allow_phone_access, allow_physical_access
        ) VALUES (
            :title, :author, :isbn, :publisher, :year, :pages,
            :content_type, :description, :digital_price, :digital_quantity,
            :physical_price, :physical_quantity, :genres,
            :allow_phone_access, :allow_physical_access
        )
        """
        
        with ENGINE.begin() as conn:
            result = conn.execute(sql_text(sql), {
                "title": book_data.title,
                "author": book_data.author,
                "isbn": book_data.isbn,
                "publisher": book_data.publisher,
                "year": book_data.year,
                "pages": book_data.pages,
                "content_type": book_data.contentType,
                "description": book_data.description,
                "digital_price": book_data.digitalPrice,
                "digital_quantity": book_data.digitalQuantity,
                "physical_price": book_data.physicalPrice,
                "physical_quantity": book_data.physicalQuantity,
                "genres": genres_str,
                "allow_phone_access": book_data.allowPhoneAccess,
                "allow_physical_access": book_data.allowPhysicalAccess
            })
            
            # Get inserted book ID
            book_id = result.lastrowid
            
        return {
            "message": "Book uploaded successfully",
            "book_id": book_id,
            "data": book_data.dict()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/query")
def api_query(body: QueryIn):
    try:
        # Gom tất cả fields client gửi vào
        incoming = body.dict(exclude_none=True) if hasattr(body, "dict") else body.model_dump(exclude_none=True)
        if "question" not in incoming or not incoming["question"]:
            raise HTTPException(status_code=422, detail="Missing 'question'")

        # Lọc theo chữ ký THẬT của QueryEngine.run_query trong query.py
        sig = inspect.signature(RAG.run_query)
        supported = set(sig.parameters.keys())  # {"self","question","book_id",...}
        safe_kwargs = {k: v for k, v in incoming.items() if k in supported}

        result = RAG.run_query(**safe_kwargs)
        return result
    except HTTPException:
        raise
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------
# 8) Debug endpoints (giúp soi nhanh cấu hình & dữ liệu)
# ---------------------------------------------------------
@app.get("/debug/state")
def debug_state():
    try:
        with ENGINE.begin() as conn:
            books = conn.execute(sql_text("SELECT COUNT(*) FROM books")).scalar()
            pages = conn.execute(sql_text("SELECT COUNT(*) FROM pages")).scalar()
    except Exception as e:
        return {"ok": False, "db_error": str(e)}

    try:
        points = QDRANT.count(collection_name=COLLECTION, count_filter=None).count
    except Exception as e:
        return {"ok": False, "qdrant_error": str(e)}

    return {
        "ok": True,
        "db": {"books": int(books or 0), "pages": int(pages or 0)},
        "qdrant": {"collection": COLLECTION, "points": int(points or 0)}
    }

class DebugConfigModel(BaseModel):
    pguser: str | None = None
    pgdatabase: str | None = None
    pgport: int | None = None
    qdrant_host: str | None = None
    qdrant_port: int | None = None
    qdrant_collection: str | None = None

@app.get("/debug/config", response_model=DebugConfigModel)
def debug_config():
    try:
        return DebugConfigModel(
            pguser=ingest_mod.PGUSER,
            pgdatabase=ingest_mod.PGDATABASE,
            pgport=int(ingest_mod.PGPORT),
            qdrant_host=os.getenv("QDRANT_HOST", "localhost"),
            qdrant_port=int(os.getenv("QDRANT_PORT", "6333")),
            qdrant_collection=COLLECTION,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/debug/query-env")
def debug_query_env():
    keys = [
        "PGHOST", "PGPORT", "PGUSER", "PGDATABASE",
        "QDRANT_HOST", "QDRANT_PORT",
        "QDRANT_COLLECTION", "BOOKS_COLLECTION", "BOOKS_SEED_COLLECTION",
    ]
    return {k: os.getenv(k) for k in keys}

@app.get("/debug/qdrant-count")
def qdrant_count(collection: str = QParam(..., description="Tên collection cần đếm")):
    try:
        qc = QDRANT
        n = qc.count(collection_name=collection, count_filter=None).count
        return {"collection": collection, "points": int(n or 0)}
    except Exception as e:
        return {"collection": collection, "error": str(e)}

@app.get("/debug/query-signature")
def debug_query_signature():
    try:
        return {"run_query_signature": str(inspect.signature(RAG.run_query))}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/debug/query-dry-kwargs")
def debug_query_dry_kwargs(body: QueryIn):
    try:
        incoming = body.dict(exclude_none=True) if hasattr(body, "dict") else body.model_dump(exclude_none=True)
        sig = inspect.signature(RAG.run_query)
        supported = set(sig.parameters.keys())
        safe_kwargs = {k: v for k, v in incoming.items() if k in supported}
        return {
            "supported_params_in_query_py": sorted(list(supported)),
            "received_payload": incoming,
            "will_pass_kwargs": safe_kwargs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api:app",               # Tên file (api.py) : app instance
        host="0.0.0.0",          # Cho phép truy cập từ LAN
        port=8000,               # Có thể đổi port nếu muốn
        reload=True              # Tự reload khi code thay đổi (chỉ nên dùng dev)
    )
