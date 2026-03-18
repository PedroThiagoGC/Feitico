import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Clock, Calendar, Settings2 } from "lucide-react";
import { MinutesSelect } from "@/components/ui/minutes-select";
import ImageUpload from "./ImageUpload";
import { type Database } from "@/integrations/supabase/types";

type Professional = Database["public"]["Tables"]["professionals"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type ProfessionalAvailability = Database["public"]["Tables"]["professional_availability"]["Row"];
type ProfessionalException = Database["public"]["Tables"]["professional_exceptions"]["Row"];
type ProfessionalService = Database["public"]["Tables"]["professional_services"]["Row"];

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
    const { data: salon } = await supabase.from("salons").select("id").limit(1).maybeSingle();
    if (salon) {
      setSalonId(salon.id);
      const { data: pros } = await supabase.from("professionals").select("*").eq("salon_id", salon.id).order("name");
      setProfessionals(pros || []);
      const { data: svcs } = await supabase.from("services").select("*").eq("salon_id", salon.id).order("sort_order");
      setServices(svcs || []);
    }
  }

  async function handleSavePro(e: React.FormEvent) {
    e.preventDefault();
    if (!salonId) { toast.error("Nenhum salão cadastrado. Crie um salão primeiro."); return; }
    const payload = {
      salon_id: salonId,
      name: form.name,
      photo_url: form.photo_url || null,
      commission_type: form.commission_type,
      commission_value: parseFloat(form.commission_value),
      active: form.active,
    };
    if (form.id) {
      const { error } = await supabase.from("professionals").update(payload).eq("id", form.id);
      if (error) toast.error(error.message); else toast.success("Profissional atualizado!");
    } else {
      const { error } = await supabase.from("professionals").insert(payload);
      if (error) toast.error(error.message); else toast.success("Profissional criado!");
    }
    setDialogOpen(false);
    resetForm();
    loadData();
  }

  async function handleDeletePro(id: string) {
    if (!confirm("Excluir profissional?")) return;
    const { error } = await supabase.from("professionals").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Excluído!"); loadData(); }
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
    const { data } = await supabase.from("professional_availability").select("*").eq("professional_id", professionalId).order("weekday");
    setItems(data || []);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("professional_availability").insert({
      professional_id: professionalId,
      weekday: parseInt(form.weekday),
      start_time: form.start_time,
      end_time: form.end_time,
    });
    if (error) toast.error(error.message); else { toast.success("Salvo!"); load(); }
  }

  async function handleDelete(id: string) {
    await supabase.from("professional_availability").delete().eq("id", id);
    toast.success("Removido!"); load();
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
    const { data } = await supabase.from("professional_exceptions").select("*").eq("professional_id", professionalId).order("date");
    setItems(data || []);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) return;
    const { error } = await supabase.from("professional_exceptions").insert({
      professional_id: professionalId,
      date: form.date,
      type: form.type,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      reason: form.reason || null,
    });
    if (error) toast.error(error.message); else { toast.success("Exceção salva!"); load(); setForm({ date: "", type: "day_off", start_time: "", end_time: "", reason: "" }); }
  }

  async function handleDelete(id: string) {
    await supabase.from("professional_exceptions").delete().eq("id", id);
    toast.success("Removido!"); load();
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
    const { data } = await supabase.from("professional_services").select("*").eq("professional_id", professionalId);
    setLinks(data || []);
  }

  async function toggleService(serviceId: string) {
    const existing = links.find((l) => l.service_id === serviceId);
    if (existing) {
      await supabase.from("professional_services").delete().eq("id", existing.id);
    } else {
      await supabase.from("professional_services").insert({ professional_id: professionalId, service_id: serviceId });
    }
    load();
  }

  function getLink(serviceId: string) {
    return links.find((l) => l.service_id === serviceId);
  }

  async function updateOverride(linkId: string, field: string, value: string | number | null) {
    const { error } = await supabase.from("professional_services").update({ [field]: value || null }).eq("id", linkId);
    if (error) toast.error(error.message); else load();
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
