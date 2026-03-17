import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export default function AdminGallery() {
  const [images, setImages] = useState<any[]>([]);
  const [salonId, setSalonId] = useState("");
  const [form, setForm] = useState({ image_url: "", caption: "", sort_order: "0" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: salon } = await supabase.from("salons").select("id").limit(1).maybeSingle();
    if (salon) {
      setSalonId(salon.id);
      const { data } = await supabase.from("gallery_images").select("*").eq("salon_id", salon.id).order("sort_order");
      setImages(data || []);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("gallery_images").insert({
      salon_id: salonId, image_url: form.image_url, caption: form.caption || null,
      sort_order: parseInt(form.sort_order),
    });
    if (error) toast.error(error.message);
    else { toast.success("Imagem adicionada!"); loadData(); setForm({ image_url: "", caption: "", sort_order: "0" }); }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("gallery_images").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Removido!"); loadData(); }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-display text-xl">Galeria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
          <Input placeholder="URL da Imagem" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="bg-secondary border-border font-body flex-1" required />
          <Input placeholder="Legenda" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} className="bg-secondary border-border font-body w-40" />
          <Input placeholder="Ordem" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="bg-secondary border-border font-body w-20" />
          <Button type="submit" className="bg-primary text-primary-foreground font-body"><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </form>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group rounded-lg overflow-hidden border border-border">
              <img src={img.image_url} alt={img.caption || ""} className="w-full aspect-square object-cover" />
              <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(img.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
