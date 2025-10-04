import React, { useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  MoreHorizontal,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  TrendingUp,
  DollarSign,
  FileText,
  Menu,
  X,
} from "lucide-react";
import { Query } from "@tanstack/react-query";

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
interface ResponseBook {
  id: string;
  title: string;
  min_pages: number;
  max_pages: number;
  total_pages: number;
}
const QueryResponse = {
  items: [

  ],
}

const SAMPLE_BOOKS: Book[] = [
  {
    id: "1",
    title: "Nghệ Thuật Lãnh Đạo Hiện Đại",
    author: "Nguyễn Văn A, Trần Thị B",
    status: "published",
    genre: ["Kỹ năng sống", "Kinh doanh"],
    publishDate: "2024-01-15",
    views: 1250,
    revenue: 1875000,
    pages: 328,
  },
  {
    id: "2",
    title: "Tâm Lý Học Ứng Dụng",
    author: "Phạm Thị C",
    status: "published",
    genre: ["Tâm lý học", "Kỹ năng sống"],
    publishDate: "2024-01-10",
    views: 890,
    revenue: 1335000,
    pages: 245,
  },
  {
    id: "3",
    title: "Lịch Sử Việt Nam Hiện Đại",
    author: "Lê Văn D",
    status: "draft",
    genre: ["Lịch sử"],
    publishDate: "",
    views: 0,
    revenue: 0,
    pages: 450,
  },
  {
    id: "4",
    title: "Khởi Nghiệp Thành Công",
    author: "Hoàng Thị E",
    status: "processing",
    genre: ["Kinh doanh", "Khởi nghiệp"],
    publishDate: "",
    views: 0,
    revenue: 0,
    pages: 280,
  },
  {
    id: "5",
    title: "Văn Học Đương Đại",
    author: "Ngô Văn F",
    status: "published",
    genre: ["Văn học"],
    publishDate: "2023-12-20",
    views: 2150,
    revenue: 3225000,
    pages: 380,
  },
];
SAMPLE_BOOKS.splice(0, SAMPLE_BOOKS.length); 
const STATUS_CONFIG = {
  published: {
    label: "Đã xuất bản",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  draft: { label: "Bản nháp", color: "bg-gray-100 text-gray-800", icon: Clock },
  processing: {
    label: "Đang xử lý",
    color: "bg-blue-100 text-blue-800",
    icon: Clock,
  },
  rejected: {
    label: "Bị từ chối",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>(SAMPLE_BOOKS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const bookResponse: ResponseBook = {
    id: "",
    title: "",
    min_pages: null,
    max_pages: null,
    total_pages: null,
  }
  const QueryResponse: { items: ResponseBook[] } = { items: [] };
  QueryResponse.items.push(bookResponse);

const fetchBooks = async () => {
  setIsLoading(true);
  try {
    
    const res = await fetch('http://172.16.1.22:8000/books', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      }
      // Bỏ body
    });
    (window as any).responseBook  = await res.json();
  } catch(error) {
    console.error('Error fetching books:', error);
  } finally {
    setBooks([]);
    setIsLoading(false);
  }
for (let i = 0; i < (window as any).responseBook.length; i++) {
  const book = (window as any).responseBook[i];

  const newBook: Book = {
    id: book.book_id,
    title: book.title || "Chưa có tiêu đề",
    author: book.author || "Không rõ tác giả",
    status: "published",
    genre: book.genres && book.genres.length > 0 
      ? book.genres 
      : ["Chưa phân loại"],
    publishDate: book.year 
      ? `${book.year}-01-01` 
      : "2024-01-10",
    views: 890, // hoặc lấy từ API nếu có
    revenue: 1335000, // hoặc tính từ giá * số lượng
    pages: book.total_pages || 0,
  };

  setBooks((prevBooks) => [...prevBooks, newBook]);
}

}
      useEffect(() => {
    fetchBooks();
  }, []);
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || book.status === statusFilter;
      const matchesGenre =
        genreFilter === "all" || book.genre.some((g) => g === genreFilter);

      return matchesSearch && matchesStatus && matchesGenre;
    });
  }, [books, searchQuery, statusFilter, genreFilter]);

  const stats = {
    totalBooks: books.length,
    publishedBooks: books.filter((b) => b.status === "published").length,
    totalViews: books.reduce((sum, book) => sum + book.views, 0),
    totalRevenue: books.reduce((sum, book) => sum + book.revenue, 0),
  };

  const allGenres = [...new Set(books.flatMap((book) => book.genre))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">BookAI CMS</h1>
                <p className="text-sm text-gray-600">
                  Quản lý thư viện sách thông minh
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  to="/"
                  className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
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

              <Link to="/upload">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm sách
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-blue-100 bg-white/95 backdrop-blur-sm">
              <nav className="px-4 py-4 space-y-2">
                <Link
                  to="/"
                  className="block py-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Thư viện
                </Link>
                <Link
                  to="/reader"
                  className="block py-2 text-gray-600 hover:text-blue-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Đọc sách mẫu
                </Link>
                <a
                  href="#"
                  className="block py-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Thống kê
                </a>
                <a
                  href="#"
                  className="block py-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Hỗ trợ
                </a>
              </nav>
            </div>
          )}
        </div>
      </header>
      <main className="container mx-auto px-4 lg:px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Tổng số sách
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalBooks}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Đã xuất bản
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.publishedBooks}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Lượt xem</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalViews.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Doanh thu</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {(stats.totalRevenue / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8 bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Tìm kiếm theo tên sách hoặc tác giả..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-40">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="published">Đã xuất bản</SelectItem>
                  <SelectItem value="draft">Bản nháp</SelectItem>
                  <SelectItem value="processing">Đang xử lý</SelectItem>
                  <SelectItem value="rejected">Bị từ chối</SelectItem>
                </SelectContent>
              </Select>

              <Select value={genreFilter} onValueChange={setGenreFilter}>
                <SelectTrigger className="w-full lg:w-40">
                  <SelectValue placeholder="Thể loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả thể loại</SelectItem>
                  {allGenres.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Books Table */}
        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Danh sách sách ({filteredBooks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-600">
                      Sách
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">
                      Tác giả
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">
                      Trạng thái
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">
                      Thể loại
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">
                      Ngày xuất bản
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">
                      Lượt xem
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">
                      Doanh thu
                    </th>
                    <th className="text-center py-3 px-2 font-medium text-gray-600">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((book) => {
                    const StatusIcon = STATUS_CONFIG[book.status].icon;
                    return (
                      <tr
                        key={book.id}
                        className="border-b border-gray-100 hover:bg-gray-50/50"
                      >
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <Link to={`/reader/${book.id}`}
                                className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                              >
                                {book.title}
                              </Link>
                              <p className="text-sm text-gray-500">
                                {book.pages} trang
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-2 text-gray-700">
                          {book.author}
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-2">
                            <StatusIcon className="w-4 h-4" />
                            <Badge className={STATUS_CONFIG[book.status].color}>
                              {STATUS_CONFIG[book.status].label}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex flex-wrap gap-1">
                            {book.genre.slice(0, 2).map((genre) => (
                              <Badge
                                key={genre}
                                variant="outline"
                                className="text-xs"
                              >
                                {genre}
                              </Badge>
                            ))}
                            {book.genre.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{book.genre.length - 2}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-2 text-gray-700">
                          {book.publishDate
                            ? new Date(book.publishDate).toLocaleDateString(
                                "vi-VN",
                              )
                            : "-"}
                        </td>
                        <td className="py-4 px-2 text-gray-700">
                          {book.views.toLocaleString()}
                        </td>
                        <td className="py-4 px-2 text-gray-700">
                          {book.revenue > 0
                            ? `${(book.revenue / 1000).toLocaleString()}K`
                            : "-"}
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex items-center justify-center gap-2">
                            <Link to="/reader">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredBooks.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-2">
                  Không tìm thấy sách nào
                </p>
                <p className="text-gray-500 mb-6">
                  Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </p>
                <Link to="/upload">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm sách mới
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
