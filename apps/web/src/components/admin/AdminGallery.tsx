import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appToast } from "@/lib/toast";
import { Pencil, Plus, Trash2 } from "lucide-react";
import ImageUpload from "./ImageUpload";

type GalleryImage = {
  id: string;
  salon_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
};

export default function AdminGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [salonId, setSalonId] = useState("");
  const [form, setForm] = useState({ id: "", image_url: "", caption: "", sort_order: "0" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const salon = await api.getSalon();
    if (!salon?.id) return;

    setSalonId(salon.id);
    const data = await api.getGallery(salon.id);
    setImages((data || []) as GalleryImage[]);
  }

  function resetForm() {
    setForm({ id: "", image_url: "", caption: "", sort_order: "0" });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.image_url) { appToast.error("Adicione uma imagem"); return; }

    const payload = {
      salon_id: salonId,
      image_url: form.image_url,
      caption: form.caption || null,
      sort_order: parseInt(form.sort_order) || 0,
    };

    try {
      if (form.id) {
        await api.updateGalleryImage(form.id, payload);
      } else {
        await api.createGalleryImage(payload);
      }
      appToast.success(form.id ? "Imagem atualizada!" : "Imagem adicionada!");
      loadData();
      resetForm();
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Erro ao salvar imagem");
    }
  }

  function handleEdit(image: GalleryImage) {
    setForm({
      id: image.id,
      image_url: image.image_url,
      caption: image.caption || "",
      sort_order: String(image.sort_order || 0),
    });
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteGalleryImage(id);
      appToast.success("Removido!");
      if (form.id === id) resetForm();
      loadData();
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Erro ao remover imagem");
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-display text-xl">Galeria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSave} className="space-y-3">
          <ImageUpload
            value={form.image_url}
            onChange={(url) => setForm({ ...form, image_url: url })}
            folder="gallery"
          />
          <div className="flex gap-3 items-end">
            <Input placeholder="Legenda" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} className="bg-secondary border-border font-body flex-1" />
            <Input placeholder="Ordem" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="bg-secondary border-border font-body w-20" />
            <Button type="submit" className="bg-primary text-primary-foreground font-body">
              {form.id ? <><Pencil className="w-4 h-4 mr-1" /> Salvar</> : <><Plus className="w-4 h-4 mr-1" /> Add</>}
            </Button>
            {form.id && (
              <Button type="button" variant="outline" className="font-body" onClick={resetForm}>
                Cancelar edição
              </Button>
            )}
          </div>
        </form>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group rounded-lg overflow-hidden border border-border">
              <img src={img.image_url} alt={img.caption || ""} className="w-full aspect-square object-cover" />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="icon" onClick={() => handleEdit(img)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => handleDelete(img.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {img.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-2 py-1">
                  <p className="font-body text-xs text-foreground truncate">{img.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
