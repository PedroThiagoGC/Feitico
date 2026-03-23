import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  onViewTenant: (id: string) => void;
}

export default function SuperAdminDashboard({ onViewTenant }: Props) {
  const { data: tenants = [] } = useQuery({
    queryKey: ["superadmin-tenants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tenants").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["superadmin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tenant_subscriptions").select("*, subscription_plans(*)");
      if (error) throw error;
      return data;
    },
  });

  const { data: bookingsCount = 0 } = useQuery({
    queryKey: ["superadmin-bookings-count"],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { count, error } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString());
      if (error) throw error;
      return count || 0;
    },
  });

  const activeTenants = tenants.filter((t) => t.is_active).length;
  const trialSubs = subscriptions.filter((s) => s.status === "trial");
  const activeSubs = subscriptions.filter((s) => s.status === "active");
  const mrr = activeSubs.reduce((sum, s) => sum + (s.amount || 0), 0);

  const planDistribution = [
    { name: "Trial", count: trialSubs.length, color: "hsl(var(--warning))" },
    { name: "Starter", count: subscriptions.filter((s) => (s.subscription_plans as any)?.name === "Starter").length, color: "hsl(var(--info))" },
    { name: "Pro", count: subscriptions.filter((s) => (s.subscription_plans as any)?.name === "Pro").length, color: "hsl(var(--purple))" },
    { name: "Premium", count: subscriptions.filter((s) => (s.subscription_plans as any)?.name === "Premium").length, color: "hsl(var(--gold))" },
  ];

  const totalPlanCount = Math.max(planDistribution.reduce((s, p) => s + p.count, 0), 1);

  // Mock MRR chart data
  const mrrChart = [
    { month: "Out", value: 1200 },
    { month: "Nov", value: 1900 },
    { month: "Dez", value: 2500 },
    { month: "Jan", value: 3200 },
    { month: "Fev", value: 4100 },
    { month: "Mar", value: mrr || 4850 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">MRR (Receita Recorrente)</p>
            <p className="font-display text-3xl font-bold text-primary">
              R$ {mrr.toLocaleString("pt-BR")}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Tenants</p>
            <p className="font-display text-3xl font-bold">{tenants.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeTenants} ativos · {trialSubs.length} trial
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Bookings este mês</p>
            <p className="font-display text-3xl font-bold text-info">{bookingsCount.toLocaleString("pt-BR")}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Trial expirando (7 dias)</p>
            <p className="font-display text-3xl font-bold text-destructive">{trialSubs.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Converter para pagante</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Churn este mês</p>
            <p className="font-display text-3xl font-bold text-muted-foreground">0</p>
            <p className="text-xs text-muted-foreground mt-1">Taxa: 0%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-xl font-semibold">
              Crescimento <em className="text-primary">MRR</em>
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mrrChart}>
              <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "MRR"]}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="bg-card border-border p-6">
          <h3 className="font-display text-xl font-semibold mb-5">
            Tenants por <em className="text-primary">Plano</em>
          </h3>
          <div className="space-y-3">
            {planDistribution.map((plan) => (
              <div key={plan.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{plan.name}</span>
                  <span style={{ color: plan.color }}>{plan.count}</span>
                </div>
                <Progress value={(plan.count / totalPlanCount) * 100} className="h-1.5" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Expiring Trials */}
      <Card className="bg-card border-border p-6">
        <h3 className="font-display text-xl font-semibold mb-5">
          Trials <em className="text-primary">Expirando</em>
        </h3>
        {trialSubs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum trial expirando no momento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Tenant</th>
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Início</th>
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Expira</th>
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {trialSubs.map((sub) => (
                  <tr key={sub.id} className="border-b border-border hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium">{sub.tenant_id}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(sub.start_date).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-3 px-4 text-destructive">
                      {sub.end_date ? new Date(sub.end_date).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <Button size="sm" className="bg-primary text-primary-foreground text-xs">
                        Converter
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
