import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );

    // Auto-redirect common invalid routes to valid ones
    const path = location.pathname;

    // Handle reader sub-routes
    if (path.startsWith("/reader/") || path.includes("/reader?")) {
      setTimeout(() => navigate("/reader"), 1000);
      return;
    }

    // Handle upload sub-routes
    if (path.startsWith("/upload/") || path.includes("/upload?")) {
      setTimeout(() => navigate("/upload"), 1000);
      return;
    }

    // Handle dashboard sub-routes
    if (path.startsWith("/dashboard") || path.startsWith("/library")) {
      setTimeout(() => navigate("/"), 1000);
      return;
    }
  }, [location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-blue-100">
        <div className="container mx-auto px-4 lg:px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">BookAI</h1>
            <p className="text-sm text-gray-600">
              Nền tảng xuất bản thông minh
            </p>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="text-center p-8">
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Trang không tìm thấy
            </h2>
            <p className="text-gray-600 mb-2">
              Đường dẫn{" "}
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                {location.pathname}
              </code>{" "}
              không tồn tại.
            </p>

            {/* Auto-redirect message */}
            {(location.pathname.startsWith("/reader") ||
              location.pathname.startsWith("/upload") ||
              location.pathname.startsWith("/dashboard") ||
              location.pathname.startsWith("/library")) && (
              <p className="text-blue-600 text-sm mb-4">
                Đang chuyển hướng tự động... 🔄
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Home className="w-4 h-4 mr-2" />
                  Về trang chủ
                </Button>
              </Link>

              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="border-gray-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
            </div>

            <div className="mt-8">
              <p className="text-sm text-gray-500 mb-4">
                Hoặc truy cập trực tiếp:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Link to="/">
                  <Button variant="ghost" size="sm">
                    Thư viện sách
                  </Button>
                </Link>
                <Link to="/upload">
                  <Button variant="ghost" size="sm">
                    Thêm sách
                  </Button>
                </Link>
                <Link to="/reader">
                  <Button variant="ghost" size="sm">
                    Đọc sách mẫu
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
