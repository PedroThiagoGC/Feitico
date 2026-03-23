import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Json } from "@/integrations/supabase/types";

type ServiceSnapshot = { name: string };
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, addWeeks, isSameMonth, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

type ViewMode = "month" | "week" | "day";

interface Booking {
  id: string;
  customer_name: string;
  professional_id: string | null;
  booking_date: string;
  booking_time: string | null;
  total_duration: number;
  total_occupied_minutes: number;
  total_price: number;
  status: string;
  services: Json;
  booking_type: string;
}

interface Professional {
  id: string;
  name: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 border-yellow-500/40 text-yellow-300",
  confirmed: "bg-green-500/20 border-green-500/40 text-green-300",
  completed: "bg-blue-500/20 border-blue-500/40 text-blue-300",
  cancelled: "bg-red-500/20 border-red-500/40 text-red-300 line-through opacity-60",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export default function AdminCalendar() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filterPro, setFilterPro] = useState("all");
  const [salonId, setSalonId] = useState("");

  useEffect(() => {
    loadProfessionals();
  }, []);

  useEffect(() => {
    if (salonId) loadBookings();
  }, [salonId, currentDate, viewMode]);

  async function loadProfessionals() {
    const { data: salon } = await supabase.from("salons").select("id").limit(1).maybeSingle();
    if (salon) {
      setSalonId(salon.id);
      const { data } = await supabase.from("professionals").select("id, name").eq("salon_id", salon.id).order("name");
      setProfessionals(data || []);
    }
  }

  async function loadBookings() {
    const { start, end } = getDateRange();
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("salon_id", salonId)
      .gte("booking_date", format(start, "yyyy-MM-dd"))
      .lte("booking_date", format(end, "yyyy-MM-dd"))
      .neq("status", "cancelled")
      .order("booking_time", { ascending: true });
    setBookings(data || []);
  }

  function getDateRange() {
    if (viewMode === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return { start: startOfWeek(monthStart, { weekStartsOn: 0 }), end: endOfWeek(monthEnd, { weekStartsOn: 0 }) };
    }
    if (viewMode === "week") {
      return { start: startOfWeek(currentDate, { weekStartsOn: 0 }), end: endOfWeek(currentDate, { weekStartsOn: 0 }) };
    }
    return { start: currentDate, end: currentDate };
  }

  function navigate(dir: number) {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, dir));
    else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, dir));
    else setCurrentDate(addDays(currentDate, dir));
  }

  function goToday() {
    setCurrentDate(new Date());
  }

  const filteredBookings = useMemo(() => {
    if (filterPro === "all") return bookings;
    return bookings.filter((b) => b.professional_id === filterPro);
  }, [bookings, filterPro]);

  function getBookingsForDate(date: Date) {
    const dateStr = format(date, "yyyy-MM-dd");
    return filteredBookings.filter((b) => b.booking_date === dateStr);
  }

  function getProName(id: string | null) {
    if (!id) return "—";
    return professionals.find((p) => p.id === id)?.name || "—";
  }

  const headerLabel = viewMode === "month"
    ? format(currentDate, "MMMM yyyy", { locale: ptBR })
    : viewMode === "week"
      ? `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "dd MMM", { locale: ptBR })} — ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), "dd MMM yyyy", { locale: ptBR })}`
      : format(currentDate, "EEEE, dd 'de' MMMM yyyy", { locale: ptBR });

  return (
    <Card className="bg-card border-border">
      <CardHeader className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="font-display text-lg md:text-xl">Agenda</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filterPro} onValueChange={setFilterPro}>
              <SelectTrigger className="w-36 bg-secondary border-border font-body text-xs h-8">
                <SelectValue placeholder="Profissional" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">Todos</SelectItem>
                {professionals.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex border border-border rounded-lg overflow-hidden">
              <button onClick={() => setViewMode("month")}
                className={`px-2 py-1 text-xs font-body transition-colors ${viewMode === "month" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                <CalendarDays className="w-3 h-3 inline mr-1" />Mês
              </button>
              <button onClick={() => setViewMode("week")}
                className={`px-2 py-1 text-xs font-body transition-colors ${viewMode === "week" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                <CalendarRange className="w-3 h-3 inline mr-1" />Semana
              </button>
              <button onClick={() => setViewMode("day")}
                className={`px-2 py-1 text-xs font-body transition-colors ${viewMode === "day" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                <Clock className="w-3 h-3 inline mr-1" />Dia
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate(1)} className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToday} className="font-body text-xs h-8 border-border">
              Hoje
            </Button>
          </div>
          <h3 className="font-display text-sm md:text-base font-semibold text-foreground capitalize">{headerLabel}</h3>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "month" && <MonthView currentDate={currentDate} getBookingsForDate={getBookingsForDate} getProName={getProName} onDayClick={(d) => { setCurrentDate(d); setViewMode("day"); }} />}
        {viewMode === "week" && <WeekView currentDate={currentDate} getBookingsForDate={getBookingsForDate} getProName={getProName} onDayClick={(d) => { setCurrentDate(d); setViewMode("day"); }} />}
        {viewMode === "day" && <DayView currentDate={currentDate} bookings={getBookingsForDate(currentDate)} getProName={getProName} professionals={professionals} filterPro={filterPro} />}
      </CardContent>
    </Card>
  );
}

function MonthView({ currentDate, getBookingsForDate, getProName, onDayClick }: {
  currentDate: Date; getBookingsForDate: (d: Date) => Booking[]; getProName: (id: string | null) => string; onDayClick: (d: Date) => void;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  let d = calStart;
  while (d <= calEnd) { days.push(d); d = addDays(d, 1); }

  const weekDayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div>
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {weekDayNames.map((name) => (
          <div key={name} className="bg-secondary p-1 md:p-2 text-center font-body text-xs text-muted-foreground font-medium">
            {name}
          </div>
        ))}
        {days.map((day, i) => {
          const dayBookings = getBookingsForDate(day);
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          return (
            <div
              key={i}
              onClick={() => onDayClick(day)}
              className={`bg-card min-h-[60px] md:min-h-[80px] p-1 cursor-pointer hover:bg-secondary/50 transition-colors ${!inMonth ? "opacity-40" : ""}`}
            >
              <span className={`font-body text-xs font-medium block mb-0.5 ${today ? "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center" : "text-foreground"}`}>
                {format(day, "d")}
              </span>
              {dayBookings.slice(0, 3).map((b) => (
                <div key={b.id} className={`text-[10px] font-body px-1 py-0.5 rounded mb-0.5 truncate border ${STATUS_COLORS[b.status] || ""}`}>
                  {b.booking_time ? b.booking_time.slice(0, 5) : "—"} {b.customer_name.split(" ")[0]}
                </div>
              ))}
              {dayBookings.length > 3 && (
                <span className="text-[10px] font-body text-muted-foreground">+{dayBookings.length - 3} mais</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ currentDate, getBookingsForDate, getProName, onDayClick }: {
  currentDate: Date; getBookingsForDate: (d: Date) => Booking[]; getProName: (id: string | null) => string; onDayClick: (d: Date) => void;
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) days.push(addDays(weekStart, i));

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
      {days.map((day) => {
        const dayBookings = getBookingsForDate(day);
        const today = isToday(day);
        return (
          <div
            key={day.toISOString()}
            className={`rounded-lg border p-2 min-h-[100px] cursor-pointer hover:bg-secondary/50 transition-colors ${today ? "border-primary bg-primary/5" : "border-border bg-card"}`}
            onClick={() => onDayClick(day)}
          >
            <div className="mb-2">
              <span className={`font-body text-xs font-medium block capitalize ${today ? "text-primary" : "text-muted-foreground"}`}>
                {format(day, "EEE", { locale: ptBR })}
              </span>
              <span className={`font-display text-lg font-bold ${today ? "text-primary" : "text-foreground"}`}>
                {format(day, "dd")}
              </span>
            </div>
            <div className="space-y-1">
              {dayBookings.map((b) => (
                <div key={b.id} className={`text-xs font-body p-1.5 rounded border ${STATUS_COLORS[b.status] || ""}`}>
                  <div className="font-medium truncate">
                    {b.booking_time ? b.booking_time.slice(0, 5) : "—"} · {b.customer_name.split(" ")[0]}
                  </div>
                  <div className="text-[10px] opacity-80 truncate">{getProName(b.professional_id)} · {b.total_duration}min</div>
                </div>
              ))}
              {dayBookings.length === 0 && (
                <span className="text-xs font-body text-muted-foreground/50">Livre</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayView({ currentDate, bookings, getProName, professionals, filterPro }: {
  currentDate: Date; bookings: Booking[]; getProName: (id: string | null) => string; professionals: Professional[]; filterPro: string;
}) {
  const hours: string[] = [];
  for (let h = 6; h <= 22; h++) {
    hours.push(`${h.toString().padStart(2, "0")}:00`);
  }

  const sortedBookings = [...bookings].sort((a, b) => {
    if (!a.booking_time) return 1;
    if (!b.booking_time) return -1;
    return a.booking_time.localeCompare(b.booking_time);
  });

  const showPros = filterPro === "all" ? professionals : professionals.filter((p) => p.id === filterPro);

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="flex items-center gap-3 mb-4">
        <span className="font-display text-sm font-semibold text-foreground capitalize">
          {format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </span>
        <span className="text-xs font-body text-muted-foreground">
          {bookings.length} agendamento{bookings.length !== 1 ? "s" : ""}
        </span>
      </div>

      {showPros.length > 0 ? (
        <div className="space-y-4">
          {showPros.map((pro) => {
            const proBookings = sortedBookings.filter((b) => b.professional_id === pro.id);
            return (
              <div key={pro.id} className="space-y-2">
                <h4 className="font-body text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  {pro.name}
                  <span className="text-xs text-muted-foreground font-normal">({proBookings.length} atendimentos)</span>
                </h4>
                {proBookings.length === 0 ? (
                  <p className="text-xs font-body text-muted-foreground pl-4">Sem agendamentos</p>
                ) : (
                  <div className="space-y-1 pl-4">
                    {proBookings.map((b) => {
                        const services = Array.isArray(b.services) ? (b.services as ServiceSnapshot[]) : [];
                      return (
                        <div key={b.id} className={`p-2 md:p-3 rounded-lg border ${STATUS_COLORS[b.status] || "border-border bg-secondary"}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-body text-sm font-medium text-foreground">
                                {b.booking_time ? b.booking_time.slice(0, 5) : "Ordem de chegada"}
                              </span>
                              <span className="font-body text-sm text-foreground ml-2">— {b.customer_name}</span>
                            </div>
                            <span className={`text-[10px] font-body font-semibold px-1.5 py-0.5 rounded shrink-0`}>
                              {STATUS_LABELS[b.status] || b.status}
                            </span>
                          </div>
                          <div className="font-body text-xs text-muted-foreground mt-1">
                              {services.map((s) => s.name).join(", ")} · {b.total_duration}min · R$ {Number(b.total_price).toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-1">
          {sortedBookings.length === 0 ? (
            <p className="text-sm font-body text-muted-foreground">Nenhum agendamento para este dia.</p>
          ) : (
            sortedBookings.map((b) => {
              const services = Array.isArray(b.services) ? (b.services as ServiceSnapshot[]) : [];
              return (
                <div key={b.id} className={`p-3 rounded-lg border ${STATUS_COLORS[b.status] || "border-border bg-secondary"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-body text-sm font-medium">{b.booking_time ? b.booking_time.slice(0, 5) : "—"}</span>
                      <span className="font-body text-sm ml-2">— {b.customer_name}</span>
                    </div>
                    <span className="text-[10px] font-body font-semibold">{STATUS_LABELS[b.status]}</span>
                  </div>
                  <div className="font-body text-xs text-muted-foreground mt-1">
                    {getProName(b.professional_id)} · {services.map((s) => s.name).join(", ")} · {b.total_duration}min
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
