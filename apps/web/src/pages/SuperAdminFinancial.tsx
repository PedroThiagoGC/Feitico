import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Users, CalendarCheck } from "lucide-react";
import { superadminApi } from "@/services/superadminApi";

interface TenantFinancial {
  id: string;
  name: string;
  revenue: number;
  bookings: number;
  professionals: number;
  ticket: number;
}

export default function SuperAdminFinancial() {
  const [tenantStats, setTenantStats] = useState<TenantFinancial[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ revenue: 0, bookings: 0, professionals: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const tenants = await superadminApi.getTenants();
        const stats: TenantFinancial[] = [];
        let totalRev = 0, totalBk = 0, totalPro = 0;

        for (const tenant of (tenants || []).slice(0, 20)) {
          try {
            const [bookings, pros] = await Promise.all([
              superadminApi.getAllBookings({ salonId: tenant.id }).catch(() => []),
              superadminApi.getAllProfessionals(tenant.id).catch(() => []),
            ]);
            const revenue = (bookings || []).reduce((s: number, b: any) => s + Number(b.total_price || 0), 0);
            const count = (bookings || []).length;
            totalRev += revenue;
            totalBk += count;
            totalPro += (pros || []).length;
            stats.push({
              id: tenant.id,
              name: tenant.name,
              revenue,
              bookings: count,
              professionals: (pros || []).length,
              ticket: count > 0 ? revenue / count : 0,
            });
          } catch { /* skip */ }
        }

        stats.sort((a, b) => b.revenue - a.revenue);
        setTenantStats(stats);
        setTotals({ revenue: totalRev, bookings: totalBk, professionals: totalPro });
      } catch (error) {
        console.error("Failed to load financial data:", error);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const summaryCards = [
    { label: "Faturamento Total", value: `R$ ${totals.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
    { label: "Total Agendamentos", value: String(totals.bookings), icon: CalendarCheck, color: "text-violet-400", bg: "bg-violet-400/10" },
    { label: "Total Profissionais", value: String(totals.professionals), icon: Users, color: "text-sky-400", bg: "bg-sky-400/10" },
    { label: "Ticket Médio", value: `R$ ${totals.bookings > 0 ? (totals.revenue / totals.bookings).toFixed(2) : "0.00"}`, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-card border-border"><CardContent className="p-4"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-20" /></CardContent></Card>
        )) : summaryCards.map(card => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mb-2`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <p className="font-body text-xs text-muted-foreground">{card.label}</p>
                <p className={`font-display text-xl font-bold ${card.color} mt-1`}>{card.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Per tenant table */}
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="font-display text-lg">Faturamento por Tenant</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : tenantStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 font-body">Sem dados financeiros</p>
          ) : (
            <>
              {/* Mobile */}
              <div className="md:hidden space-y-2">
                {tenantStats.map(t => (
                  <div key={t.id} className="p-3 rounded-lg bg-secondary/50 space-y-1">
                    <p className="font-body text-sm font-semibold text-foreground">{t.name}</p>
                    <div className="grid grid-cols-2 gap-1 font-body text-xs">
                      <span className="text-muted-foreground">Faturamento:</span>
                      <span className="text-primary text-right">R$ {t.revenue.toFixed(2)}</span>
                      <span className="text-muted-foreground">Agendamentos:</span>
                      <span className="text-right">{t.bookings}</span>
                      <span className="text-muted-foreground">Ticket Médio:</span>
                      <span className="text-right">R$ {t.ticket.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full font-body text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="pb-2">Tenant</th>
                      <th className="pb-2 text-right">Profissionais</th>
                      <th className="pb-2 text-right">Agendamentos</th>
                      <th className="pb-2 text-right">Faturamento</th>
                      <th className="pb-2 text-right">Ticket Médio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantStats.map(t => (
                      <tr key={t.id} className="border-b border-border/50">
                        <td className="py-2.5 font-medium text-foreground">{t.name}</td>
                        <td className="py-2.5 text-right">{t.professionals}</td>
                        <td className="py-2.5 text-right">{t.bookings}</td>
                        <td className="py-2.5 text-right text-primary">R$ {t.revenue.toFixed(2)}</td>
                        <td className="py-2.5 text-right">R$ {t.ticket.toFixed(2)}</td>
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
