import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Clock, MessageCircle, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { type Database } from "@/integrations/supabase/types";
import { getPrimarySalonId } from "@/services/salonService";
import { calculateCommission, createBooking, type CreateBookingPayload } from "@/services/bookingService";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ServiceSnapshot = { name: string; duration: number };
type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
type ProfessionalServiceRow = Database["public"]["Tables"]["professional_services"]["Row"];
type AvailabilityRow = Database["public"]["Tables"]["professional_availability"]["Row"];
type ProfessionalRow = Pick<
  Database["public"]["Tables"]["professionals"]["Row"],
  "id" | "name" | "photo_url" | "commission_type" | "commission_value"
>;

type ManualBookingForm = {
  customer_name: string;
  customer_phone: string;
  professional_id: string;
  booking_date: string;
  booking_time: string;
  booking_type: CreateBookingPayload["booking_type"];
  status: BookingStatus;
  notes: string;
  service_ids: string[];
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const BOOKING_TYPE_LABELS: Record<string, string> = {
  scheduled: "Agendado",
  walk_in: "Na hora",
  waitlist: "Fila de espera",
};

function getDefaultManualForm(professionalId = ""): ManualBookingForm {
  return {
    customer_name: "",
    customer_phone: "",
    professional_id: professionalId,
    booking_date: format(new Date(), "yyyy-MM-dd"),
    booking_time: "",
    booking_type: "walk_in",
    status: "completed",
    notes: "",
    service_ids: [],
  };
}

function parseClockToMinutes(value: string | null): number {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const [hourStr, minuteStr] = value.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return Number.MAX_SAFE_INTEGER;
  return hour * 60 + minute;
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [professionalServices, setProfessionalServices] = useState<ProfessionalServiceRow[]>([]);
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState("all");
  const [salonId, setSalonId] = useState<string>("");
  const [savingManualBooking, setSavingManualBooking] = useState(false);
  const [manualForm, setManualForm] = useState<ManualBookingForm>(() => getDefaultManualForm());

  const selectedProfessional = useMemo(
    () => professionals.find((professional) => professional.id === manualForm.professional_id),
    [professionals, manualForm.professional_id]
  );

  const availableManualServices = useMemo(() => {
    if (!manualForm.professional_id) return [];
    const enabledServiceIds = new Set(professionalServices.map((item) => item.service_id));
    return services.filter((service) => enabledServiceIds.has(service.id));
  }, [manualForm.professional_id, professionalServices, services]);

  const selectedManualServices = useMemo(() => {
    if (manualForm.service_ids.length === 0) return [];
    const selectedIds = new Set(manualForm.service_ids);
    return availableManualServices
      .filter((service) => selectedIds.has(service.id))
      .map((service) => {
        const override = professionalServices.find((item) => item.service_id === service.id);
        return {
          id: service.id,
          name: service.name,
          price: override?.custom_price ?? Number(service.price),
          duration: override?.custom_duration_minutes ?? service.duration,
          buffer: override?.custom_buffer_minutes ?? service.buffer_minutes,
        };
      });
  }, [availableManualServices, manualForm.service_ids, professionalServices]);

  const manualTotals = useMemo(() => {
    const totalDuration = selectedManualServices.reduce((sum, service) => sum + service.duration, 0);
    const totalBuffer = selectedManualServices.reduce((sum, service) => sum + service.buffer, 0);
    const totalPrice = selectedManualServices.reduce((sum, service) => sum + service.price, 0);
    return {
      totalDuration,
      totalBuffer,
      totalOccupiedMinutes: totalDuration + totalBuffer,
      totalPrice,
    };
  }, [selectedManualServices]);

  const loadBookings = useCallback(async () => {
    if (!salonId) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    let query = supabase
      .from("bookings")
      .select("*")
      .eq("salon_id", salonId)
      .eq("booking_date", dateStr)
      .order("booking_time", { ascending: true });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      toast.error("Erro ao carregar agendamentos");
      return;
    }

    setBookings((data || []).sort((a, b) => parseClockToMinutes(a.booking_time) - parseClockToMinutes(b.booking_time)));
  }, [salonId, selectedDate, statusFilter]);

  const loadProfessionalServices = useCallback(async (professionalId: string) => {
    if (!professionalId) {
      setProfessionalServices([]);
      return;
    }

    const { data, error } = await supabase
      .from("professional_services")
      .select("*")
      .eq("professional_id", professionalId)
      .eq("active", true);

    if (error) {
      toast.error("Erro ao carregar serviços do profissional");
      return;
    }

    setProfessionalServices(data || []);
  }, []);

  useEffect(() => {
    (async () => {
      const nextSalonId = await getPrimarySalonId();
      if (!nextSalonId) return;

      setSalonId(nextSalonId);

      const { data: pros, error: prosError } = await supabase
        .from("professionals")
        .select("id, name, photo_url, commission_type, commission_value")
        .eq("salon_id", nextSalonId)
        .eq("active", true)
        .order("name");

      if (prosError) {
        toast.error("Erro ao carregar profissionais");
        return;
      }

      const professionalList = pros || [];
      setProfessionals(professionalList);

      const firstProfessionalId = professionalList[0]?.id || "";
      setManualForm((previous) => ({
        ...previous,
        professional_id: previous.professional_id || firstProfessionalId,
      }));

      const { data: serviceList, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .eq("salon_id", nextSalonId)
        .eq("active", true)
        .order("sort_order");

      if (servicesError) {
        toast.error("Erro ao carregar serviços");
        return;
      }

      setServices(serviceList || []);

      const professionalIds = professionalList.map((p) => p.id)
      const { data: availabilityList, error: availabilityError } = await supabase
        .from("professional_availability")
        .select("*")
        .in("professional_id", professionalIds.length > 0 ? professionalIds : [""])
        .eq("active", true)
        .limit(500);

      if (availabilityError) {
        toast.error("Erro ao carregar disponibilidade");
        return;
      }

      setAvailability(availabilityList || []);
    })();
  }, []);

  useEffect(() => {
    if (!manualForm.professional_id) {
      setProfessionalServices([]);
      return;
    }
    void loadProfessionalServices(manualForm.professional_id);
  }, [manualForm.professional_id, loadProfessionalServices]);

  useEffect(() => {
    const allowedIds = new Set(professionalServices.map((item) => item.service_id));
    setManualForm((previous) => ({
      ...previous,
      service_ids: previous.service_ids.filter((serviceId) => allowedIds.has(serviceId)),
    }));
  }, [professionalServices]);

  useEffect(() => {
    if (!salonId) return;
    void loadBookings();
  }, [salonId, loadBookings]);

  useEffect(() => {
    if (!salonId) return;
    const channel = supabase
      .channel(`admin-bookings-realtime-${salonId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `salon_id=eq.${salonId}`,
        },
        () => {
          void loadBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salonId, loadBookings]);

  function setManualFormField<K extends keyof ManualBookingForm>(field: K, value: ManualBookingForm[K]) {
    setManualForm((previous) => ({ ...previous, [field]: value }));
  }

  function toggleManualService(serviceId: string) {
    setManualForm((previous) => {
      const alreadySelected = previous.service_ids.includes(serviceId);
      return {
        ...previous,
        service_ids: alreadySelected
          ? previous.service_ids.filter((id) => id !== serviceId)
          : [...previous.service_ids, serviceId],
      };
    });
  }

  function buildReminderMessage(booking: BookingRow): string {
    const servicesSnapshot = Array.isArray(booking.services) ? (booking.services as ServiceSnapshot[]) : [];
    const serviceNames = servicesSnapshot.map((s) => s.name).join(", ");
    const date = booking.booking_date
      ? new Date(`${booking.booking_date}T12:00:00`).toLocaleDateString("pt-BR")
      : "";
    const time = booking.booking_time ? ` às ${booking.booking_time}` : "";
    return `Olá ${booking.customer_name}! 👋\nLembrando do seu agendamento${date ? ` em ${date}` : ""}${time}.\n✂️ ${serviceNames || "Serviços"}\n\nAté lá! 😊`;
  }

  async function handleSendReminder(booking: BookingRow) {
    const phone = (booking.customer_phone || "").replace(/\D/g, "");
    if (!phone) { toast.error("Telefone não disponível"); return; }
    const message = buildReminderMessage(booking);
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, "_blank");
    const { error } = await (supabase as any).from("bookings").update({ reminder_sent_at: new Date().toISOString() }).eq("id", booking.id);
    if (!error) void loadBookings();
  }

  async function updateStatus(id: string, status: BookingStatus) {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Status atualizado!");
    void loadBookings();
  }

  async function handleCreateManualBooking(event: FormEvent) {
    event.preventDefault();
    if (!salonId) {
      toast.error("Nenhum salão configurado.");
      return;
    }
    if (!manualForm.professional_id) {
      toast.error("Selecione um profissional.");
      return;
    }
    if (!manualForm.customer_name.trim()) {
      toast.error("Informe o nome do cliente.");
      return;
    }
    if (!manualForm.customer_phone.trim()) {
      toast.error("Informe o telefone do cliente.");
      return;
    }
    if (selectedManualServices.length === 0) {
      toast.error("Selecione ao menos um serviço.");
      return;
    }
    if (manualForm.booking_type !== "waitlist" && !manualForm.booking_time) {
      toast.error("Informe o horário para este tipo de agendamento.");
      return;
    }

    const commissionAmount = calculateCommission(
      manualTotals.totalPrice,
      selectedProfessional?.commission_type || "percentage",
      Number(selectedProfessional?.commission_value || 0)
    );
    const profitAmount = manualTotals.totalPrice - commissionAmount;

    const payload: CreateBookingPayload = {
      salon_id: salonId,
      professional_id: manualForm.professional_id,
      customer_name: manualForm.customer_name.trim(),
      customer_phone: manualForm.customer_phone.trim(),
      services: selectedManualServices,
      total_price: manualTotals.totalPrice,
      total_duration: manualTotals.totalDuration,
      total_buffer_minutes: manualTotals.totalBuffer,
      total_occupied_minutes: manualTotals.totalOccupiedMinutes,
      commission_amount: commissionAmount,
      profit_amount: profitAmount,
      booking_date: manualForm.booking_date,
      booking_time: manualForm.booking_time || null,
      booking_type: manualForm.booking_type,
      status: manualForm.status,
      notes: manualForm.notes.trim() || null,
    };

    setSavingManualBooking(true);
    try {
      await createBooking(payload);
      toast.success("Agendamento manual criado com sucesso.");
      const preservedProfessionalId = manualForm.professional_id;
      setManualForm(getDefaultManualForm(preservedProfessionalId));
      setSelectedDate(new Date(`${payload.booking_date}T12:00:00`));
      void loadBookings();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar agendamento manual.";
      toast.error(message);
    } finally {
      setSavingManualBooking(false);
    }
  }

  function getProAvailability(proId: string) {
    const dayOfWeek = selectedDate.getDay();
    return availability.filter((item) => item.professional_id === proId && item.weekday === dayOfWeek);
  }

  function getWorkingSlots(proId: string): { time: string; status: "free" | "booked" | "past"; booking?: BookingRow }[] {
    const availabilityRows = getProAvailability(proId);
    if (availabilityRows.length === 0) return [];

    const professionalBookings = bookings.filter((booking) => booking.professional_id === proId && booking.status !== "cancelled");
    const now = new Date();
    const isToday = format(selectedDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");

    const slots: { time: string; status: "free" | "booked" | "past"; booking?: BookingRow }[] = [];

    for (const availabilityRow of availabilityRows) {
      const [startHour, startMinute] = availabilityRow.start_time.split(":").map(Number);
      const [endHour, endMinute] = availabilityRow.end_time.split(":").map(Number);
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      for (let minute = startMinutes; minute < endMinutes; minute += 5) {
        const hour = Math.floor(minute / 60);
        const minutes = minute % 60;
        const time = `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

        const matchingBooking = professionalBookings.find((booking) => {
          if (!booking.booking_time) return false;
          const [bookingHour, bookingMinute] = booking.booking_time.split(":").map(Number);
          const bookingStart = bookingHour * 60 + bookingMinute;
          const bookingEnd = bookingStart + (booking.total_occupied_minutes || booking.total_duration || 30);
          return minute >= bookingStart && minute < bookingEnd;
        });

        let status: "free" | "booked" | "past" = "free";
        if (matchingBooking) {
          status = "booked";
        } else if (isToday && minute < now.getHours() * 60 + now.getMinutes()) {
          status = "past";
        }

        slots.push({ time, status, booking: matchingBooking });
      }
    }

    return slots;
  }

  const bookingsByProfessional = useMemo(() => {
    const grouped = new Map<string, BookingRow[]>();
    for (const professional of professionals) {
      grouped.set(
        professional.id,
        bookings.filter((booking) => booking.professional_id === professional.id && booking.status !== "cancelled")
      );
    }

    const unassignedBookings = bookings.filter(
      (booking) => !booking.professional_id || !professionals.some((professional) => professional.id === booking.professional_id)
    );
    if (unassignedBookings.length > 0) {
      grouped.set("unassigned", unassignedBookings);
    }

    return grouped;
  }, [bookings, professionals]);

  function getProfessionalStats(professionalId: string) {
    const slots = getWorkingSlots(professionalId);
    const bookedSlots = slots.filter((slot) => slot.status === "booked").length;
    const freeSlots = slots.filter((slot) => slot.status === "free").length;
    const professionalBookings = bookingsByProfessional.get(professionalId) || [];
    const revenue = professionalBookings.reduce((sum, booking) => sum + Number(booking.total_price), 0);

    return {
      bookedMinutes: bookedSlots * 5,
      freeMinutes: freeSlots * 5,
      revenue,
      bookingsCount: professionalBookings.length,
    };
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <CardTitle className="font-display text-lg md:text-xl">Agendamentos do Dia</CardTitle>
        <div className="flex flex-wrap gap-2">
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
                onSelect={(date) => date && setSelectedDate(date)}
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
              <SelectItem value="completed">Concluidos</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="border border-border rounded-xl p-4 md:p-5 space-y-4 bg-secondary/20">
          <div>
            <h3 className="font-display font-semibold text-foreground text-base md:text-lg">Novo Agendamento Manual</h3>
            <p className="font-body text-xs md:text-sm text-muted-foreground mt-1">
              Use para registrar atendimento retroativo, na hora ou fila de espera.
            </p>
          </div>

          <form onSubmit={handleCreateManualBooking} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="font-body text-xs text-muted-foreground">Profissional</label>
                <Select
                  value={manualForm.professional_id}
                  onValueChange={(value) => setManualFormField("professional_id", value)}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {professionals.map((professional) => (
                      <SelectItem key={professional.id} value={professional.id}>
                        {professional.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="font-body text-xs text-muted-foreground">Tipo</label>
                <Select
                  value={manualForm.booking_type}
                  onValueChange={(value) => setManualFormField("booking_type", value as CreateBookingPayload["booking_type"])}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="scheduled">Agendado</SelectItem>
                    <SelectItem value="walk_in">Na hora</SelectItem>
                    <SelectItem value="waitlist">Fila de espera</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="font-body text-xs text-muted-foreground">Status inicial</label>
                <Select
                  value={manualForm.status}
                  onValueChange={(value) => setManualFormField("status", value as BookingStatus)}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="completed">Concluido</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-body text-xs text-muted-foreground">Nome do cliente</label>
                <Input
                  value={manualForm.customer_name}
                  onChange={(event) => setManualFormField("customer_name", event.target.value)}
                  placeholder="Nome completo"
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-body text-xs text-muted-foreground">Telefone</label>
                <Input
                  value={manualForm.customer_phone}
                  onChange={(event) => setManualFormField("customer_phone", event.target.value)}
                  placeholder="(00) 00000-0000"
                  className="bg-background border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="font-body text-xs text-muted-foreground">Data</label>
                <Input
                  type="date"
                  value={manualForm.booking_date}
                  onChange={(event) => {
                    const value = event.target.value;
                    setManualFormField("booking_date", value);
                    if (value) {
                      setSelectedDate(new Date(`${value}T12:00:00`));
                    }
                  }}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-body text-xs text-muted-foreground">Horario</label>
                <Input
                  type="time"
                  step={300}
                  value={manualForm.booking_time}
                  onChange={(event) => setManualFormField("booking_time", event.target.value)}
                  disabled={manualForm.booking_type === "waitlist"}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-body text-xs text-muted-foreground">Observacoes</label>
                <Textarea
                  value={manualForm.notes}
                  onChange={(event) => setManualFormField("notes", event.target.value)}
                  placeholder="Ex.: cliente chegou sem marcar"
                  className="bg-background border-border min-h-10 h-10 resize-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-body text-xs text-muted-foreground">Servicos ({availableManualServices.length})</p>
              {availableManualServices.length === 0 ? (
                <p className="font-body text-xs text-muted-foreground bg-background border border-border rounded-md p-3">
                  Este profissional nao possui servicos ativos.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {availableManualServices.map((service) => {
                    const selected = manualForm.service_ids.includes(service.id);
                    const override = professionalServices.find((item) => item.service_id === service.id);
                    const effectivePrice = override?.custom_price ?? Number(service.price);
                    const effectiveDuration = override?.custom_duration_minutes ?? service.duration;

                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => toggleManualService(service.id)}
                        className={cn(
                          "w-full text-left border rounded-lg p-3 transition-all",
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-border bg-background hover:border-primary/30"
                        )}
                      >
                        <p className="font-body text-sm text-foreground font-medium">{service.name}</p>
                        <p className="font-body text-xs text-muted-foreground">
                          R$ {effectivePrice.toFixed(2)} - {effectiveDuration}min
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-border rounded-lg p-3 bg-background">
              <p className="font-body text-xs md:text-sm text-muted-foreground">
                Total: <span className="text-primary font-semibold">R$ {manualTotals.totalPrice.toFixed(2)}</span> -{" "}
                {manualTotals.totalDuration}min + {manualTotals.totalBuffer}min buffer
              </p>
              <Button type="submit" disabled={savingManualBooking}>
                {savingManualBooking ? "Salvando..." : "Salvar Agendamento"}
              </Button>
            </div>
          </form>
        </div>

        {professionals.length === 0 ? (
          <p className="text-muted-foreground font-body text-sm">Nenhum profissional cadastrado.</p>
        ) : (
          professionals.map((professional) => {
            const stats = getProfessionalStats(professional.id);
            const professionalBookings = bookingsByProfessional.get(professional.id) || [];
            const hasAvailability = getProAvailability(professional.id).length > 0;

            return (
              <div key={professional.id} className="border border-border rounded-xl overflow-hidden">
                <div className="bg-secondary p-3 md:p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {professional.photo_url ? (
                      <img src={professional.photo_url} alt={professional.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-display font-semibold text-foreground text-sm md:text-base">{professional.name}</h3>
                      {hasAvailability ? (
                        <p className="font-body text-xs text-muted-foreground">
                          {stats.bookingsCount} agendamento{stats.bookingsCount !== 1 ? "s" : ""} - R$ {stats.revenue.toFixed(2)}
                        </p>
                      ) : (
                        <p className="font-body text-xs text-muted-foreground">Sem expediente neste dia</p>
                      )}
                    </div>
                  </div>
                  {hasAvailability && (
                    <div className="flex gap-2 text-xs font-body shrink-0">
                      <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                        {stats.freeMinutes}min livres
                      </span>
                      <span className="px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">
                        {stats.bookedMinutes}min ocupados
                      </span>
                    </div>
                  )}
                </div>

                {hasAvailability && (
                  <div className="px-3 md:px-4 py-2 bg-card/50">
                    <div className="flex flex-wrap gap-0.5">
                      {getWorkingSlots(professional.id)
                        .filter((_, index) => index % 3 === 0)
                        .map((slot) => (
                          <div
                            key={`${professional.id}-${slot.time}`}
                            title={`${slot.time} - ${
                              slot.status === "booked"
                                ? `Ocupado: ${slot.booking?.customer_name || ""}`
                                : slot.status === "past"
                                  ? "Passado"
                                  : "Livre"
                            }`}
                            className={cn(
                              "w-3 h-3 md:w-4 md:h-4 rounded-sm text-[6px] md:text-[8px] flex items-center justify-center font-mono cursor-default",
                              slot.status === "booked" && "bg-primary/60 text-primary-foreground",
                              slot.status === "free" && "bg-green-500/20 text-green-500",
                              slot.status === "past" && "bg-muted text-muted-foreground/50"
                            )}
                          />
                        ))}
                    </div>
                    <div className="flex gap-3 mt-1 text-[10px] font-body text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-sm bg-green-500/20" />
                        Livre
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-sm bg-primary/60" />
                        Ocupado
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-sm bg-muted" />
                        Passado
                      </span>
                    </div>
                  </div>
                )}

                {professionalBookings.length > 0 ? (
                  <div className="divide-y divide-border">
                    {professionalBookings.map((booking) => {
                      const servicesSnapshot = Array.isArray(booking.services) ? (booking.services as ServiceSnapshot[]) : [];
                      return (
                        <div key={booking.id} className="p-3 md:p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                {booking.booking_time ? (
                                  <span className="flex items-center gap-1 text-primary font-mono text-sm font-bold shrink-0">
                                    <Clock className="w-3.5 h-3.5" />
                                    {booking.booking_time}
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-primary/80 font-body text-xs font-semibold shrink-0">
                                    {BOOKING_TYPE_LABELS[booking.booking_type] || "Sem horario"}
                                  </span>
                                )}
                                <span className="font-body font-semibold text-foreground truncate">{booking.customer_name}</span>
                              </div>
                              <p className="font-body text-xs text-muted-foreground">{booking.customer_phone}</p>
                            </div>
                            <span
                              className={`text-xs font-body font-semibold px-2 py-1 rounded border shrink-0 ${
                                STATUS_COLORS[booking.status] || ""
                              }`}
                            >
                              {STATUS_LABELS[booking.status] || booking.status}
                            </span>
                          </div>

                          <div className="font-body text-xs md:text-sm text-muted-foreground space-y-1">
                            <p className="truncate">
                              Tipo: {BOOKING_TYPE_LABELS[booking.booking_type] || booking.booking_type}
                            </p>
                            <p className="truncate">
                              Servicos:{" "}
                              {servicesSnapshot.map((service) => `${service.name} (${service.duration}min)`).join(" + ")}
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              <span>R$ {Number(booking.total_price).toFixed(2)}</span>
                              <span>{booking.total_duration}min</span>
                              <span>Ocupacao: {booking.total_occupied_minutes || booking.total_duration}min</span>
                            </div>
                            {booking.notes && <p className="truncate">Obs: {booking.notes}</p>}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {booking.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => updateStatus(booking.id, "confirmed")}
                                  className="bg-green-600 text-white font-body text-xs h-7"
                                >
                                  Confirmar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateStatus(booking.id, "cancelled")}
                                  className="font-body text-xs h-7"
                                >
                                  Cancelar
                                </Button>
                              </>
                            )}
                            {booking.status === "confirmed" && (
                              <Button
                                size="sm"
                                onClick={() => updateStatus(booking.id, "completed")}
                                className="bg-blue-600 text-white font-body text-xs h-7"
                              >
                                Concluir
                              </Button>
                            )}
                            {(booking.status === "pending" || booking.status === "confirmed") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendReminder(booking)}
                                title={(booking as any).reminder_sent_at ? `Enviado em ${new Date((booking as any).reminder_sent_at).toLocaleString("pt-BR")}` : "Enviar lembrete por WhatsApp"}
                                className={`font-body text-xs h-7 ${(booking as any).reminder_sent_at ? "border-green-500 text-green-400" : "border-border"}`}
                              >
                                <MessageCircle className="w-3 h-3 mr-1" />
                                {(booking as any).reminder_sent_at ? "Enviado" : "Lembrar"}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : hasAvailability ? (
                  <div className="p-3 text-center font-body text-xs text-muted-foreground">Nenhum agendamento neste dia</div>
                ) : null}
              </div>
            );
          })
        )}

        {(bookingsByProfessional.get("unassigned") || []).length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="bg-secondary p-3 md:p-4">
              <h3 className="font-display font-semibold text-foreground text-sm">Sem profissional atribuido</h3>
            </div>
            <div className="divide-y divide-border">
              {(bookingsByProfessional.get("unassigned") || []).map((booking) => {
                const servicesSnapshot = Array.isArray(booking.services) ? (booking.services as ServiceSnapshot[]) : [];
                return (
                  <div key={booking.id} className="p-3 md:p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-body font-semibold text-foreground truncate">{booking.customer_name}</p>
                        <p className="font-body text-xs text-muted-foreground">{booking.customer_phone}</p>
                      </div>
                      <span
                        className={`text-xs font-body font-semibold px-2 py-1 rounded border shrink-0 ${
                          STATUS_COLORS[booking.status] || ""
                        }`}
                      >
                        {STATUS_LABELS[booking.status] || booking.status}
                      </span>
                    </div>
                    <p className="font-body text-xs text-muted-foreground truncate">
                      {booking.booking_time || BOOKING_TYPE_LABELS[booking.booking_type] || "Ordem de chegada"} -{" "}
                      {servicesSnapshot.map((service) => service.name).join(", ")} - R$ {Number(booking.total_price).toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
