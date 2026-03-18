import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { appToast } from "@/lib/toast";
import { professionalSchema } from "@/schemas/professional.schema";
import { Plus, Pencil, Trash2, Clock, Calendar, Settings2 } from "lucide-react";
import { MinutesSelect } from "@/components/ui/minutes-select";
import ImageUpload from "./ImageUpload";

type Professional = {
  id: string;
  salon_id: string;
  name: string;
  photo_url: string | null;
  commission_type: string;
  commission_value: number;
  active: boolean;
};

type Service = {
  id: string;
  salon_id: string;
  name: string;
  price: number;
  duration: number;
  buffer_minutes: number;
  sort_order: number;
};

type ProfessionalAvailability = {
  id: string;
  professional_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  active: boolean;
};

type ProfessionalException = {
  id: string;
  professional_id: string;
  date: string;
  type: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
};

type ProfessionalService = {
  id: string;
  professional_id: string;
  service_id: string;
  custom_price: number | null;
  custom_duration_minutes: number | null;
  custom_buffer_minutes: number | null;
  commission_override_type: string | null;
  commission_override_value: number | null;
};

const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function AdminProfessionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [salonId, setSalonId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [form, setForm] = useState({
    id: "",
    name: "",
    photo_url: "",
    commission_type: "percentage",
    commission_value: "0",
    active: true,
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const salon = await api.getSalon();
    if (!salon?.id) return;

    setSalonId(salon.id);
    const [pros, svcs] = await Promise.all([
      api.getProfessionals(salon.id),
      api.getServices(salon.id),
    ]);

    setProfessionals((pros || []) as Professional[]);
    setServices((svcs || []) as Service[]);
  }

  async function handleSavePro(e: React.FormEvent) {
    e.preventDefault();
    if (!salonId) { appToast.error("Nenhum salão cadastrado. Crie um salão primeiro."); return; }

    const validation = professionalSchema.safeParse({
      name: form.name,
      photo_url: form.photo_url || null,
      commission_type: form.commission_type,
      commission_value: form.commission_value,
      active: form.active,
    });
    if (!validation.success) {
      appToast.error(validation.error.errors[0]?.message || "Dados inválidos");
      return;
    }

    const parsed = validation.data;
    const payload = {
      salon_id: salonId,
      name: parsed.name,
      photo_url: parsed.photo_url,
      commission_type: parsed.commission_type,
      commission_value: parsed.commission_value,
      active: parsed.active,
    };
    try {
      if (form.id) {
        await api.updateProfessional(form.id, payload);
        appToast.success("Profissional atualizado!");
      } else {
        await api.createProfessional(payload);
        appToast.success("Profissional criado!");
      }
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Erro ao salvar profissional");
    }
    setDialogOpen(false);
    resetForm();
    loadData();
  }

  async function handleDeletePro(id: string) {
    if (!confirm("Excluir profissional?")) return;
    try {
      await api.deleteProfessional(id);
      appToast.success("Excluído!");
      loadData();
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Erro ao excluir profissional");
    }
  }

  function resetForm() {
    setForm({ id: "", name: "", photo_url: "", commission_type: "percentage", commission_value: "0", active: true });
  }

  function openEdit(pro: Professional) {
    setForm({
      id: pro.id,
      name: pro.name,
      photo_url: pro.photo_url || "",
      commission_type: pro.commission_type,
      commission_value: String(pro.commission_value),
      active: pro.active,
    });
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Professional CRUD */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-xl">Profissionais</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary text-primary-foreground font-body">
                <Plus className="w-4 h-4 mr-1" /> Novo
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">{form.id ? "Editar" : "Novo"} Profissional</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSavePro} className="space-y-4">
                <div>
                  <label className="font-body text-sm font-medium mb-1 block">Nome do profissional</label>
                  <Input placeholder="Ex: João Silva" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border font-body" required />
                </div>
                <div>
                  <label className="font-body text-sm font-medium mb-1 block">Foto</label>
                  <ImageUpload value={form.photo_url} onChange={(url) => setForm({ ...form, photo_url: url })} folder="professionals" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-body text-sm">Tipo de comissão</label>
                    <Select value={form.commission_type} onValueChange={(v) => setForm({ ...form, commission_type: v })}>
                      <SelectTrigger className="bg-secondary border-border font-body"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="percentage">Percentual (%)</SelectItem>
                        <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="font-body text-sm">Valor da comissão</label>
                    <Input type="number" step="0.01" value={form.commission_value} onChange={(e) => setForm({ ...form, commission_value: e.target.value })} className="bg-secondary border-border font-body" />
                  </div>
                </div>
                <label className="flex items-center gap-2 font-body text-sm">
                  <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /> Ativo
                </label>
                <Button type="submit" className="w-full bg-primary text-primary-foreground font-body">Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {professionals.length === 0 ? (
            <p className="text-muted-foreground font-body text-sm">Nenhum profissional cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {professionals.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border">
                  <div className="flex items-center gap-3">
                    {p.photo_url && <img src={p.photo_url} alt={p.name} className="w-10 h-10 rounded-full object-cover" />}
                    <div>
                      <p className="font-body font-medium text-foreground">{p.name}</p>
                      <p className="font-body text-xs text-muted-foreground">
                        Comissão: {p.commission_type === "percentage" ? `${p.commission_value}%` : `R$ ${Number(p.commission_value).toFixed(2)}`}
                        {!p.active && " · Inativo"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedPro(selectedPro?.id === p.id ? null : p)} title="Configurar">
                      <Settings2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeletePro(p.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected professional config */}
      {selectedPro && (
        <Tabs defaultValue="availability" className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-display text-lg font-bold text-foreground">{selectedPro.name}</h3>
          </div>
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="availability" className="font-body text-sm"><Clock className="w-3 h-3 mr-1" />Disponibilidade</TabsTrigger>
            <TabsTrigger value="exceptions" className="font-body text-sm"><Calendar className="w-3 h-3 mr-1" />Exceções</TabsTrigger>
            <TabsTrigger value="services" className="font-body text-sm"><Settings2 className="w-3 h-3 mr-1" />Serviços</TabsTrigger>
          </TabsList>
          <TabsContent value="availability">
            <ProfessionalAvailabilityEditor professionalId={selectedPro.id} />
          </TabsContent>
          <TabsContent value="exceptions">
            <ProfessionalExceptionsEditor professionalId={selectedPro.id} />
          </TabsContent>
          <TabsContent value="services">
            <ProfessionalServicesEditor professionalId={selectedPro.id} services={services} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// --- Availability Editor ---
function ProfessionalAvailabilityEditor({ professionalId }: { professionalId: string }) {
  const [items, setItems] = useState<ProfessionalAvailability[]>([]);
  const [form, setForm] = useState({ weekday: "1", start_time: "09:00", end_time: "19:00" });

  useEffect(() => { load(); }, [professionalId]);

  async function load() {
    const data = await api.getProfessionalAvailability(professionalId);
    setItems((data || []) as ProfessionalAvailability[]);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createProfessionalAvailability(professionalId, {
        weekday: parseInt(form.weekday, 10),
        start_time: form.start_time,
        end_time: form.end_time,
        active: true,
      });
      appToast.success("Salvo!");
      load();
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Erro ao salvar disponibilidade");
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteProfessionalAvailability(id);
      appToast.success("Removido!");
      load();
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Erro ao remover disponibilidade");
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-6 space-y-4">
        <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="font-body text-sm">Dia</label>
            <Select value={form.weekday} onValueChange={(v) => setForm({ ...form, weekday: v })}>
              <SelectTrigger className="bg-secondary border-border font-body w-36"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                {WEEKDAY_LABELS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="font-body text-sm">Início</label>
            <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="bg-secondary border-border font-body" />
          </div>
          <div>
            <label className="font-body text-sm">Fim</label>
            <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="bg-secondary border-border font-body" />
          </div>
          <Button type="submit" className="bg-primary text-primary-foreground font-body"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
        </form>
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border">
              <span className="font-body text-sm">{WEEKDAY_LABELS[i.weekday]}: {i.start_time} - {i.end_time}</span>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(i.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Exceptions Editor ---
function ProfessionalExceptionsEditor({ professionalId }: { professionalId: string }) {
  const [items, setItems] = useState<ProfessionalException[]>([]);
  const [form, setForm] = useState({ date: "", type: "day_off", start_time: "", end_time: "", reason: "" });

  useEffect(() => { load(); }, [professionalId]);

  async function load() {
    const data = await api.getProfessionalExceptions(professionalId);
    setItems((data || []) as ProfessionalException[]);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) return;
    try {
      await api.createProfessionalException(professionalId, {
        date: form.date,
        type: form.type,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        reason: form.reason || null,
      });
      appToast.success("Exceção salva!");
      load();
      setForm({ date: "", type: "day_off", start_time: "", end_time: "", reason: "" });
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Erro ao salvar exceção");
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteProfessionalException(id);
      appToast.success("Removido!");
      load();
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Erro ao remover exceção");
    }
  }

  const typeLabels: Record<string, string> = { day_off: "Folga", blocked: "Bloqueio", custom_hours: "Horário especial" };

  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-6 space-y-4">
        <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="font-body text-sm">Data</label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-secondary border-border font-body" required />
          </div>
          <div>
            <label className="font-body text-sm">Tipo</label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger className="bg-secondary border-border font-body w-40"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="day_off">Folga</SelectItem>
                <SelectItem value="blocked">Bloqueio parcial</SelectItem>
                <SelectItem value="custom_hours">Horário especial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(form.type === "blocked" || form.type === "custom_hours") && (
            <>
              <div>
                <label className="font-body text-sm">Início</label>
                <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="bg-secondary border-border font-body" />
              </div>
              <div>
                <label className="font-body text-sm">Fim</label>
                <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="bg-secondary border-border font-body" />
              </div>
            </>
          )}
          <div>
            <label className="font-body text-sm">Motivo</label>
            <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="bg-secondary border-border font-body" placeholder="Opcional" />
          </div>
          <Button type="submit" className="bg-primary text-primary-foreground font-body"><Plus className="w-4 h-4 mr-1" /> Salvar</Button>
        </form>
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border">
              <span className="font-body text-sm">
                {i.date} — <span className="font-semibold">{typeLabels[i.type] || i.type}</span>
                {i.start_time && i.end_time && ` (${i.start_time} - ${i.end_time})`}
                {i.reason && ` — ${i.reason}`}
              </span>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(i.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Professional Services Editor ---
function ProfessionalServicesEditor({ professionalId, services }: { professionalId: string; services: Service[] }) {
  const [links, setLinks] = useState<ProfessionalService[]>([]);

  useEffect(() => { load(); }, [professionalId]);

  async function load() {
    const data = await api.getProfessionalServices(professionalId);
    setLinks((data || []) as ProfessionalService[]);
  }

  async function toggleService(serviceId: string) {
    const existing = links.find((l) => l.service_id === serviceId);
    if (existing) {
      await api.deleteProfessionalServiceLink(existing.id);
    } else {
      await api.createProfessionalServiceLink(professionalId, { service_id: serviceId, active: true });
    }
    load();
  }

  function getLink(serviceId: string) {
    return links.find((l) => l.service_id === serviceId);
  }

  async function updateOverride(linkId: string, field: string, value: string | number | null) {
    try {
      await api.updateProfessionalServiceLink(linkId, { [field]: value || null });
      load();
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Erro ao atualizar vínculo");
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-6 space-y-3">
        {services.map((s) => {
          const link = getLink(s.id);
          const isLinked = !!link;
          return (
            <div key={s.id} className="p-3 rounded-lg bg-secondary border border-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch checked={isLinked} onCheckedChange={() => toggleService(s.id)} />
                  <div>
                    <p className="font-body font-medium text-foreground text-sm">{s.name}</p>
                    <p className="font-body text-xs text-muted-foreground">
                      R$ {Number(s.price).toFixed(2)} · {s.duration}min + {s.buffer_minutes}min margem = {s.duration + s.buffer_minutes}min total
                    </p>
                  </div>
                </div>
              </div>
              {isLinked && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pl-12">
                  <div>
                    <label className="font-body text-xs text-muted-foreground">Preço custom</label>
                    <Input type="number" step="0.01" placeholder={String(s.price)} value={link.custom_price ?? ""} onChange={(e) => updateOverride(link.id, "custom_price", e.target.value ? parseFloat(e.target.value) : null)} className="bg-background border-border font-body text-xs h-8" />
                  </div>
                  <div>
                    <label className="font-body text-xs text-muted-foreground">Duração (min)</label>
                    <MinutesSelect
                      value={link.custom_duration_minutes ? String(link.custom_duration_minutes) : ""}
                      onChange={(v) => updateOverride(link.id, "custom_duration_minutes", v === "none" ? null : parseInt(v))}
                      min={5} max={480} placeholder={`${s.duration} min`}
                      className="bg-background text-xs h-8" allowEmpty
                    />
                  </div>
                  <div>
                    <label className="font-body text-xs text-muted-foreground">Margem (min)</label>
                    <MinutesSelect
                      value={link.custom_buffer_minutes ? String(link.custom_buffer_minutes) : ""}
                      onChange={(v) => updateOverride(link.id, "custom_buffer_minutes", v === "none" ? null : parseInt(v))}
                      min={0} max={120} placeholder={`${s.buffer_minutes} min`}
                      className="bg-background text-xs h-8" allowEmpty
                    />
                  </div>
                  <div>
                    <label className="font-body text-xs text-muted-foreground">Comissão override</label>
                    <div className="flex gap-1">
                      <Select value={link.commission_override_type || ""} onValueChange={(v) => updateOverride(link.id, "commission_override_type", v || null)}>
                        <SelectTrigger className="bg-background border-border font-body text-xs h-8 w-20"><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="percentage">%</SelectItem>
                          <SelectItem value="fixed">R$</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input type="number" step="0.01" value={link.commission_override_value ?? ""} onChange={(e) => updateOverride(link.id, "commission_override_value", e.target.value ? parseFloat(e.target.value) : null)} className="bg-background border-border font-body text-xs h-8" placeholder="Valor" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
