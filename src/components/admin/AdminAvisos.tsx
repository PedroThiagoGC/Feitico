import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Bell, CheckCircle, MessageCircle, XCircle } from "lucide-react";
import { getPrimarySalonId } from "@/services/salonService";
import { type Database } from "@/integrations/supabase/types";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type ServiceSnapshot = { name: string; duration: number };

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

function buildReminderMessage(booking: BookingRow): string {
  const snaps = Array.isArray(booking.services) ? (booking.services as ServiceSnapshot[]) : [];
  const names = snaps.map((s) => s.name).join(", ");
  const date = booking.booking_date
    ? new Date(`${booking.booking_date}T12:00:00`).toLocaleDateString("pt-BR")
    : "";
  const time = booking.booking_time ? ` às ${booking.booking_time}` : "";
  return `Olá ${booking.customer_name}! 👋\nLembrando do seu agendamento${date ? ` em ${date}` : ""}${time}.\n✂️ ${names || "Serviços"}\n\nAté lá! 😊`;
}

export default function AdminAvisos() {
  const [salonId, setSalonId] = useState("");
  const [pending, setPending] = useState<BookingRow[]>([]);
  const [todayList, setTodayList] = useState<BookingRow[]>([]);
  const [overdue, setOverdue] = useState<BookingRow[]>([]);

  const today = new Date().toISOString().split("T")[0];

  const load = useCallback(async () => {
    const id = await getPrimarySalonId();
    if (!id) return;
    setSalonId(id);

    const [{ data: p }, { data: t }, { data: o }] = await Promise.all([
      supabase.from("bookings").select("*").eq("salon_id", id).eq("status", "pending")
        .order("booking_date").order("booking_time").limit(50),
      supabase.from("bookings").select("*").eq("salon_id", id).eq("status", "confirmed")
        .eq("booking_date", today).order("booking_time").limit(50),
      supabase.from("bookings").select("*").eq("salon_id", id).eq("status", "confirmed")
        .lt("booking_date", today).order("booking_date").limit(50),
    ]);

    setPending(p as BookingRow[] || []);
    setTodayList(t as BookingRow[] || []);
    setOverdue(o as BookingRow[] || []);
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!salonId) return;
    const ch = supabase
      .channel(`avisos-realtime-${salonId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `salon_id=eq.${salonId}` }, () => void load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [salonId, load]);

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Status atualizado!"); load(); }
  }

  async function handleSendReminder(booking: BookingRow) {
    const phone = (booking.customer_phone || "").replace(/\D/g, "");
    if (!phone) { toast.error("Telefone não disponível"); return; }
    const msg = buildReminderMessage(booking);
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, "_blank");
    await (supabase as any).from("bookings").update({ reminder_sent_at: new Date().toISOString() }).eq("id", booking.id);
    load();
  }

  const total = pending.length + overdue.length;

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-xl flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Central de Avisos
            {total > 0 && (
              <span className="ml-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {total}
              </span>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Pending: awaiting confirmation */}
      <Section
        title="Aguardando confirmação"
        items={pending}
        emptyText="Nenhum agendamento pendente."
        color="text-yellow-400"
        renderActions={(b) => (
          <>
            <Button size="sm" onClick={() => updateStatus(b.id, "confirmed")} className="bg-green-600 text-white font-body text-xs h-7">
              <CheckCircle className="w-3 h-3 mr-1" /> Confirmar
            </Button>
            <Button size="sm" variant="destructive" onClick={() => updateStatus(b.id, "cancelled")} className="font-body text-xs h-7">
              <XCircle className="w-3 h-3 mr-1" /> Cancelar
            </Button>
          </>
        )}
      />

      {/* Today confirmed */}
      <Section
        title={`Hoje — confirmados (${todayList.length})`}
        items={todayList}
        emptyText="Nenhum agendamento confirmado para hoje."
        color="text-green-400"
        renderActions={(b) => (
          <Button
            size="sm" variant="outline"
            onClick={() => handleSendReminder(b)}
            title={(b as any).reminder_sent_at ? `Enviado em ${new Date((b as any).reminder_sent_at).toLocaleString("pt-BR")}` : "Enviar lembrete"}
            className={`font-body text-xs h-7 ${(b as any).reminder_sent_at ? "border-green-500 text-green-400" : "border-border"}`}
          >
            <MessageCircle className="w-3 h-3 mr-1" />
            {(b as any).reminder_sent_at ? "Enviado" : "Lembrar"}
          </Button>
        )}
      />

      {/* Overdue confirmed */}
      <Section
        title="Em atraso — precisam de ação"
        items={overdue}
        emptyText="Nenhum agendamento em atraso."
        color="text-destructive"
        renderActions={(b) => (
          <>
            <Button size="sm" onClick={() => updateStatus(b.id, "completed")} className="bg-blue-600 text-white font-body text-xs h-7">
              <CheckCircle className="w-3 h-3 mr-1" /> Concluir
            </Button>
            <Button size="sm" variant="destructive" onClick={() => updateStatus(b.id, "cancelled")} className="font-body text-xs h-7">
              <XCircle className="w-3 h-3 mr-1" /> Cancelar
            </Button>
          </>
        )}
      />
    </div>
  );
}

function Section({
  title,
  items,
  emptyText,
  color,
  renderActions,
}: {
  title: string;
  items: BookingRow[];
  emptyText: string;
  color: string;
  renderActions: (b: BookingRow) => React.ReactNode;
}) {
  type ServiceSnapshot = { name: string; duration: number };
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className={`font-display text-base ${color}`}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground font-body text-sm">{emptyText}</p>
        ) : (
          <div className="space-y-2">
            {items.map((b) => {
              const snaps = Array.isArray(b.services) ? (b.services as ServiceSnapshot[]) : [];
              return (
                <div key={b.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary border border-border">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-body font-semibold text-foreground text-sm">{b.customer_name}</span>
                      <span className="font-body text-xs text-muted-foreground">{b.customer_phone}</span>
                      {b.booking_time && (
                        <span className="font-mono text-xs text-primary font-bold">{b.booking_date} {b.booking_time}</span>
                      )}
                    </div>
                    <p className="font-body text-xs text-muted-foreground truncate">
                      {snaps.map((s) => s.name).join(", ")} — R$ {Number(b.total_price).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                    {renderActions(b)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
