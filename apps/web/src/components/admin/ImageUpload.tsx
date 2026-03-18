import { useState, useRef } from "react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { appToast } from "@/lib/toast";
import { Upload, Loader2, X } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  className?: string;
}

export default function ImageUpload({ value, onChange, folder = "general", className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function fileToBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
      reader.readAsDataURL(file);
    });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      appToast.error("Apenas imagens são permitidas");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      appToast.error("Arquivo muito grande (máx. 5MB)");
      return;
    }

    setUploading(true);
    try {
      const dataBase64 = await fileToBase64(file);
      const result = await api.uploadImage({
        folder,
        fileName: file.name,
        mimeType: file.type,
        dataBase64,
      });

      onChange(result.url);
      appToast.success("Imagem enviada!");
    } catch (error) {
      appToast.error(error instanceof Error ? `Erro ao fazer upload: ${error.message}` : "Erro ao fazer upload");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={className}>
      <div className="flex gap-2 items-center">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL da imagem ou faça upload"
          className="bg-secondary border-border font-body flex-1"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          aria-label="Selecionar imagem"
          title="Selecionar imagem"
          onChange={handleUpload}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="border-border shrink-0"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange("")}
            className="text-destructive shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      {value && (
        <img src={value} alt="Preview" className="mt-2 h-20 rounded-lg object-cover border border-border" />
      )}
    </div>
  );
}
