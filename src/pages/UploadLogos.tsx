import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Check } from "lucide-react";

const UploadLogos = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = file.name;

        const { error } = await supabase.storage
          .from('brand-logos')
          .upload(fileName, file, {
            upsert: true,
          });

        if (error) throw error;

        setUploadedFiles(prev => [...prev, fileName]);
      }

      toast({
        title: "업로드 완료",
        description: `${files.length}개 파일이 성공적으로 업로드되었습니다.`,
      });
    } catch (error: any) {
      toast({
        title: "업로드 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getPublicUrl = (fileName: string) => {
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/brand-logos/${fileName}`;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">브랜드 로고 업로드</h1>

        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Button disabled={uploading} asChild>
                  <span>
                    {uploading ? "업로드 중..." : "파일 선택"}
                  </span>
                </Button>
              </label>
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <p className="text-sm text-muted-foreground mt-2">
                여러 이미지를 한 번에 선택할 수 있습니다
              </p>
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="font-semibold mb-2">권장 파일명:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>starbucks.png (또는 .svg, .webp)</li>
                <li>baskin.png</li>
                <li>mega.png</li>
                <li>pascucci.png</li>
                <li>twosome.png</li>
              </ul>
            </div>
          </div>
        </Card>

        {uploadedFiles.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              업로드된 파일
            </h2>
            <div className="space-y-4">
              {uploadedFiles.map((fileName, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={getPublicUrl(fileName)} 
                      alt={fileName}
                      className="w-16 h-16 object-contain bg-muted rounded"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{fileName}</p>
                      <p className="text-sm text-muted-foreground break-all">
                        {getPublicUrl(fileName)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UploadLogos;
