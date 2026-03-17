import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Star } from "lucide-react";

export default function AdminTestimonials() {
  const [items, setItems] = useState<any[]>([]);
  const [salonId, setSalonId] = useState("");
  const [form, setForm] = useState({ author_name: "", content: "", rating: "5", author_image: "" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: salon } = await supabase.from("salons").select("id").limit(1).maybeSingle();
    if (salon) {
      setSalonId(salon.id);
      const { data } = await supabase.from("testimonials").select("*").eq("salon_id", salon.id);
      setItems(data || []);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("testimonials").insert({
      salon_id: salonId, author_name: form.author_name, content: form.content,
      rating: parseInt(form.rating), author_image: form.author_image || null, active: true,
    });
    if (error) toast.error(error.message);
    else { toast.success("Depoimento adicionado!"); loadData(); setForm({ author_name: "", content: "", rating: "5", author_image: "" }); }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Removido!"); loadData(); }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-display text-xl">Depoimentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Nome do autor" value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} className="bg-secondary border-border font-body" required />
            <Input placeholder="URL foto (opcional)" value={form.author_image} onChange={(e) => setForm({ ...form, author_image: e.target.value })} className="bg-secondary border-border font-body" />
          </div>
          <Textarea placeholder="Conteúdo do depoimento" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="bg-secondary border-border font-body" required />
          <div className="flex gap-3 items-end">
            <div>
              <label className="font-body text-sm">Nota (1-5)</label>
              <Input type="number" min="1" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className="bg-secondary border-border font-body w-20" />
            </div>
            <Button type="submit" className="bg-primary text-primary-foreground font-body"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
          </div>
        </form>
        <div className="space-y-3">
          {items.map((t) => (
            <div key={t.id} className="flex items-start justify-between p-3 rounded-lg bg-secondary border border-border">
              <div>
                <div className="flex gap-1 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < t.rating ? "text-primary fill-primary" : "text-muted-foreground"}`} />
                  ))}
                </div>
                <p className="font-body text-sm text-foreground italic">"{t.content}"</p>
                <p className="font-body text-xs text-muted-foreground mt-1">— {t.author_name}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
