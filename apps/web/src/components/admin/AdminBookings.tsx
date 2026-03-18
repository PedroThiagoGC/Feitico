import { useState, useEffect, useMemo, useCallback } from "react";
import { api } from "@/services/api";
import { type Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { appToast } from "@/lib/toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Clock, Pencil, Plus, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { calculateCommission, hasTimeConflict } from "@/services/bookingService";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type ProfessionalRow = Pick<
  Database["public"]["Tables"]["professionals"]["Row"],
  "id" | "name" | "photo_url" | "commission_type" | "commission_value"
>;
type ServiceRow = Pick<
  Database["public"]["Tables"]["services"]["Row"],
  "id" | "name" | "price" | "duration" | "buffer_minutes" | "active"
>;
type AvailabilityRow = Database["public"]["Tables"]["professional_availability"]["Row"];

type BookingServiceSnapshot = {
  id: string;
  name: string;
  price: number;
  duration: number;
  buffer: number;
};

type BookingFormState = {
  id: string | null;
  professional_id: string;
  customer_name: string;
  customer_phone: string;
  booking_date: string;
  booking_time: string;
  booking_type: "scheduled" | "walk_in";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string;
  service_ids: string[];
};

function formatDateInput(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState("all");
  const [salonId, setSalonId] = useState<string>("");
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<BookingFormState>({
    id: null,
    professional_id: "",
    customer_name: "",
    customer_phone: "",
    booking_date: formatDateInput(new Date()),
    booking_time: "",
    booking_type: "scheduled",
    status: "pending",
    notes: "",
    service_ids: [],
  });

  useEffect(() => {
    void loadBaseData();
  }, []);

  async function loadBaseData() {
    const salon = await api.getSalon();
    if (!salon?.id) return;

    setSalonId(salon.id);

    const [pros, svc] = await Promise.all([
      api.getProfessionals(salon.id),
      api.getServices(salon.id),
    ]);

    const professionalList = (pros || []) as ProfessionalRow[];
    setProfessionals(professionalList);
    setServices((svc || []) as ServiceRow[]);

    const availabilityLists = await Promise.all(
      professionalList.map((pro) => api.getProfessionalAvailability(pro.id)),
    );
    setAvailability(
      availabilityLists
        .flat()
        .filter((row) => row.active) as AvailabilityRow[],
    );
  }

  const loadBookings = useCallback(async () => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const data = await api.getBookings({
      salonId,
      date: dateStr,
      status: statusFilter !== "all" ? statusFilter : undefined,
    });

    const sorted = [...(data || [])].sort((a, b) => {
      const timeA = a.booking_time || "99:99";
      const timeB = b.booking_time || "99:99";
      return timeA.localeCompare(timeB);
    });

    setBookings((sorted as BookingRow[]) || []);
  }, [salonId, selectedDate, statusFilter]);

  useEffect(() => {
    if (!salonId) return;
    void loadBookings();
  }, [salonId, loadBookings]);

  async function updateStatus(id: string, status: BookingFormState["status"]) {
    await api.updateBookingStatus(id, status);

    const statusLabel =
      status === "completed"
        ? "Concluído"
        : status === "cancelled"
          ? "Cancelado"
          : status === "confirmed"
            ? "Confirmado"
            : "Pendente";

    appToast.success(`Agendamento atualizado: ${statusLabel}`);
    void loadBookings();
  }

  async function deleteBooking(id: string) {
    if (!confirm("Excluir agendamento permanentemente?")) return;

    await api.deleteBooking(id);

    appToast.success("Agendamento excluído.");
    void loadBookings();
  }

  function openCreateForm() {
    setForm({
      id: null,
      professional_id: "",
      customer_name: "",
      customer_phone: "",
      booking_date: formatDateInput(selectedDate),
      booking_time: "",
      booking_type: "scheduled",
      status: "pending",
      notes: "",
      service_ids: [],
    });
    setFormOpen(true);
  }

  function openEditForm(booking: BookingRow) {
    const bookedServices = Array.isArray(booking.services)
      ? (booking.services as BookingServiceSnapshot[])
      : [];

    setForm({
      id: booking.id,
      professional_id: booking.professional_id || "",
      customer_name: booking.customer_name,
      customer_phone: booking.customer_phone,
      booking_date: booking.booking_date,
      booking_time: booking.booking_time || "",
      booking_type: booking.booking_type === "walk_in" ? "walk_in" : "scheduled",
      status:
        booking.status === "confirmed" ||
        booking.status === "completed" ||
        booking.status === "cancelled"
          ? booking.status
          : "pending",
      notes: booking.notes || "",
      service_ids: bookedServices
        .map((s) => s.id)
        .filter((id): id is string => typeof id === "string"),
    });
    setFormOpen(true);
  }

  const selectedServices = useMemo(
    () => services.filter((s) => form.service_ids.includes(s.id)),
    [services, form.service_ids],
  );

  const totals = useMemo(() => {
    const totalPrice = selectedServices.reduce((acc, s) => acc + Number(s.price || 0), 0);
    const totalDuration = selectedServices.reduce((acc, s) => acc + Number(s.duration || 0), 0);
    const totalBuffer = selectedServices.reduce((acc, s) => acc + Number(s.buffer_minutes || 0), 0);
    return {
      totalPrice,
      totalDuration,
      totalBuffer,
      totalOccupiedMinutes: totalDuration + totalBuffer,
    };
  }, [selectedServices]);

  const selectedProfessional = useMemo(
    () => professionals.find((p) => p.id === form.professional_id),
    [professionals, form.professional_id],
  );

  const financials = useMemo(() => {
    const commission = selectedProfessional
      ? calculateCommission(
          totals.totalPrice,
          selectedProfessional.commission_type,
          Number(selectedProfessional.commission_value || 0),
        )
      : 0;

    return {
      commission,
      profit: totals.totalPrice - commission,
    };
  }, [selectedProfessional, totals.totalPrice]);

  async function hasScheduleConflict(currentId: string | null) {
    if (
      !form.professional_id ||
      form.booking_type !== "scheduled" ||
      !form.booking_time ||
      totals.totalOccupiedMinutes <= 0
    ) {
      return false;
    }

    const data = await api.getBookings({
      salonId,
      professionalId: form.professional_id,
      date: form.booking_date,
      statuses: ["pending", "confirmed"],
    });

    const filtered = (data || []).filter((booking) => booking.id !== currentId);
    return hasTimeConflict(form.booking_time, totals.totalOccupiedMinutes, filtered || []);
  }

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();

    if (!salonId) {
      appToast.error("Salão não encontrado.");
      return;
    }

    if (form.customer_name.trim().length < 2) {
      appToast.error("Informe o nome do cliente.");
      return;
    }

    if (form.customer_phone.trim().length < 8) {
      appToast.error("Informe um telefone válido.");
      return;
    }

    if (form.booking_type === "scheduled" && !form.booking_time) {
      appToast.error("Informe o horário para agendamento marcado.");
      return;
    }

    if (form.service_ids.length === 0) {
      appToast.error("Selecione pelo menos um serviço.");
      return;
    }

    if (totals.totalOccupiedMinutes <= 0) {
      appToast.error("Tempo total inválido.");
      return;
    }

    setSaving(true);

    const conflict = await hasScheduleConflict(form.id);
    if (conflict) {
      setSaving(false);
      appToast.error("Conflito de horário para este profissional.");
      return;
    }

    const serviceSnapshot: BookingServiceSnapshot[] = selectedServices.map((s) => ({
      id: s.id,
      name: s.name,
      price: Number(s.price || 0),
      duration: Number(s.duration || 0),
      buffer: Number(s.buffer_minutes || 0),
    }));

    const payload: Database["public"]["Tables"]["bookings"]["Insert"] = {
      salon_id: salonId,
      professional_id: form.professional_id || null,
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim(),
      booking_date: form.booking_date,
      booking_time:
        form.booking_type === "scheduled" && form.booking_time ? form.booking_time : null,
      booking_type: form.booking_type,
      status: form.status,
      notes: form.notes.trim() || null,
      services: JSON.parse(JSON.stringify(serviceSnapshot)),
      total_price: totals.totalPrice,
      total_duration: totals.totalDuration,
      total_buffer_minutes: totals.totalBuffer,
      total_occupied_minutes: totals.totalOccupiedMinutes,
      commission_amount: financials.commission,
      profit_amount: financials.profit,
    };

    if (form.id) {
      await api.updateBooking(form.id, payload);
      appToast.success("Agendamento atualizado.");
    } else {
      await api.createBooking(payload);
      appToast.success("Agendamento criado.");
    }

    setSaving(false);
    setFormOpen(false);
    void loadBookings();
  }

  function toggleService(serviceId: string) {
    setForm((prev) => ({
      ...prev,
      service_ids: prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter((id) => id !== serviceId)
        : [...prev.service_ids, serviceId],
    }));
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
    completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    completed: "Concluído",
    cancelled: "Cancelado",
  };

  function getProAvailability(proId: string) {
    const dayOfWeek = selectedDate.getDay();
    return availability.filter((a) => a.professional_id === proId && a.weekday === dayOfWeek);
  }

  function getWorkingSlots(
    proId: string,
  ): { time: string; status: "free" | "booked" | "past"; booking?: BookingRow }[] {
    const avails = getProAvailability(proId);
    if (avails.length === 0) return [];

    const proBookings = bookings.filter(
      (b) => b.professional_id === proId && b.status !== "cancelled",
    );
    const now = new Date();
    const isToday = format(selectedDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");

    const slots: { time: string; status: "free" | "booked" | "past"; booking?: BookingRow }[] = [];

    for (const a of avails) {
      const [sh, sm] = a.start_time.split(":").map(Number);
      const [eh, em] = a.end_time.split(":").map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;

      for (let m = startMin; m < endMin; m += 5) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        const timeStr = `${h.toString().padStart(2, "0")}:${min
          .toString()
          .padStart(2, "0")}`;

        const matchingBooking = proBookings.find((b) => {
          if (!b.booking_time) return false;
          const [bh, bm] = b.booking_time.split(":").map(Number);
          const bStart = bh * 60 + bm;
          const bEnd = bStart + (b.total_occupied_minutes || b.total_duration || 30);
          return m >= bStart && m < bEnd;
        });

        let status: "free" | "booked" | "past" = "free";
        if (matchingBooking) {
          status = "booked";
        } else if (isToday && m < now.getHours() * 60 + now.getMinutes()) {
          status = "past";
        }

        slots.push({ time: timeStr, status, booking: matchingBooking });
      }
    }

    return slots;
  }

  const bookingsByPro = useMemo(() => {
    const map = new Map<string, BookingRow[]>();

    for (const pro of professionals) {
      map.set(
        pro.id,
        bookings.filter((b) => b.professional_id === pro.id),
      );
    }

    const unassigned = bookings.filter(
      (b) => !b.professional_id || !professionals.some((p) => p.id === b.professional_id),
    );
    if (unassigned.length > 0) map.set("unassigned", unassigned);

    return map;
  }, [bookings, professionals]);

  function getProStats(proId: string) {
    const slots = getWorkingSlots(proId);
    const totalSlots = slots.length;
    const bookedSlots = slots.filter((s) => s.status === "booked").length;
    const freeSlots = slots.filter((s) => s.status === "free").length;

    const proBooks = bookings.filter(
      (b) => b.professional_id === proId && b.status !== "cancelled",
    );

    const revenue = proBooks.reduce((a, b) => a + Number(b.total_price), 0);

    return {
      totalSlots,
      bookedSlots,
      freeSlots,
      totalHours: totalSlots * 5,
      bookedHours: bookedSlots * 5,
      freeHours: freeSlots * 5,
      revenue,
      bookingsCount: proBooks.length,
    };
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <CardTitle className="font-display text-lg md:text-xl">Agendamentos do Dia</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button onClick={openCreateForm} className="bg-primary text-primary-foreground font-body text-sm h-9">
            <Plus className="w-4 h-4 mr-1" /> Novo
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-secondary border-border font-body text-sm h-9">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card border-border" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                locale={ptBR}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 bg-secondary border-border font-body h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="confirmed">Confirmados</SelectItem>
              <SelectItem value="completed">Concluídos</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {professionals.length === 0 ? (
          <EmptyState
            title="Nenhum profissional cadastrado"
            description="Cadastre profissionais na aba Profissionais para visualizar agendamentos."
          />
        ) : (
          professionals.map((pro) => {
            const stats = getProStats(pro.id);
            const proBookings = bookingsByPro.get(pro.id) || [];
            const hasAvailability = getProAvailability(pro.id).length > 0;

            return (
              <div key={pro.id} className="border border-border rounded-xl overflow-hidden">
                <div className="bg-secondary p-3 md:p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {pro.photo_url ? (
                      <img src={pro.photo_url} alt={pro.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-display font-semibold text-foreground text-sm md:text-base">
                        {pro.name}
                      </h3>
                      {hasAvailability ? (
                        <p className="font-body text-xs text-muted-foreground">
                          {stats.bookingsCount} agendamento{stats.bookingsCount !== 1 ? "s" : ""} · R${" "}
                          {stats.revenue.toFixed(2)}
                        </p>
                      ) : (
                        <p className="font-body text-xs text-muted-foreground">Sem expediente neste dia</p>
                      )}
                    </div>
                  </div>

                  {hasAvailability && (
                    <div className="flex gap-2 text-xs font-body shrink-0">
                      <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                        {stats.freeHours}min livres
                      </span>
                      <span className="px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">
                        {stats.bookedHours}min ocupados
                      </span>
                    </div>
                  )}
                </div>

                {hasAvailability && (
                  <div className="px-3 md:px-4 py-2 bg-card/50">
                    <div className="flex flex-wrap gap-0.5">
                      {getWorkingSlots(pro.id)
                        .filter((_, i) => i % 3 === 0)
                        .map((slot) => (
                          <div
                            key={slot.time}
                            title={`${slot.time} - ${
                              slot.status === "booked"
                                ? `Ocupado: ${slot.booking?.customer_name}`
                                : slot.status === "past"
                                  ? "Passado"
                                  : "Livre"
                            }`}
                            className={cn(
                              "w-3 h-3 md:w-4 md:h-4 rounded-sm text-[6px] md:text-[8px] flex items-center justify-center font-mono cursor-default",
                              slot.status === "booked" && "bg-primary/60 text-primary-foreground",
                              slot.status === "free" && "bg-green-500/20 text-green-500",
                              slot.status === "past" && "bg-muted text-muted-foreground/50",
                            )}
                          />
                        ))}
                    </div>
                    <div className="flex gap-3 mt-1 text-[10px] font-body text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-sm bg-green-500/20" /> Livre
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-sm bg-primary/60" /> Ocupado
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-sm bg-muted" /> Passado
                      </span>
                    </div>
                  </div>
                )}

                {proBookings.length > 0 ? (
                  <div className="divide-y divide-border">
                    {proBookings.map((b) => {
                      const bServices = Array.isArray(b.services)
                        ? (b.services as BookingServiceSnapshot[])
                        : [];

                      return (
                        <div key={b.id} className="p-3 md:p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                {b.booking_time && (
                                  <span className="flex items-center gap-1 text-primary font-mono text-sm font-bold shrink-0">
                                    <Clock className="w-3.5 h-3.5" />
                                    {b.booking_time}
                                  </span>
                                )}
                                <span className="font-body font-semibold text-foreground truncate">
                                  {b.customer_name}
                                </span>
                              </div>
                              <p className="font-body text-xs text-muted-foreground">{b.customer_phone}</p>
                            </div>
                            <span
                              className={`text-xs font-body font-semibold px-2 py-1 rounded border shrink-0 ${
                                statusColors[b.status] || ""
                              }`}
                            >
                              {statusLabels[b.status] || b.status}
                            </span>
                          </div>

                          <div className="font-body text-xs md:text-sm text-muted-foreground">
                            <p className="truncate">
                              ✂️ {bServices.map((s) => `${s.name} (${s.duration}min)`).join(" + ")}
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                              <span>💰 R$ {Number(b.total_price).toFixed(2)}</span>
                              <span>⏱️ {b.total_duration}min</span>
                              <span>📊 Ocupação: {b.total_occupied_minutes || b.total_duration}min</span>
                            </div>
                            {b.notes && <p className="mt-1 text-[11px]">📝 {b.notes}</p>}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {b.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => updateStatus(b.id, "confirmed")}
                                  className="bg-green-600 text-white font-body text-xs h-7"
                                >
                                  Confirmar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateStatus(b.id, "cancelled")}
                                  className="font-body text-xs h-7"
                                >
                                  Cancelar
                                </Button>
                              </>
                            )}

                            {b.status === "confirmed" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => updateStatus(b.id, "completed")}
                                  className="bg-blue-600 text-white font-body text-xs h-7"
                                >
                                  Concluir
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateStatus(b.id, "cancelled")}
                                  className="font-body text-xs h-7"
                                >
                                  Cancelar
                                </Button>
                              </>
                            )}

                            {b.status === "completed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatus(b.id, "confirmed")}
                                className="font-body text-xs h-7"
                              >
                                Reabrir
                              </Button>
                            )}

                            {b.status === "cancelled" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatus(b.id, "pending")}
                                className="font-body text-xs h-7"
                              >
                                Reativar
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditForm(b)}
                              className="font-body text-xs h-7"
                            >
                              <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteBooking(b.id)}
                              className="font-body text-xs h-7"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : hasAvailability ? (
                  <div className="p-3 text-center font-body text-xs text-muted-foreground">
                    Nenhum agendamento neste dia
                  </div>
                ) : null}
              </div>
            );
          })
        )}

        {(bookingsByPro.get("unassigned") || []).length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="bg-secondary p-3 md:p-4">
              <h3 className="font-display font-semibold text-foreground text-sm">
                Sem profissional atribuído
              </h3>
            </div>
            <div className="divide-y divide-border">
              {(bookingsByPro.get("unassigned") || []).map((b) => {
                const bServices = Array.isArray(b.services)
                  ? (b.services as BookingServiceSnapshot[])
                  : [];

                return (
                  <div key={b.id} className="p-3 md:p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-body font-semibold text-foreground truncate">{b.customer_name}</p>
                        <p className="font-body text-xs text-muted-foreground">{b.customer_phone}</p>
                      </div>
                      <span
                        className={`text-xs font-body font-semibold px-2 py-1 rounded border shrink-0 ${
                          statusColors[b.status] || ""
                        }`}
                      >
                        {statusLabels[b.status] || b.status}
                      </span>
                    </div>
                    <p className="font-body text-xs text-muted-foreground truncate">
                      {b.booking_time || "Ordem de chegada"} · ✂️ {bServices.map((s) => s.name).join(", ")} · R${" "}
                      {Number(b.total_price).toFixed(2)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditForm(b)}
                        className="font-body text-xs h-7"
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteBooking(b.id)}
                        className="font-body text-xs h-7"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {form.id ? "Editar agendamento" : "Novo agendamento"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitForm} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-body">Cliente</Label>
                <Input
                  value={form.customer_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, customer_name: e.target.value }))}
                  className="bg-secondary border-border font-body"
                  placeholder="Nome do cliente"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-body">Telefone</Label>
                <Input
                  value={form.customer_phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, customer_phone: e.target.value }))}
                  className="bg-secondary border-border font-body"
                  placeholder="Telefone"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-body">Profissional</Label>
                <Select
                  value={form.professional_id || "none"}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, professional_id: value === "none" ? "" : value }))
                  }
                >
                  <SelectTrigger className="bg-secondary border-border font-body">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">Sem profissional</SelectItem>
                    {professionals.map((pro) => (
                      <SelectItem key={pro.id} value={pro.id}>
                        {pro.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-body">Tipo</Label>
                <Select
                  value={form.booking_type}
                  onValueChange={(value: "scheduled" | "walk_in") =>
                    setForm((prev) => ({ ...prev, booking_type: value }))
                  }
                >
                  <SelectTrigger className="bg-secondary border-border font-body">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="scheduled">Horário marcado</SelectItem>
                    <SelectItem value="walk_in">Ordem de chegada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-body">Data</Label>
                <Input
                  type="date"
                  value={form.booking_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, booking_date: e.target.value }))}
                  className="bg-secondary border-border font-body"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-body">Horário</Label>
                <Input
                  type="time"
                  value={form.booking_time}
                  onChange={(e) => setForm((prev) => ({ ...prev, booking_time: e.target.value }))}
                  className="bg-secondary border-border font-body"
                  disabled={form.booking_type === "walk_in"}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="font-body">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value: BookingFormState["status"]) =>
                    setForm((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="bg-secondary border-border font-body">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="font-body">Observações</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="bg-secondary border-border font-body"
                  placeholder="Ex.: cliente pediu atenção em..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-body">Serviços</Label>
              {services.length === 0 ? (
                <p className="text-xs text-muted-foreground font-body">Nenhum serviço ativo cadastrado.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {services.map((service) => {
                    const selected = form.service_ids.includes(service.id);
                    return (
                      <button
                        type="button"
                        key={service.id}
                        onClick={() => toggleService(service.id)}
                        className={cn(
                          "text-left p-2 rounded-md border transition-colors",
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-border bg-secondary hover:bg-secondary/80",
                        )}
                      >
                        <p className="font-body text-sm text-foreground">{service.name}</p>
                        <p className="font-body text-xs text-muted-foreground">
                          R$ {Number(service.price || 0).toFixed(2)} · {service.duration}min +{" "}
                          {service.buffer_minutes}min
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border p-3 bg-secondary/40">
              <p className="font-body text-xs text-muted-foreground mb-2">Resumo automático</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-body">
                <div>Total: R$ {totals.totalPrice.toFixed(2)}</div>
                <div>Duração: {totals.totalDuration}min</div>
                <div>Margem: {totals.totalBuffer}min</div>
                <div>Ocupação: {totals.totalOccupiedMinutes}min</div>
                <div>Comissão: R$ {financials.commission.toFixed(2)}</div>
                <div>Lucro: R$ {financials.profit.toFixed(2)}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                className="font-body"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="font-body bg-primary text-primary-foreground">
                {saving ? "Salvando..." : form.id ? "Salvar alterações" : "Criar agendamento"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
