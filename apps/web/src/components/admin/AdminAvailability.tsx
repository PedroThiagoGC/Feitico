import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { appToast } from "@/lib/toast";
import { Plus, Trash2, Clock, User, Calendar, Save } from "lucide-react";

const WEEKDAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

interface AvailabilityRow {
  id: string;
  professional_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  active: boolean;
}

interface ExceptionRow {
  id: string;
  professional_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  type: string;
  reason: string | null;
}

interface Professional {
  id: string;
  name: string;
  photo_url: string | null;
}

export default function AdminAvailability() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProId, setSelectedProId] = useState("");
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionRow[]>([]);
  const [saving, setSaving] = useState(false);

  // Exception form
  const [excForm, setExcForm] = useState({
    date: "",
    type: "day_off",
    start_time: "",
    end_time: "",
    reason: "",
  });

  useEffect(() => {
    loadProfessionals();
  }, []);

  useEffect(() => {
    if (selectedProId) {
      loadAvailability();
      loadExceptions();
    }
  }, [selectedProId]);

  async function loadProfessionals() {
    const salon = await api.getSalon();
    if (!salon?.id) return;
    const data = await api.getProfessionals(salon.id);
    if (data && data.length > 0) {
      setProfessionals(data as Professional[]);
      setSelectedProId(data[0].id);
    }
  }

  async function loadAvailability() {
    const data = await api.getProfessionalAvailability(selectedProId);
    const sorted = [...(data || [])].sort((a, b) => a.weekday - b.weekday);
    setAvailability((sorted as AvailabilityRow[]) || []);
  }

  async function loadExceptions() {
    const data = await api.getProfessionalExceptions(selectedProId);
    setExceptions((data as ExceptionRow[]) || []);
  }

  // Build a map: weekday -> row (or null if not set)
  const weekdayMap = new Map<number, AvailabilityRow>();
  availability.forEach((a) => weekdayMap.set(a.weekday, a));

  async function toggleWeekday(weekday: number) {
    const existing = weekdayMap.get(weekday);
    if (existing) {
      try {
        await api.updateProfessionalAvailability(existing.id, { active: !existing.active });
        loadAvailability();
      } catch (error) {
        appToast.error(error instanceof Error ? error.message : "Erro ao atualizar dia");
      }
    } else {
      try {
        await api.createProfessionalAvailability(selectedProId, {
          weekday,
          start_time: "09:00",
          end_time: "19:00",
          active: true,
        });
        appToast.success("Dia adicionado!");
        loadAvailability();
      } catch (error) {
        appToast.error(error instanceof Error ? error.message : "Erro ao adicionar dia");
      }
    }
  }

  async function updateTime(id: string, field: "start_time" | "end_time", value: string) {
    setAvailability((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  }

  async function saveAvailability() {
    setSaving(true);
    try {
      for (const row of availability) {
        await api.updateProfessionalAvailability(row.id, {
          start_time: row.start_time,
          end_time: row.end_time,
        });
      }
      appToast.success("Horários salvos!");
    } catch (err: unknown) {
      appToast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
    setSaving(false);
  }

  async function deleteAvailability(id: string) {
    try {
      await api.deleteProfessionalAvailability(id);
      appToast.success("Removido!");
      loadAvailability();
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Erro ao remover disponibilidade");
    }
  }

  async function addException(e: React.FormEvent) {
    e.preventDefault();
    if (!excForm.date) return;
    const payload: {
      professional_id: string;
      date: string;
      type: string;
      reason: string | null;
      start_time?: string | null;
      end_time?: string | null;
    } = {
      professional_id: selectedProId,
      date: excForm.date,
      type: excForm.type,
      reason: excForm.reason || null,
    };
    if (excForm.type !== "day_off") {
      payload.start_time = excForm.start_time || null;
      payload.end_time = excForm.end_time || null;
    }
    try {
      await api.createProfessionalException(selectedProId, payload);
      appToast.success("Exceção adicionada!");
      loadExceptions();
      setExcForm({ date: "", type: "day_off", start_time: "", end_time: "", reason: "" });
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Erro ao adicionar exceção");
    }
  }

  async function deleteException(id: string) {
    try {
      await api.deleteProfessionalException(id);
      appToast.success("Removido!");
      loadExceptions();
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Erro ao remover exceção");
    }
  }

  const selectedPro = professionals.find((p) => p.id === selectedProId);

  return (
    <div className="space-y-6">
      {/* Professional Selector */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-xl flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Disponibilidade dos Profissionais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {professionals.map((pro) => (
              <button
                key={pro.id}
                type="button"
                onClick={() => setSelectedProId(pro.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all font-body text-sm ${
                  selectedProId === pro.id
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-secondary hover:border-primary/30 text-muted-foreground"
                }`}
              >
                {pro.photo_url ? (
                  <img src={pro.photo_url} alt={pro.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><User className="w-4 h-4" /></div>
                )}
                {pro.name}
              </button>
            ))}
          </div>
          {professionals.length === 0 && (
            <p className="text-muted-foreground font-body text-sm">Cadastre profissionais primeiro.</p>
          )}
        </CardContent>
      </Card>

      {selectedProId && (
        <>
          {/* Weekly Schedule */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Horários Semanais — {selectedPro?.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {WEEKDAYS.map((day) => {
                const row = weekdayMap.get(day.value);
                const isActive = row?.active ?? false;
                return (
                  <div key={day.value} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    isActive ? "border-primary/30 bg-primary/5" : "border-border bg-secondary"
                  }`}>
                    <Switch
                      checked={isActive}
                      onCheckedChange={() => toggleWeekday(day.value)}
                    />
                    <span className={`font-body text-sm w-32 ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {day.label}
                    </span>
                    {isActive && row ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={row.start_time.slice(0, 5)}
                          onChange={(e) => updateTime(row.id, "start_time", e.target.value)}
                          className="bg-secondary border-border font-body w-28 h-9 text-sm"
                        />
                        <span className="text-muted-foreground text-sm">até</span>
                        <Input
                          type="time"
                          value={row.end_time.slice(0, 5)}
                          onChange={(e) => updateTime(row.id, "end_time", e.target.value)}
                          className="bg-secondary border-border font-body w-28 h-9 text-sm"
                        />
                        <Button variant="ghost" size="icon" onClick={() => deleteAvailability(row.id)} className="text-destructive shrink-0 h-9 w-9">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground font-body text-xs">Folga</span>
                    )}
                  </div>
                );
              })}
              <Button onClick={saveAvailability} disabled={saving} className="bg-primary text-primary-foreground font-body mt-2">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Salvando..." : "Salvar horários"}
              </Button>
            </CardContent>
          </Card>

          {/* Exceptions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg">Exceções / Folgas — {selectedPro?.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={addException} className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="font-body text-sm block mb-1">Data</label>
                  <Input type="date" value={excForm.date} onChange={(e) => setExcForm({ ...excForm, date: e.target.value })} className="bg-secondary border-border font-body" required />
                </div>
                <div>
                  <label className="font-body text-sm block mb-1">Tipo</label>
                  <Select value={excForm.type} onValueChange={(v) => setExcForm({ ...excForm, type: v })}>
                    <SelectTrigger className="w-40 bg-secondary border-border font-body">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day_off">Folga (dia todo)</SelectItem>
                      <SelectItem value="blocked">Bloqueio parcial</SelectItem>
                      <SelectItem value="custom_hours">Horário especial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {excForm.type !== "day_off" && (
                  <>
                    <div>
                      <label className="font-body text-sm block mb-1">Início</label>
                      <Input type="time" value={excForm.start_time} onChange={(e) => setExcForm({ ...excForm, start_time: e.target.value })} className="bg-secondary border-border font-body w-28" />
                    </div>
                    <div>
                      <label className="font-body text-sm block mb-1">Fim</label>
                      <Input type="time" value={excForm.end_time} onChange={(e) => setExcForm({ ...excForm, end_time: e.target.value })} className="bg-secondary border-border font-body w-28" />
                    </div>
                  </>
                )}
                <div>
                  <label className="font-body text-sm block mb-1">Motivo</label>
                  <Input value={excForm.reason} onChange={(e) => setExcForm({ ...excForm, reason: e.target.value })} placeholder="Opcional" className="bg-secondary border-border font-body" />
                </div>
                <Button type="submit" className="bg-primary text-primary-foreground font-body">
                  <Plus className="w-4 h-4 mr-1" />Adicionar
                </Button>
              </form>

              <div className="space-y-2">
                {exceptions.length === 0 && <p className="text-muted-foreground font-body text-sm">Nenhuma exceção cadastrada.</p>}
                {exceptions.map((exc) => (
                  <div key={exc.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border">
                    <span className="font-body text-sm">
                      <span className="font-medium">{exc.date}</span>
                      {" — "}
                      {exc.type === "day_off" && <span className="text-destructive">Folga</span>}
                      {exc.type === "blocked" && <span className="text-destructive">Bloqueio: {exc.start_time?.slice(0,5)} - {exc.end_time?.slice(0,5)}</span>}
                      {exc.type === "custom_hours" && <span className="text-primary">Especial: {exc.start_time?.slice(0,5)} - {exc.end_time?.slice(0,5)}</span>}
                      {exc.reason && <span className="text-muted-foreground ml-2">({exc.reason})</span>}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => deleteException(exc.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
