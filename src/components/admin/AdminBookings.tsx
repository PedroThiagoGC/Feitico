import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Database } from "@/integrations/supabase/types";

type ServiceSnapshot = { name: string; duration: number };
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"]
type ProfessionalRow = Pick<Database["public"]["Tables"]["professionals"]["Row"], "id" | "name" | "photo_url">
type AvailabilityRow = Database["public"]["Tables"]["professional_availability"]["Row"]

export default function AdminBookings() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalRow[]>([]);
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState("all");
  const [salonId, setSalonId] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: salon, error: salonError } = await supabase.from("salons").select("id").limit(1).maybeSingle();
      if (salonError) { toast.error("Erro ao carregar dados"); return; }
      if (salon) {
        setSalonId(salon.id);
        const { data: pros, error: prosError } = await supabase.from("professionals").select("id, name, photo_url").eq("salon_id", salon.id).eq("active", true).order("name");
        if (prosError) { toast.error("Erro ao carregar dados"); return; }
        setProfessionals(pros || []);
        const { data: avail, error: availError } = await supabase.from("professional_availability").select("*").eq("active", true);
        if (availError) { toast.error("Erro ao carregar dados"); return; }
        setAvailability(avail || []);
      }
    })();
  }, []);

  useEffect(() => {
    if (!salonId) return;
    loadBookings();
  }, [salonId, selectedDate, statusFilter]);

  async function loadBookings() {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    let query = supabase.from("bookings").select("*").eq("salon_id", salonId).eq("booking_date", dateStr).order("booking_time", { ascending: true });
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    const { data, error } = await query;
    if (error) { toast.error("Erro ao carregar dados"); return; }
    setBookings(data || []);
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Status atualizado!"); loadBookings(); }
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
    completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  const statusLabels: Record<string, string> = {
    pending: "Pendente", confirmed: "Confirmado", completed: "Concluído", cancelled: "Cancelado",
  };

  // Get availability for a professional on the selected date
  function getProAvailability(proId: string) {
    const dayOfWeek = selectedDate.getDay();
    return availability.filter((a) => a.professional_id === proId && a.weekday === dayOfWeek);
  }

  // Generate all possible 5-min slots for a professional's working hours
  function getWorkingSlots(proId: string): { time: string; status: "free" | "booked" | "past"; booking?: BookingRow }[] {
    const avails = getProAvailability(proId);
    if (avails.length === 0) return [];

    const proBookings = bookings.filter((b) => b.professional_id === proId && b.status !== "cancelled");
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
        const timeStr = `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;

        // Check if this slot is booked
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

  // Group bookings by professional
  const bookingsByPro = useMemo(() => {
    const map = new Map<string, BookingRow[]>();
    for (const pro of professionals) {
      map.set(pro.id, bookings.filter((b) => b.professional_id === pro.id && b.status !== "cancelled"));
    }
    // Bookings without professional
    const unassigned = bookings.filter((b) => !b.professional_id || !professionals.some((p) => p.id === b.professional_id));
    if (unassigned.length > 0) map.set("unassigned", unassigned);
    return map;
  }, [bookings, professionals]);

  // Stats per professional
  function getProStats(proId: string) {
    const slots = getWorkingSlots(proId);
    const totalSlots = slots.length;
    const bookedSlots = slots.filter((s) => s.status === "booked").length;
    const freeSlots = slots.filter((s) => s.status === "free").length;
    const proBooks = bookingsByPro.get(proId) || [];
    const revenue = proBooks.reduce((a, b) => a + Number(b.total_price), 0);
    return { totalSlots, bookedSlots, freeSlots, totalHours: totalSlots * 5, bookedHours: bookedSlots * 5, freeHours: freeSlots * 5, revenue, bookingsCount: proBooks.length };
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
              <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} locale={ptBR} className="pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 bg-secondary border-border font-body h-9 text-sm"><SelectValue /></SelectTrigger>
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
          <p className="text-muted-foreground font-body text-sm">Nenhum profissional cadastrado.</p>
        ) : (
          professionals.map((pro) => {
            const stats = getProStats(pro.id);
            const proBookings = bookingsByPro.get(pro.id) || [];
            const hasAvailability = getProAvailability(pro.id).length > 0;

            return (
              <div key={pro.id} className="border border-border rounded-xl overflow-hidden">
                {/* Professional Header */}
                <div className="bg-secondary p-3 md:p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {pro.photo_url ? (
                      <img src={pro.photo_url} alt={pro.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><User className="w-5 h-5" /></div>
                    )}
                    <div>
                      <h3 className="font-display font-semibold text-foreground text-sm md:text-base">{pro.name}</h3>
                      {hasAvailability ? (
                        <p className="font-body text-xs text-muted-foreground">
                          {stats.bookingsCount} agendamento{stats.bookingsCount !== 1 ? "s" : ""} · R$ {stats.revenue.toFixed(2)}
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

                {/* Timeline - compact slot visualization */}
                {hasAvailability && (
                  <div className="px-3 md:px-4 py-2 bg-card/50">
                    <div className="flex flex-wrap gap-0.5">
                      {getWorkingSlots(pro.id).filter((_, i) => i % 3 === 0).map((slot) => (
                        <div
                          key={slot.time}
                          title={`${slot.time} - ${slot.status === "booked" ? `Ocupado: ${slot.booking?.customer_name}` : slot.status === "past" ? "Passado" : "Livre"}`}
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
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500/20" /> Livre</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary/60" /> Ocupado</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-muted" /> Passado</span>
                    </div>
                  </div>
                )}

                {/* Bookings list */}
                {proBookings.length > 0 ? (
                  <div className="divide-y divide-border">
                    {proBookings.map((b) => {
                      const bServices = Array.isArray(b.services) ? (b.services as ServiceSnapshot[]) : [];
                      return (
                        <div key={b.id} className="p-3 md:p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                {b.booking_time && (
                                  <span className="flex items-center gap-1 text-primary font-mono text-sm font-bold shrink-0">
                                    <Clock className="w-3.5 h-3.5" />{b.booking_time}
                                  </span>
                                )}
                                <span className="font-body font-semibold text-foreground truncate">{b.customer_name}</span>
                              </div>
                              <p className="font-body text-xs text-muted-foreground">{b.customer_phone}</p>
                            </div>
                            <span className={`text-xs font-body font-semibold px-2 py-1 rounded border shrink-0 ${statusColors[b.status] || ""}`}>
                              {statusLabels[b.status] || b.status}
                            </span>
                          </div>

                          <div className="font-body text-xs md:text-sm text-muted-foreground">
                            <p className="truncate">✂️ {bServices.map((s) => `${s.name} (${s.duration}min)`).join(" + ")}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                              <span>💰 R$ {Number(b.total_price).toFixed(2)}</span>
                              <span>⏱️ {b.total_duration}min</span>
                              <span>📊 Ocupação: {b.total_occupied_minutes || b.total_duration}min</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {b.status === "pending" && (
                              <>
                                <Button size="sm" onClick={() => updateStatus(b.id, "confirmed")} className="bg-green-600 text-white font-body text-xs h-7">Confirmar</Button>
                                <Button size="sm" variant="destructive" onClick={() => updateStatus(b.id, "cancelled")} className="font-body text-xs h-7">Cancelar</Button>
                              </>
                            )}
                            {b.status === "confirmed" && (
                              <Button size="sm" onClick={() => updateStatus(b.id, "completed")} className="bg-blue-600 text-white font-body text-xs h-7">Concluir</Button>
                            )}
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

        {/* Unassigned bookings */}
        {(bookingsByPro.get("unassigned") || []).length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="bg-secondary p-3 md:p-4">
              <h3 className="font-display font-semibold text-foreground text-sm">Sem profissional atribuído</h3>
            </div>
            <div className="divide-y divide-border">
              {(bookingsByPro.get("unassigned") || []).map((b) => {
                const bServices = Array.isArray(b.services) ? (b.services as ServiceSnapshot[]) : [];
                return (
                  <div key={b.id} className="p-3 md:p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-body font-semibold text-foreground truncate">{b.customer_name}</p>
                        <p className="font-body text-xs text-muted-foreground">{b.customer_phone}</p>
                      </div>
                      <span className={`text-xs font-body font-semibold px-2 py-1 rounded border shrink-0 ${statusColors[b.status] || ""}`}>
                        {statusLabels[b.status] || b.status}
                      </span>
                    </div>
                    <p className="font-body text-xs text-muted-foreground truncate">
                      {b.booking_time || "Ordem de chegada"} · ✂️ {bServices.map((s) => s.name).join(", ")} · R$ {Number(b.total_price).toFixed(2)}
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
