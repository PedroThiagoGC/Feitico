import { useMemo, useState } from "react";
import { type Json } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Clock, MessageCircle } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  addWeeks,
  isSameMonth,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useBookings, type Booking } from "@/hooks/useBooking";
import { useProfessionals } from "@/hooks/useProfessionals";
import { useSalon } from "@/hooks/useSalon";
import { getErrorMessage } from "@/hooks/useQueryError";
import { useBookingStatusMutation, useReminderSentMutation } from "@/hooks/useNotifications";
import { buildReminderMessage } from "@/services/notificationService";
import { toast } from "sonner";
import { formatDuration } from "@/lib/utils";

type ServiceSnapshot = { name: string };
type ViewMode = "month" | "week" | "day";

type CalendarBooking = Pick<
  Booking,
  "id" | "customer_name" | "professional_id" | "booking_date" | "booking_time" | "total_duration" | "total_price" | "status" | "services" | "booking_type"
> & {
  total_occupied_minutes: number | null;
};

type CalendarProfessional = {
  id: string;
  name: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 border-yellow-500/40 text-yellow-300",
  confirmed: "bg-green-500/20 border-green-500/40 text-green-300",
  completed: "bg-blue-500/20 border-blue-500/40 text-blue-300",
  cancelled: "bg-red-500/20 border-red-500/40 text-red-300 line-through opacity-60",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluido",
  cancelled: "Cancelado",
};

export default function AdminCalendar() {
  const { data: salon, error: salonError, isLoading: salonLoading } = useSalon();
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterPro, setFilterPro] = useState("all");

  const updateStatusMutation = useBookingStatusMutation();
  const reminderSentMutation = useReminderSentMutation();

  async function updateStatus(bookingId: string, status: "confirmed" | "completed" | "cancelled") {
    try {
      await updateStatusMutation.mutateAsync({ bookingId, status });
      toast.success("Status atualizado!");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleSendReminder(booking: CalendarBooking) {
    const phone = ((booking as any).customer_phone || "").replace(/\D/g, "");
    if (!phone) { toast.error("Telefone não disponível"); return; }
    const message = buildReminderMessage(booking as any);
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, "_blank");
    try {
      await reminderSentMutation.mutateAsync({ bookingId: booking.id });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const range = useMemo(() => {
    if (viewMode === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return {
        start: startOfWeek(monthStart, { weekStartsOn: 0 }),
        end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
      };
    }

    if (viewMode === "week") {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 0 }),
        end: endOfWeek(currentDate, { weekStartsOn: 0 }),
      };
    }

    return { start: currentDate, end: currentDate };
  }, [currentDate, viewMode]);

  const bookingsQuery = useBookings(salon?.id, {
    dateFrom: format(range.start, "yyyy-MM-dd"),
    dateTo: format(range.end, "yyyy-MM-dd"),
    limit: 500,
  });
  const professionalsQuery = useProfessionals(salon?.id, { includeInactive: false });

  const errorMessage = getErrorMessage(salonError ?? bookingsQuery.error ?? professionalsQuery.error);
  const professionals: CalendarProfessional[] = professionalsQuery.data ?? [];
  const bookings: CalendarBooking[] = useMemo(() => {
    const base = (bookingsQuery.data ?? []) as CalendarBooking[];
    return base.filter((booking) => booking.status !== "cancelled");
  }, [bookingsQuery.data]);

  const filteredBookings = useMemo(() => {
    if (filterPro === "all") return bookings;
    return bookings.filter((booking) => booking.professional_id === filterPro);
  }, [bookings, filterPro]);

  function navigate(direction: number) {
    if (viewMode === "month") setCurrentDate((date) => addMonths(date, direction));
    else if (viewMode === "week") setCurrentDate((date) => addWeeks(date, direction));
    else setCurrentDate((date) => addDays(date, direction));
  }

  function goToday() {
    setCurrentDate(new Date());
  }

  function getBookingsForDate(date: Date) {
    const dateStr = format(date, "yyyy-MM-dd");
    return filteredBookings.filter((booking) => booking.booking_date === dateStr);
  }

  function getProName(id: string | null) {
    if (!id) return "-";
    return professionals.find((professional) => professional.id === id)?.name || "-";
  }

  const headerLabel =
    viewMode === "month"
      ? format(currentDate, "MMMM yyyy", { locale: ptBR })
      : viewMode === "week"
        ? `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "dd MMM", { locale: ptBR })} - ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), "dd MMM yyyy", { locale: ptBR })}`
        : format(currentDate, "EEEE, dd 'de' MMMM yyyy", { locale: ptBR });

  if (salonLoading || bookingsQuery.isLoading || professionalsQuery.isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <p className="font-body text-sm text-muted-foreground">Carregando agenda...</p>
        </CardContent>
      </Card>
    );
  }

  if (errorMessage) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <p className="font-body text-sm text-destructive">{errorMessage}</p>
        </CardContent>
      </Card>
    );
  }

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
                {professionals.map((professional) => (
                  <SelectItem key={professional.id} value={professional.id}>{professional.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("month")}
                className={`px-2 py-1 text-xs font-body transition-colors ${viewMode === "month" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >
                <CalendarDays className="w-3 h-3 inline mr-1" />Mes
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-2 py-1 text-xs font-body transition-colors ${viewMode === "week" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >
                <CalendarRange className="w-3 h-3 inline mr-1" />Semana
              </button>
              <button
                onClick={() => setViewMode("day")}
                className={`px-2 py-1 text-xs font-body transition-colors ${viewMode === "day" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >
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
        {viewMode === "month" && (
          <MonthView
            currentDate={currentDate}
            getBookingsForDate={getBookingsForDate}
            onDayClick={(date) => {
              setCurrentDate(date);
              setViewMode("day");
            }}
          />
        )}
        {viewMode === "week" && (
          <WeekView
            currentDate={currentDate}
            getBookingsForDate={getBookingsForDate}
            getProName={getProName}
            onDayClick={(date) => {
              setCurrentDate(date);
              setViewMode("day");
            }}
          />
        )}
        {viewMode === "day" && (
          <DayView
            currentDate={currentDate}
            bookings={getBookingsForDate(currentDate)}
            getProName={getProName}
            professionals={professionals}
            filterPro={filterPro}
            onUpdateStatus={updateStatus}
            onSendReminder={handleSendReminder}
          />
        )}
      </CardContent>
    </Card>
  );
}

function MonthView({
  currentDate,
  getBookingsForDate,
  onDayClick,
}: {
  currentDate: Date;
  getBookingsForDate: (date: Date) => CalendarBooking[];
  onDayClick: (date: Date) => void;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  let dateCursor = calendarStart;
  while (dateCursor <= calendarEnd) {
    days.push(dateCursor);
    dateCursor = addDays(dateCursor, 1);
  }

  const weekDayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

  return (
    <div>
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {weekDayNames.map((name) => (
          <div key={name} className="bg-secondary p-1 md:p-2 text-center font-body text-xs text-muted-foreground font-medium">
            {name}
          </div>
        ))}
        {days.map((day) => {
          const dayBookings = getBookingsForDate(day);
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={`bg-card min-h-[60px] md:min-h-[80px] p-1 cursor-pointer hover:bg-secondary/50 transition-colors ${!inMonth ? "opacity-40" : ""}`}
            >
              <span className={`font-body text-xs font-medium block mb-0.5 ${today ? "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center" : "text-foreground"}`}>
                {format(day, "d")}
              </span>
              {dayBookings.slice(0, 3).map((booking) => (
                <div key={booking.id} className={`text-[10px] font-body px-1 py-0.5 rounded mb-0.5 truncate border ${STATUS_COLORS[booking.status] || ""}`}>
                  {booking.booking_time ? booking.booking_time.slice(0, 5) : "-"} {booking.customer_name.split(" ")[0]}
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

function WeekView({
  currentDate,
  getBookingsForDate,
  getProName,
  onDayClick,
}: {
  currentDate: Date;
  getBookingsForDate: (date: Date) => CalendarBooking[];
  getProName: (id: string | null) => string;
  onDayClick: (date: Date) => void;
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const days: Date[] = [];
  for (let index = 0; index < 7; index += 1) {
    days.push(addDays(weekStart, index));
  }

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
              {dayBookings.map((booking) => (
                <div key={booking.id} className={`text-xs font-body p-1.5 rounded border ${STATUS_COLORS[booking.status] || ""}`}>
                  <div className="font-medium truncate">
                    {booking.booking_time ? booking.booking_time.slice(0, 5) : "-"} - {booking.customer_name.split(" ")[0]}
                  </div>
                  <div className="text-[10px] opacity-80 truncate">{getProName(booking.professional_id)} - {booking.total_duration}min</div>
                </div>
              ))}
              {dayBookings.length === 0 && <span className="text-xs font-body text-muted-foreground/50">Livre</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayView({
  currentDate,
  bookings,
  getProName,
  professionals,
  filterPro,
  onUpdateStatus,
  onSendReminder,
}: {
  currentDate: Date;
  bookings: CalendarBooking[];
  getProName: (id: string | null) => string;
  professionals: CalendarProfessional[];
  filterPro: string;
  onUpdateStatus: (id: string, status: "confirmed" | "completed" | "cancelled") => Promise<void>;
  onSendReminder: (booking: CalendarBooking) => Promise<void>;
}) {
  const sortedBookings = [...bookings].sort((left, right) => {
    if (!left.booking_time) return 1;
    if (!right.booking_time) return -1;
    return left.booking_time.localeCompare(right.booking_time);
  });

  const showPros = filterPro === "all" ? professionals : professionals.filter((professional) => professional.id === filterPro);

  return (
    <div className="space-y-4">
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
          {showPros.map((professional) => {
            const professionalBookings = sortedBookings.filter((booking) => booking.professional_id === professional.id);
            return (
              <div key={professional.id} className="space-y-2">
                <h4 className="font-body text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  {professional.name}
                  <span className="text-xs text-muted-foreground font-normal">({professionalBookings.length} atendimentos)</span>
                </h4>
                {professionalBookings.length === 0 ? (
                  <p className="text-xs font-body text-muted-foreground pl-4">Sem agendamentos</p>
                ) : (
                  <div className="space-y-1 pl-4">
                    {professionalBookings.map((booking) => {
                      const services = Array.isArray(booking.services) ? (booking.services as ServiceSnapshot[]) : [];
                      return (
                        <div key={booking.id} className={`p-2 md:p-3 rounded-lg border ${STATUS_COLORS[booking.status] || "border-border bg-secondary"}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-body text-sm font-medium text-foreground">
                                {booking.booking_time ? booking.booking_time.slice(0, 5) : "Ordem de chegada"}
                              </span>
                              <span className="font-body text-sm text-foreground ml-2">- {booking.customer_name}</span>
                            </div>
                            <span className="text-[10px] font-body font-semibold px-1.5 py-0.5 rounded shrink-0">
                              {STATUS_LABELS[booking.status] || booking.status}
                            </span>
                          </div>
                          <div className="font-body text-xs text-muted-foreground mt-1">
                            {services.map((s) => s.name).join(", ")} · {formatDuration(booking.total_duration)} · R$ {Number(booking.total_price).toFixed(2)}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {booking.status === "pending" && (
                              <>
                                <Button size="sm" onClick={() => onUpdateStatus(booking.id, "confirmed")} className="bg-green-600 text-white font-body text-xs h-7">Confirmar</Button>
                                <Button size="sm" variant="destructive" onClick={() => onUpdateStatus(booking.id, "cancelled")} className="font-body text-xs h-7">Cancelar</Button>
                              </>
                            )}
                            {booking.status === "confirmed" && (
                              <Button size="sm" onClick={() => onUpdateStatus(booking.id, "completed")} className="bg-blue-600 text-white font-body text-xs h-7">Concluir</Button>
                            )}
                            {(booking.status === "pending" || booking.status === "confirmed") && (
                              <Button size="sm" variant="outline" onClick={() => onSendReminder(booking)} className="font-body text-xs h-7 border-border">
                                <MessageCircle className="w-3 h-3 mr-1" />Lembrar
                              </Button>
                            )}
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
            sortedBookings.map((booking) => {
              const services = Array.isArray(booking.services) ? (booking.services as ServiceSnapshot[]) : [];
              return (
                <div key={booking.id} className={`p-3 rounded-lg border ${STATUS_COLORS[booking.status] || "border-border bg-secondary"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-body text-sm font-medium">{booking.booking_time ? booking.booking_time.slice(0, 5) : "-"}</span>
                      <span className="font-body text-sm ml-2">- {booking.customer_name}</span>
                    </div>
                    <span className="text-[10px] font-body font-semibold">{STATUS_LABELS[booking.status] || booking.status}</span>
                  </div>
                  <div className="font-body text-xs text-muted-foreground mt-1">
                    {getProName(booking.professional_id)} · {services.map((s) => s.name).join(", ")} · {formatDuration(booking.total_duration)}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {booking.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => onUpdateStatus(booking.id, "confirmed")} className="bg-green-600 text-white font-body text-xs h-7">Confirmar</Button>
                        <Button size="sm" variant="destructive" onClick={() => onUpdateStatus(booking.id, "cancelled")} className="font-body text-xs h-7">Cancelar</Button>
                      </>
                    )}
                    {booking.status === "confirmed" && (
                      <Button size="sm" onClick={() => onUpdateStatus(booking.id, "completed")} className="bg-blue-600 text-white font-body text-xs h-7">Concluir</Button>
                    )}
                    {(booking.status === "pending" || booking.status === "confirmed") && (
                      <Button size="sm" variant="outline" onClick={() => onSendReminder(booking)} className="font-body text-xs h-7 border-border">
                        <MessageCircle className="w-3 h-3 mr-1" />Lembrar
                      </Button>
                    )}
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
