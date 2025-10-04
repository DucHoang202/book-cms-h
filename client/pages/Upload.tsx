import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  Check,
  Loader2,
  BookOpen,
  Sparkles,
  ArrowLeft,
  Plus,
  DollarSign,
} from "lucide-react";

const API_URL = "http://172.16.1.22";

const CONTENT_TYPES = [
  "Chính trị",
  "Lịch sử",
  "Văn học",
  "Kỹ năng",
  "Khoa học",
  "Kinh tế",
  "Giáo dục",
  "Nghệ thuật",
];

const SAMPLE_GENRES = [
  "Tiểu thuyết",
  "Khoa học viễn tưởng",
  "Lịch sử",
  "Tự truyện",
  "Kỹ năng sống",
  "Kinh doanh",
  "Tâm lý học",
  "Triết học",
  "Công nghệ",
  "Y học",
];

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [bookData, setBookData] = useState({
    title: "",
    description: "",
    author: "",
    year: "",
    genres: [] as string[],
    publisher: "",
    pages: 328,
    isbn: "",
    contentType: "",
    digitalPrice: "",
    digitalQuantity: "",
    physicalPrice: "",
    physicalQuantity: "",
    allowPhoneAccess: false,
    allowPhysicalAccess: false,
  });

  const processingSteps = [
    "Đang tải lên file...",
    "Đã mã hóa nội dung PDF",
    "Đang vector hóa nội dung",
    "AI đang phân tích và tạo metadata",
  ];


  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find((file) => file.type === "application/pdf");

    if (pdfFile) {
      setSelectedFile(pdfFile);
      startProcessing(pdfFile);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type === "application/pdf") {
        setSelectedFile(file);
        startProcessing(file);
        handleFileUpload(file);
      }
    },
    [],
  );

  const handleDemoUpload = useCallback(() => {
    const mockFile = new File([""], "sample-book.pdf", {
      type: "application/pdf",
    });
    setSelectedFile(mockFile);
    startProcessing(mockFile);
  }, []);

  const startProcessing = async (file: File) => {
    setIsProcessing(true);

    for (let i = 0; i < processingSteps.length; i++) {
      setProcessingStep(i);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Auto-fill form with AI data
    setBookData({
      title: "Nghệ Thuật Lãnh Đạo Hiện Đại",
      description:
        "Cuốn sách cung cấp những phương pháp lãnh đạo tiên tiến, kết hợp giữa tâm lý học và quản trị hiện đại để giúp các nhà lãnh đạo phát triển kỹ năng điều hành đội nhóm hiệu quả.",
      author: "Nguyễn Văn A, Trần Thị B",
      year: "2023",
      genres: ["Kỹ năng sống", "Kinh doanh"],
      publisher: "NXB Tri Thức",
      pages: Math.floor(file.size / 50000) + 250,
      isbn: "978-604-916-000-0",
      contentType: "Kỹ năng",
      digitalPrice: "150000",
      digitalQuantity: "1000",
      physicalPrice: "280000",
      physicalQuantity: "500",
      allowPhoneAccess: true,
      allowPhysicalAccess: true,
    });

    setIsProcessing(false);
    setShowForm(true);
  };
  interface Book {
    id: string;
    title: string;
    author: string;
    status: "published" | "draft" | "processing" | "rejected";
    genre: string[];
    publishDate: string;
    views: number;
    revenue: number;
    pages: number;
    coverUrl?: string;
  }

  const handleFileUpload = async (file: File) => {
    if (file == null) {
           console.log("Uploading File:", file.name, file.size);
      return;
    }

        try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } 
      const res = await fetch(API_URL + ':8000/ingest/pdf', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {

        throw new Error(`HTTP error! status: ${res.status}`);
      } else {
          const result = await res.json();
         (window as any).bookId = result.book_id; //bookId
         (window as any).filename = result.filename;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error:', errorMessage);
    } finally {
     
    }
  }

  const handlePublish = async () => {
    alert(`✅ Sách "${bookData.title}" đã được xuất bản thành công!`);

      try {
      const res = await fetch(API_URL + ':8000/booksUpload', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...bookData, book_id: (window as any).bookId, linkPDF: `http://172.16.1.166:4000/pdf/${(window as any).filename}`
 }),
      });
      console.log('Publishing Book:', JSON.stringify({ ...bookData, book_id: (window as any).bookId }));
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error:', errorMessage);
    } finally {
      window.location.href = `/reader/${(window as any).bookId}`;
    }
  };

  const handleSaveDraft = () => {
    alert(`💾 Sách "${bookData.title}" đã được lưu thành bản nháp!`);
  };

  const toggleGenre = (genre: string) => {
    setBookData((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại thư viện</span>
            </Link>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center ml-4">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Thêm sách mới</h1>
              <p className="text-sm text-gray-600">
                Tải lên và xuất bản sách của bạn
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Thư viện
            </Link>
            <Link
              to="/reader"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Đọc sách mẫu
            </Link>
            <a
              href="#"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Thống kê
            </a>
            <a
              href="#"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Hỗ trợ
            </a>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-6 py-8 max-w-4xl">
        {!selectedFile && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tải lên sách mới
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Tải lên file PDF và để AI tự động phân tích, tạo metadata cho việc
              xuất bản.
            </p>
          </div>
        )}

        {/* File Upload Area */}
        {!selectedFile && (
          <Card className="mb-8 border-2 border-dashed border-blue-200 bg-white/50">
            <CardContent className="p-12">
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  isDragOver
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Kéo thả file PDF vào đây
                </h3>
                <p className="text-gray-500 mb-6">hoặc</p>

                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className="bg-white hover:bg-blue-50"
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Chọn tệp từ máy
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">
                      Hoặc thử nghiệm:
                    </p>
                    <Button
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={handleDemoUpload}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Thử với file PDF mẫu
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-gray-400 mt-4">Chỉ nhận file .pdf</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing Steps */}
   
        {selectedFile && isProcessing && (
          <Card className="mb-8 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Đang xử lý: {selectedFile.name}
      
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {processingSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index < processingStep
                          ? "bg-green-100 text-green-600"
                          : index === processingStep
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {index < processingStep ? (
                        <Check className="w-4 h-4" />
                      ) : index === processingStep ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <span
                      className={`${
                        index < processingStep
                          ? "text-green-700 font-medium"
                          : index === processingStep
                            ? "text-blue-700 font-medium"
                            : "text-gray-500"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata Form */}
        {showForm && (
          <div className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Thông tin sách</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-2">
                    <Label htmlFor="title">Tiêu đề sách *</Label>
                    <Input
                      id="title"
                      value={bookData.title}
                      onChange={(e) =>
                        setBookData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="mt-1"
                      required
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <Label htmlFor="description">Mô tả chi tiết</Label>
                    <Textarea
                      id="description"
                      value={bookData.description}
                      onChange={(e) =>
                        setBookData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={4}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="author">Tác giả</Label>
                    <Input
                      id="author"
                      value={bookData.author}
                      onChange={(e) =>
                        setBookData((prev) => ({
                          ...prev,
                          author: e.target.value,
                        }))
                      }
                      className="mt-1"
                      placeholder="Phân cách bằng dấu phẩy"
                    />
                  </div>

                  <div>
                    <Label htmlFor="year">Năm xuất bản</Label>
                    <Input
                      id="year"
                      type="number"
                      value={bookData.year}
                      onChange={(e) =>
                        setBookData((prev) => ({
                          ...prev,
                          year: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="publisher">Nhà xuất bản</Label>
                    <Input
                      id="publisher"
                      value={bookData.publisher}
                      onChange={(e) =>
                        setBookData((prev) => ({
                          ...prev,
                          publisher: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="pages">Số trang</Label>
                    <Input
                      id="pages"
                      type="number"
                      value={bookData.pages}
                      onChange={(e) =>
                        setBookData((prev) => ({
                          ...prev,
                          pages: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="mt-1"
                      min="1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                      id="isbn"
                      value={bookData.isbn}
                      onChange={(e) =>
                        setBookData((prev) => ({
                          ...prev,
                          isbn: e.target.value,
                        }))
                      }
                      className="mt-1"
                      placeholder="978-xxx-xxx-xxx-x"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contentType">Loại nội dung</Label>
                    <Select
                      value={bookData.contentType}
                      onValueChange={(value) =>
                        setBookData((prev) => ({ ...prev, contentType: value }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Chọn loại nội dung" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="lg:col-span-2">
                    <Label>Thể loại / Tag</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {SAMPLE_GENRES.map((genre) => (
                        <Badge
                          key={genre}
                          variant={
                            bookData.genres.includes(genre)
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => toggleGenre(genre)}
                        >
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Information */}
            <Card className="bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Thông tin kinh doanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="digitalPrice">Giá sách điện tử (VNĐ)</Label>
                    <Input
                      id="digitalPrice"
                      type="number"
                      value={bookData.digitalPrice}
                      onChange={(e) =>
                        setBookData((prev) => ({
                          ...prev,
                          digitalPrice: e.target.value,
                        }))
                      }
                      className="mt-1"
                      placeholder="150000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="digitalQuantity">
                      Số lượng sách điện tử
                    </Label>
                    <Input
                      id="digitalQuantity"
                      type="number"
                      value={bookData.digitalQuantity}
                      onChange={(e) =>
                        setBookData((prev) => ({
                          ...prev,
                          digitalQuantity: e.target.value,
                        }))
                      }
                      className="mt-1"
                      placeholder="1000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="physicalPrice">Giá sách giấy (VNĐ)</Label>
                    <Input
                      id="physicalPrice"
                      type="number"
                      value={bookData.physicalPrice}
                      onChange={(e) =>
                        setBookData((prev) => ({
                          ...prev,
                          physicalPrice: e.target.value,
                        }))
                      }
                      className="mt-1"
                      placeholder="280000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="physicalQuantity">Số lượng sách giấy</Label>
                    <Input
                      id="physicalQuantity"
                      type="number"
                      value={bookData.physicalQuantity}
                      onChange={(e) =>
                        setBookData((prev) => ({
                          ...prev,
                          physicalQuantity: e.target.value,
                        }))
                      }
                      className="mt-1"
                      placeholder="500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allowPhone"
                      checked={bookData.allowPhoneAccess}
                      onCheckedChange={(checked) =>
                        setBookData((prev) => ({
                          ...prev,
                          allowPhoneAccess: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="allowPhone">
                      Cho phép khai thác Sách điện tử
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allowPhysical"
                      checked={bookData.allowPhysicalAccess}
                      onCheckedChange={(checked) =>
                        setBookData((prev) => ({
                          ...prev,
                          allowPhysicalAccess: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="allowPhysical">
                      Cho phép khai thác sách giấy (SG)
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedFile(null);
                  setShowForm(false);
                  setIsProcessing(false);
                  setProcessingStep(0);
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Tải file khác
              </Button>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  className="px-8"
                >
                  Lưu bản nháp
                </Button>
                <Button
                  onClick={handlePublish}
                  className="px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Xuất bản
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
