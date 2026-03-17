import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AdminFinancials() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => { load(); }, [dateFrom, dateTo]);

  async function load() {
    const { data: salon } = await supabase.from("salons").select("id").limit(1).maybeSingle();
    if (!salon) return;
    const { data: pros } = await supabase.from("professionals").select("*").eq("salon_id", salon.id);
    setProfessionals(pros || []);
    const { data: bks } = await supabase
      .from("bookings")
      .select("*")
      .eq("salon_id", salon.id)
      .eq("status", "completed")
      .gte("booking_date", dateFrom)
      .lte("booking_date", dateTo);
    setBookings(bks || []);
  }

  const totalRevenue = bookings.reduce((a, b) => a + Number(b.total_price), 0);
  const totalCommission = bookings.reduce((a, b) => a + Number(b.commission_amount || 0), 0);
  const totalProfit = bookings.reduce((a, b) => a + Number(b.profit_amount || 0), 0);
  const totalOccupied = bookings.reduce((a, b) => a + (b.total_occupied_minutes || b.total_duration || 0), 0);

  const proStats = professionals.map((p) => {
    const pBookings = bookings.filter((b) => b.professional_id === p.id);
    const revenue = pBookings.reduce((a, b) => a + Number(b.total_price), 0);
    const commission = pBookings.reduce((a, b) => a + Number(b.commission_amount || 0), 0);
    const profit = pBookings.reduce((a, b) => a + Number(b.profit_amount || 0), 0);
    const count = pBookings.length;
    const occupied = pBookings.reduce((a, b) => a + (b.total_occupied_minutes || b.total_duration || 0), 0);
    return { ...p, revenue, commission, profit, count, occupied, ticket: count > 0 ? revenue / count : 0 };
  }).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Date filter */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-body text-sm">De</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-secondary border-border font-body h-10" />
        </div>
        <div>
          <label className="font-body text-sm">Até</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-secondary border-border font-body h-10" />
        </div>
      </div>

      {/* General stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Faturamento Bruto", value: `R$ ${totalRevenue.toFixed(2)}`, color: "text-primary" },
          { label: "Comissões", value: `R$ ${totalCommission.toFixed(2)}`, color: "text-yellow-400" },
          { label: "Lucro Líquido", value: `R$ ${totalProfit.toFixed(2)}`, color: "text-green-400" },
          { label: "Atendimentos", value: String(bookings.length), color: "text-foreground" },
        ].map((c) => (
          <Card key={c.label} className="bg-card border-border">
            <CardContent className="p-3 md:p-4 text-center">
              <p className="font-body text-xs text-muted-foreground mb-1">{c.label}</p>
              <p className={`font-display text-lg md:text-xl font-bold ${c.color}`}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Per-professional - card layout for mobile, table for desktop */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg">Por Profissional</CardTitle>
        </CardHeader>
        <CardContent>
          {proStats.length === 0 ? (
            <p className="text-muted-foreground font-body text-sm">Nenhum dado disponível.</p>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {proStats.map((p) => (
                  <div key={p.id} className="p-3 rounded-lg bg-secondary border border-border space-y-2">
                    <p className="font-body font-semibold text-foreground">{p.name}</p>
                    <div className="grid grid-cols-2 gap-1 font-body text-xs">
                      <span className="text-muted-foreground">Atendimentos:</span>
                      <span className="text-foreground text-right">{p.count}</span>
                      <span className="text-muted-foreground">Faturamento:</span>
                      <span className="text-primary text-right">R$ {p.revenue.toFixed(2)}</span>
                      <span className="text-muted-foreground">Comissão:</span>
                      <span className="text-yellow-400 text-right">R$ {p.commission.toFixed(2)}</span>
                      <span className="text-muted-foreground">Lucro:</span>
                      <span className="text-green-400 text-right">R$ {p.profit.toFixed(2)}</span>
                      <span className="text-muted-foreground">Ticket Médio:</span>
                      <span className="text-foreground text-right">R$ {p.ticket.toFixed(2)}</span>
                      <span className="text-muted-foreground">Tempo Ocupado:</span>
                      <span className="text-foreground text-right">{p.occupied} min</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full font-body text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="pb-2">Profissional</th>
                      <th className="pb-2 text-right">Atend.</th>
                      <th className="pb-2 text-right">Faturamento</th>
                      <th className="pb-2 text-right">Comissão</th>
                      <th className="pb-2 text-right">Lucro</th>
                      <th className="pb-2 text-right">Ticket Médio</th>
                      <th className="pb-2 text-right">Tempo Ocupado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proStats.map((p) => (
                      <tr key={p.id} className="border-b border-border/50">
                        <td className="py-2 text-foreground font-medium">{p.name}</td>
                        <td className="py-2 text-right">{p.count}</td>
                        <td className="py-2 text-right text-primary">R$ {p.revenue.toFixed(2)}</td>
                        <td className="py-2 text-right text-yellow-400">R$ {p.commission.toFixed(2)}</td>
                        <td className="py-2 text-right text-green-400">R$ {p.profit.toFixed(2)}</td>
                        <td className="py-2 text-right">R$ {p.ticket.toFixed(2)}</td>
                        <td className="py-2 text-right">{p.occupied} min</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
