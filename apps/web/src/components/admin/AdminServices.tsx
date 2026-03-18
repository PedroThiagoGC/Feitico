import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { appToast } from "@/lib/toast";
import { serviceSchema } from "@/schemas/service.schema";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { MinutesSelect } from "@/components/ui/minutes-select";

type ServiceRow = {
  id: string;
  salon_id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  buffer_minutes: number;
  image_url: string | null;
  category: string | null;
  is_combo: boolean;
  active: boolean;
  sort_order: number;
};

interface ServiceForm {
  id?: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  buffer_minutes: string;
  image_url: string;
  category: string;
  is_combo: boolean;
  active: boolean;
  sort_order: string;
}

const emptyService: ServiceForm = {
  name: "", description: "", price: "0", duration: "5", buffer_minutes: "0",
  image_url: "", category: "", is_combo: false, active: true, sort_order: "0",
};

export default function AdminServices() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [salonId, setSalonId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ServiceForm>(emptyService);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const salon = await api.getSalon();
    if (!salon?.id) return;

    setSalonId(salon.id);
    const data = await api.getServices(salon.id);
    setServices((data || []) as ServiceRow[]);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!salonId) { appToast.error("Nenhum salão cadastrado. Crie um salão primeiro."); return; }

    const validation = serviceSchema.safeParse({
      name: form.name,
      description: form.description,
      price: form.price,
      duration: form.duration,
      buffer_minutes: form.buffer_minutes,
      image_url: form.image_url,
      category: form.category,
      is_combo: form.is_combo,
      active: form.active,
      sort_order: form.sort_order,
    });
    if (!validation.success) {
      appToast.error(validation.error.errors[0]?.message || "Dados inválidos");
      return;
    }

    setSaving(true);
    const parsed = validation.data;
    const payload = {
      salon_id: salonId,
      name: parsed.name,
      description: parsed.description || null,
      price: parsed.price,
      duration: parsed.duration,
      buffer_minutes: parsed.buffer_minutes,
      image_url: parsed.image_url || null,
      category: parsed.category || null,
      is_combo: parsed.is_combo,
      active: parsed.active,
      sort_order: parsed.sort_order,
    };

    if (form.id) {
      try {
        await api.updateService(form.id, payload);
        appToast.success("Serviço atualizado!");
      } catch (error) {
        appToast.error(error instanceof Error ? error.message : "Erro ao atualizar serviço");
      }
    } else {
      try {
        await api.createService(payload);
        appToast.success("Serviço criado!");
      } catch (error) {
        appToast.error(error instanceof Error ? error.message : "Erro ao criar serviço");
      }
    }
    setSaving(false);
    setDialogOpen(false);
    setForm(emptyService);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir serviço?")) return;
    try {
      await api.deleteService(id);
      appToast.success("Excluído!");
      loadData();
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Erro ao excluir serviço");
    }
  }

  function openEdit(service: ServiceRow) {
    setForm({
      id: service.id,
      name: service.name,
      description: service.description || "",
      price: String(service.price),
      duration: String(service.duration),
      buffer_minutes: String(service.buffer_minutes || 0),
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
              <div>
                <label className="font-body text-sm font-medium mb-1 block">Nome do serviço</label>
                <Input placeholder="Ex: Corte masculino" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border font-body" required />
              </div>
              <div>
                <label className="font-body text-sm font-medium mb-1 block">Descrição</label>
                <Input placeholder="Descrição opcional do serviço" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border font-body" />
              </div>
              <div>
                <label className="font-body text-sm font-medium mb-1 block">Preço (R$)</label>
                <Input placeholder="0.00" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-secondary border-border font-body" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-sm">Duração (min)</label>
                  <MinutesSelect value={form.duration} onChange={(v) => setForm({ ...form, duration: v })} min={5} max={480} placeholder="Duração" />
                </div>
                <div>
                  <label className="font-body text-sm">Margem operacional (min)</label>
                  <MinutesSelect value={form.buffer_minutes} onChange={(v) => setForm({ ...form, buffer_minutes: v })} min={0} max={120} placeholder="Margem" />
                </div>
              </div>
              {/* Occupation summary */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 font-body text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duração do serviço:</span>
                  <span className="text-foreground font-medium">{form.duration} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Margem entre atendimentos:</span>
                  <span className="text-foreground font-medium">{form.buffer_minutes} min</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1">
                  <span className="text-muted-foreground font-semibold">Tempo total na agenda:</span>
                  <span className="text-primary font-bold">{parseInt(form.duration || "0") + parseInt(form.buffer_minutes || "0")} min</span>
                </div>
              </div>
              <div>
                <label className="font-body text-sm font-medium mb-1 block">URL da Imagem</label>
                <Input placeholder="https://..." value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="bg-secondary border-border font-body" />
              </div>
              <div>
                <label className="font-body text-sm font-medium mb-1 block">Categoria</label>
                <Input placeholder="Ex: Cabelo, Barba" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-secondary border-border font-body" />
              </div>
              <div>
                <label className="font-body text-sm font-medium mb-1 block">Ordem de exibição</label>
                <Input placeholder="0" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="bg-secondary border-border font-body" />
              </div>
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
                    R$ {Number(s.price).toFixed(2)} · {s.duration}min + {s.buffer_minutes || 0}min margem = {s.duration + (s.buffer_minutes || 0)}min total
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
