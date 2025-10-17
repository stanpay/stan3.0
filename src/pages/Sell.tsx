import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Upload, ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";

const Sell = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("기프티콘이 등록되었습니다!");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">기프티콘 판매</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div>
            <Label htmlFor="image" className="text-base font-semibold mb-3 block">
              기프티콘 이미지
            </Label>
            <Card className="border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer">
              <label htmlFor="image" className="cursor-pointer">
                <div className="aspect-video flex flex-col items-center justify-center p-8">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">
                        이미지를 업로드하세요
                      </p>
                    </>
                  )}
                </div>
              </label>
              <input
                id="image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </Card>
          </div>

          {/* Product Name */}
          <div>
            <Label htmlFor="name" className="text-base font-semibold mb-3 block">
              상품명
            </Label>
            <Input
              id="name"
              placeholder="예) 스타벅스 아메리카노 Tall"
              className="h-12 rounded-xl"
            />
          </div>

          {/* Price */}
          <div>
            <Label htmlFor="price" className="text-base font-semibold mb-3 block">
              판매 가격
            </Label>
            <Input
              id="price"
              type="number"
              placeholder="10,000"
              className="h-12 rounded-xl"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-base font-semibold mb-3 block">
              설명
            </Label>
            <Textarea
              id="description"
              placeholder="상품에 대한 설명을 입력하세요"
              className="min-h-32 rounded-xl resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-14 text-lg font-semibold rounded-xl"
          >
            등록하기
          </Button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
};

export default Sell;
