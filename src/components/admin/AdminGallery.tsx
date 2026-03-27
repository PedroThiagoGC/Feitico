import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import ImageUpload from "./ImageUpload";
import {
  useCreateGalleryImageMutation,
  useDeleteGalleryImageMutation,
  useGallery,
} from "@/hooks/useGallery";
import { useSalon } from "@/hooks/useSalon";
import { getErrorMessage } from "@/hooks/useQueryError";

const PAGE_SIZE = 20;

export default function AdminGallery() {
  const { data: salon, error: salonError, isLoading: salonLoading } = useSalon();
  const { data: images = [], error, isLoading } = useGallery(salon?.id);
  const createImage = useCreateGalleryImageMutation();
  const deleteImage = useDeleteGalleryImageMutation();

  const [form, setForm] = useState({ image_url: "", caption: "", sort_order: "0" });
  const [page, setPage] = useState(0);

  const visibleImages = useMemo(() => images.slice(0, (page + 1) * PAGE_SIZE), [images, page]);
  const hasMore = images.length > visibleImages.length;
  const errorMessage = getErrorMessage(salonError ?? error);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();

    if (!salon?.id) {
      toast.error("Nenhum salao cadastrado.");
      return;
    }

    if (!form.image_url.trim()) {
      toast.error("Adicione uma imagem.");
      return;
    }

    try {
      await createImage.mutateAsync({
        salon_id: salon.id,
        image_url: form.image_url.trim(),
        caption: form.caption.trim() || null,
        sort_order: Number.parseInt(form.sort_order || "0", 10),
      });
      toast.success("Imagem adicionada.");
      setForm({ image_url: "", caption: "", sort_order: "0" });
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteImage.mutateAsync(id);
      toast.success("Imagem removida.");
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  if (salonLoading || isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <p className="font-body text-sm text-muted-foreground">Carregando galeria...</p>
        </CardContent>
      </Card>
    );
  }

  if (errorMessage) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <p className="font-body text-sm text-destructive">{errorMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-display text-xl">Galeria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleAdd} className="space-y-3">
          <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="gallery" />
          <div className="flex gap-3 items-end">
            <Input
              placeholder="Legenda"
              value={form.caption}
              onChange={(event) => setForm({ ...form, caption: event.target.value })}
              className="bg-secondary border-border font-body flex-1"
            />
            <Input
              placeholder="Ordem"
              type="number"
              value={form.sort_order}
              onChange={(event) => setForm({ ...form, sort_order: event.target.value })}
              className="bg-secondary border-border font-body w-20"
            />
            <Button type="submit" className="bg-primary text-primary-foreground font-body" disabled={createImage.isPending}>
              <Plus className="w-4 h-4 mr-1" /> {createImage.isPending ? "Salvando..." : "Add"}
            </Button>
          </div>
        </form>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {visibleImages.map((image) => (
            <div key={image.id} className="relative group rounded-lg overflow-hidden border border-border">
              <img src={image.image_url} alt={image.caption || ""} className="w-full aspect-square object-cover" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => void handleDelete(image.id)}
                disabled={deleteImage.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              {image.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-2 py-1">
                  <p className="font-body text-xs text-foreground truncate">{image.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        {visibleImages.length === 0 && (
          <p className="text-muted-foreground font-body text-sm">Nenhuma imagem cadastrada.</p>
        )}
        {hasMore && (
          <div className="flex justify-center pt-2">
            <Button variant="outline" className="font-body" onClick={() => setPage((current) => current + 1)}>
              Carregar mais
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
