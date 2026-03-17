import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => { loadBookings(); loadProfessionals(); }, [filter]);

  async function loadProfessionals() {
    const { data: salon } = await supabase.from("salons").select("id").limit(1).maybeSingle();
    if (salon) {
      const { data } = await supabase.from("professionals").select("id, name").eq("salon_id", salon.id);
      setProfessionals(data || []);
    }
  }

  async function loadBookings() {
    let query = supabase.from("bookings").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query.limit(100);
    setBookings(data || []);
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Status atualizado!"); loadBookings(); }
  }

  function getProName(id: string | null) {
    if (!id) return "—";
    return professionals.find((p) => p.id === id)?.name || "—";
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    confirmed: "bg-green-500/20 text-green-400",
    completed: "bg-blue-500/20 text-blue-400",
    cancelled: "bg-red-500/20 text-red-400",
  };
  const statusLabels: Record<string, string> = {
    pending: "Pendente", confirmed: "Confirmado", completed: "Concluído", cancelled: "Cancelado",
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-xl">Agendamentos</CardTitle>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40 bg-secondary border-border font-body"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="confirmed">Confirmados</SelectItem>
            <SelectItem value="completed">Concluídos</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p className="text-muted-foreground font-body text-sm">Nenhum agendamento encontrado.</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const services = Array.isArray(b.services) ? b.services : [];
              return (
                <div key={b.id} className="p-4 rounded-lg bg-secondary border border-border space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-body font-semibold text-foreground">{b.customer_name}</p>
                      <p className="font-body text-sm text-muted-foreground">{b.customer_phone}</p>
                    </div>
                    <span className={`text-xs font-body font-semibold px-2 py-1 rounded ${statusColors[b.status] || ""}`}>
                      {statusLabels[b.status] || b.status}
                    </span>
                  </div>
                  <div className="font-body text-sm text-muted-foreground space-y-0.5">
                    <p>👤 Profissional: <span className="text-foreground">{getProName(b.professional_id)}</span></p>
                    <p>📅 {format(new Date(b.booking_date + "T12:00:00"), "dd/MM/yyyy")} {b.booking_time ? `às ${b.booking_time}` : "(ordem de chegada)"}</p>
                    <p>✂️ {services.map((s: any) => s.name).join(", ")}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-1 mt-1 text-xs">
                      <span>💰 R$ {Number(b.total_price).toFixed(2)}</span>
                      <span>⏱️ Duração: {b.total_duration}min</span>
                      <span>🔄 Margem: {b.total_buffer_minutes || 0}min</span>
                      <span>📊 Ocupação: {b.total_occupied_minutes || b.total_duration}min</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
                      <span>🏷️ Comissão: R$ {Number(b.commission_amount || 0).toFixed(2)}</span>
                      <span>📈 Lucro: R$ {Number(b.profit_amount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    {b.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => updateStatus(b.id, "confirmed")} className="bg-green-600 text-white font-body text-xs">Confirmar</Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(b.id, "cancelled")} className="font-body text-xs">Cancelar</Button>
                      </>
                    )}
                    {b.status === "confirmed" && (
                      <Button size="sm" onClick={() => updateStatus(b.id, "completed")} className="bg-blue-600 text-white font-body text-xs">Concluir</Button>
                    )}
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
