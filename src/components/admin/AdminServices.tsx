import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface ServiceForm {
  id?: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  image_url: string;
  category: string;
  is_combo: boolean;
  active: boolean;
  sort_order: string;
}

const emptyService: ServiceForm = {
  name: "", description: "", price: "0", duration: "30",
  image_url: "", category: "", is_combo: false, active: true, sort_order: "0",
};

export default function AdminServices() {
  const [services, setServices] = useState<any[]>([]);
  const [salonId, setSalonId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ServiceForm>(emptyService);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: salon } = await supabase.from("salons").select("id").limit(1).maybeSingle();
    if (salon) {
      setSalonId(salon.id);
      const { data } = await supabase.from("services").select("*").eq("salon_id", salon.id).order("sort_order");
      setServices(data || []);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      salon_id: salonId,
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      duration: parseInt(form.duration),
      image_url: form.image_url || null,
      category: form.category || null,
      is_combo: form.is_combo,
      active: form.active,
      sort_order: parseInt(form.sort_order),
    };

    if (form.id) {
      const { error } = await supabase.from("services").update(payload).eq("id", form.id);
      if (error) toast.error(error.message);
      else toast.success("Serviço atualizado!");
    } else {
      const { error } = await supabase.from("services").insert(payload);
      if (error) toast.error(error.message);
      else toast.success("Serviço criado!");
    }
    setSaving(false);
    setDialogOpen(false);
    setForm(emptyService);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Serviço excluído!"); loadData(); }
  }

  function openEdit(service: any) {
    setForm({
      id: service.id,
      name: service.name,
      description: service.description || "",
      price: String(service.price),
      duration: String(service.duration),
      image_url: service.image_url || "",
      category: service.category || "",
      is_combo: service.is_combo,
      active: service.active,
      sort_order: String(service.sort_order),
    });
    setDialogOpen(true);
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-xl">Serviços</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setForm(emptyService); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-primary-foreground font-body">
              <Plus className="w-4 h-4 mr-1" /> Novo
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{form.id ? "Editar" : "Novo"} Serviço</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <Input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border font-body" required />
              <Input placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border font-body" />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Preço" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-secondary border-border font-body" />
                <Input placeholder="Duração (min)" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="bg-secondary border-border font-body" />
              </div>
              <Input placeholder="URL da Imagem" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="bg-secondary border-border font-body" />
              <Input placeholder="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-secondary border-border font-body" />
              <Input placeholder="Ordem" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="bg-secondary border-border font-body" />
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 font-body text-sm">
                  <Switch checked={form.is_combo} onCheckedChange={(v) => setForm({ ...form, is_combo: v })} /> Combo
                </label>
                <label className="flex items-center gap-2 font-body text-sm">
                  <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /> Ativo
                </label>
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground font-body" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {services.length === 0 ? (
          <p className="text-muted-foreground font-body text-sm">Nenhum serviço cadastrado.</p>
        ) : (
          <div className="space-y-3">
            {services.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border">
                <div className="flex-1 min-w-0">
                  <p className="font-body font-medium text-foreground truncate">{s.name}</p>
                  <p className="font-body text-sm text-muted-foreground">
                    R$ {Number(s.price).toFixed(2)} · {s.duration}min
                    {s.is_combo && " · Combo"}
                    {!s.active && " · Inativo"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
