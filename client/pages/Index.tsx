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
  DollarSign,
  Settings,
} from "lucide-react";

interface ProcessingStep {
  id: string;
  label: string;
  status: "pending" | "processing" | "completed";
}

interface BookMetadata {
  title: string;
  description: string;
  authors: string;
  publishYear: string;
  genres: string[];
  publisher: string;
  pages: number;
  isbn: string;
  contentType: string;
  digitalPrice: string;
  digitalQuantity: string;
  physicalPrice: string;
  physicalQuantity: string;
  allowDigitalAccess: boolean;
  allowPhysicalAccess: boolean;
}

const PROCESSING_STEPS: ProcessingStep[] = [
  { id: "upload", label: "Đang tải lên file...", status: "pending" },
  { id: "encode", label: "Đã mã hóa nội dung PDF", status: "pending" },
  {
    id: "vectorize",
    label: "Đang vector hóa toàn bộ nội dung",
    status: "pending",
  },
  {
    id: "analyze",
    label: "Đang phân tích nội dung và sinh metadata (AI)",
    status: "pending",
  },
];

const CONTENT_TYPES = [
  "Chính trị",
  "Lịch sử",
  "Văn h��c",
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
];

export default function Index() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] =
    useState<ProcessingStep[]>(PROCESSING_STEPS);
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const [metadata, setMetadata] = useState<BookMetadata>({
    title: "",
    description: "",
    authors: "",
    publishYear: "",
    genres: [],
    publisher: "",
    pages: 0,
    isbn: "",
    contentType: "",
    digitalPrice: "",
    digitalQuantity: "",
    physicalPrice: "",
    physicalQuantity: "",
    allowDigitalAccess: false,
    allowPhysicalAccess: false,
  });

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
      }
    },
    [],
  );

  const handleDemoUpload = useCallback(() => {
    // Create a mock file for demo purposes
    const mockFile = new File([""], "nghe-thuat-lanh-dao-hien-dai.pdf", {
      type: "application/pdf",
    });
    setSelectedFile(mockFile);
    startProcessing(mockFile);
  }, []);

  const startProcessing = async (file: File) => {
    setIsProcessing(true);
    const steps = [...PROCESSING_STEPS];

    // Reset all steps to pending
    steps.forEach((step) => (step.status = "pending"));
    setProcessingSteps([...steps]);

    // Simulate processing steps with realistic timing
    for (let i = 0; i < steps.length; i++) {
      steps[i].status = "processing";
      setProcessingSteps([...steps]);

      // Different timing for different steps
      const delays = [2000, 3000, 4000, 3500]; // Upload, encode, vectorize, analyze
      await new Promise((resolve) => setTimeout(resolve, delays[i]));

      steps[i].status = "completed";
      setProcessingSteps([...steps]);

      // Small delay between steps
      if (i < steps.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Simulate AI-generated metadata
    const aiMetadata: BookMetadata = {
      title: "Nghệ Thuật Lãnh Đạo Hiện Đại",
      description:
        "Cuốn sách này cung cấp những phương pháp lãnh đạo tiên tiến, kết hợp giữa tâm lý học và quản trị hiện đại để giúp các nhà lãnh đạo phát triển kỹ năng điều hành đội nhóm hiệu quả.",
      authors: "Nguyễn Văn A; Trần Thị B",
      publishYear: "2023",
      genres: ["Kỹ năng sống", "Kinh doanh"],
      publisher: "NXB Tri Thức",
      pages: Math.floor(file.size / 1000), // Estimate based on file size
      isbn: "978-604-916-000-0",
      contentType: "Kỹ năng",
      digitalPrice: "150000",
      digitalQuantity: "1000",
      physicalPrice: "280000",
      physicalQuantity: "500",
      allowDigitalAccess: true,
      allowPhysicalAccess: true,
    };

    setMetadata(aiMetadata);
    setIsProcessing(false);

    // Show success message briefly before showing form
    setTimeout(() => {
      setShowMetadataForm(true);
    }, 1000);
  };

  const updateMetadata = (field: keyof BookMetadata, value: any) => {
    setMetadata((prev) => ({ ...prev, [field]: value }));
  };

  const toggleGenre = (genre: string) => {
    setMetadata((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const handlePublish = () => {
    console.log("Publishing book with metadata:", metadata);
    alert(
      `✅ Sách "${metadata.title}" đã được xuất bản thành công!\n\nSách của bạn hiện đã có thể được tìm thấy trên nền tảng và người dùng có thể bắt đầu đọc và tương tác với AI chatbot.`,
    );
    // In real app: navigate to book management or library page
  };

  const handleSaveDraft = () => {
    console.log("Saving draft with metadata:", metadata);
    alert(
      `💾 Sách "${metadata.title}" đã được lưu thành bản nháp!\n\nBạn có thể quay lại chỉnh sửa và xuất bản sau.`,
    );
    // In real app: navigate to drafts management page
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Thư viện
            </a>
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
              Tải lên file PDF của bạn và để AI tự động phân tích, tạo metadata
              và chuẩn bị sách cho việc xuất bản trên nền tảng.
            </p>
          </div>
        )}

        {/* File Upload Area */}
        {!selectedFile && (
          <Card className="mb-8 border-2 border-dashed border-blue-200 bg-white/50">
            <CardContent className="p-12">
              <div
                className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
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
                    className="cursor-pointer bg-white hover:bg-blue-50"
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
                      Hoặc thử nghiệm với file mẫu:
                    </p>
                    <Button
                      variant="default"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={handleDemoUpload}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Thử nghiệm với file PDF mẫu
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-4">Chỉ nhận file .pdf</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing Steps */}
        {selectedFile && !showMetadataForm && (
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
                  <div key={step.id} className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.status === "completed"
                          ? "bg-green-100 text-green-600"
                          : step.status === "processing"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {step.status === "completed" ? (
                        <Check className="w-4 h-4" />
                      ) : step.status === "processing" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <span
                      className={`${
                        step.status === "completed"
                          ? "text-green-700 font-medium"
                          : step.status === "processing"
                            ? "text-blue-700 font-medium"
                            : "text-gray-500"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}

                {/* Success message when all steps completed */}
                {!isProcessing &&
                  processingSteps.every(
                    (step) => step.status === "completed",
                  ) && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-green-800 font-medium">
                            Xử lý hoàn tất!
                          </p>
                          <p className="text-green-600 text-sm">
                            AI đã phân tích nội dung và tạo metadata tự động.
                            Đang chuẩn bị form chỉnh sửa...
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata Form */}
        {showMetadataForm && (
          <div className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Thông tin sách (được AI tự động điền)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-2">
                    <Label htmlFor="title">Tiêu đề sách *</Label>
                    <Input
                      id="title"
                      value={metadata.title}
                      onChange={(e) => updateMetadata("title", e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <Label htmlFor="description">Mô tả chi tiết</Label>
                    <Textarea
                      id="description"
                      value={metadata.description}
                      onChange={(e) =>
                        updateMetadata("description", e.target.value)
                      }
                      rows={4}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="authors">Tác giả (phân cách bằng ;)</Label>
                    <Input
                      id="authors"
                      value={metadata.authors}
                      onChange={(e) =>
                        updateMetadata("authors", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="publishYear">Năm xuất bản</Label>
                    <Input
                      id="publishYear"
                      type="number"
                      value={metadata.publishYear}
                      onChange={(e) =>
                        updateMetadata("publishYear", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="publisher">Nhà xuất bản</Label>
                    <Input
                      id="publisher"
                      value={metadata.publisher}
                      onChange={(e) =>
                        updateMetadata("publisher", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="pages">Số trang</Label>
                    <Input
                      id="pages"
                      type="number"
                      value={metadata.pages}
                      readOnly
                      className="mt-1 bg-gray-50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="isbn">ISBN (tùy chọn)</Label>
                    <Input
                      id="isbn"
                      value={metadata.isbn}
                      onChange={(e) => updateMetadata("isbn", e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contentType">Loại nội dung</Label>
                    <Select
                      value={metadata.contentType}
                      onValueChange={(value) =>
                        updateMetadata("contentType", value)
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
                            metadata.genres.includes(genre)
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
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Thông tin kinh doanh
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="digitalPrice">Giá sách điện tử (VNĐ)</Label>
                    <Input
                      id="digitalPrice"
                      type="number"
                      value={metadata.digitalPrice}
                      onChange={(e) =>
                        updateMetadata("digitalPrice", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="digitalQuantity">
                      Số lượng sách điện tử
                    </Label>
                    <Input
                      id="digitalQuantity"
                      type="number"
                      value={metadata.digitalQuantity}
                      onChange={(e) =>
                        updateMetadata("digitalQuantity", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="physicalPrice">Giá sách giấy (VNĐ)</Label>
                    <Input
                      id="physicalPrice"
                      type="number"
                      value={metadata.physicalPrice}
                      onChange={(e) =>
                        updateMetadata("physicalPrice", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="physicalQuantity">Số lượng sách giấy</Label>
                    <Input
                      id="physicalQuantity"
                      type="number"
                      value={metadata.physicalQuantity}
                      onChange={(e) =>
                        updateMetadata("physicalQuantity", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allowDigital"
                      checked={metadata.allowDigitalAccess}
                      onCheckedChange={(checked) =>
                        updateMetadata("allowDigitalAccess", checked)
                      }
                    />
                    <Label htmlFor="allowDigital">
                      Cho phép khai thác sách điện tử
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allowPhysical"
                      checked={metadata.allowPhysicalAccess}
                      onCheckedChange={(checked) =>
                        updateMetadata("allowPhysicalAccess", checked)
                      }
                    />
                    <Label htmlFor="allowPhysical">
                      Cho phép khai thác sách giấy
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
                  setShowMetadataForm(false);
                  setProcessingSteps(PROCESSING_STEPS);
                  setIsProcessing(false);
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
