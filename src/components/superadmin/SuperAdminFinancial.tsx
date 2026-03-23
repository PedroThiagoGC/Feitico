import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function SuperAdminFinancial() {
  const { data: subscriptions = [] } = useQuery({
    queryKey: ["superadmin-financial-subs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_subscriptions")
        .select("*, subscription_plans(*), tenants(name, slug)")
        .order("amount", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const activeSubs = subscriptions.filter((s) => s.status === "active");
  const mrr = activeSubs.reduce((sum, s) => sum + (s.amount || 0), 0);
  const arr = mrr * 12;

  const planMrr: Record<string, { name: string; total: number; color: string }> = {};
  subscriptions.forEach((s) => {
    const planName = (s.subscription_plans as any)?.name || "Outro";
    if (!planMrr[planName]) {
      const colors: Record<string, string> = { Starter: "hsl(var(--info))", Pro: "hsl(var(--purple))", Premium: "hsl(var(--gold))" };
      planMrr[planName] = { name: planName, total: 0, color: colors[planName] || "hsl(var(--muted-foreground))" };
    }
    if (s.status === "active") planMrr[planName].total += s.amount || 0;
  });

  const maxPlanMrr = Math.max(...Object.values(planMrr).map((p) => p.total), 1);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-success/10 text-success",
      trial: "bg-warning/10 text-warning",
      suspended: "bg-destructive/10 text-destructive",
      canceled: "bg-muted text-muted-foreground",
    };
    const labels: Record<string, string> = {
      active: "Pago",
      trial: "Trial",
      suspended: "Suspenso",
      canceled: "Cancelado",
    };
    return (
      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || styles.canceled}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">MRR Atual</p>
            <p className="font-display text-3xl font-bold text-primary">R$ {mrr.toLocaleString("pt-BR")}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">ARR Projetado</p>
            <p className="font-display text-2xl font-bold text-gold-dark">R$ {arr.toLocaleString("pt-BR")}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Receita Mês</p>
            <p className="font-display text-3xl font-bold text-success">R$ {mrr.toLocaleString("pt-BR")}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Custo Infra/mês</p>
            <p className="font-display text-2xl font-bold">R$ 84</p>
            <p className="text-xs text-muted-foreground mt-1">Energia + Domínio</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Lucro Líquido</p>
            <p className="font-display text-3xl font-bold text-success">
              R$ {(mrr - 84).toLocaleString("pt-BR")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Margem: {mrr > 0 ? (((mrr - 84) / mrr) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Tenant */}
      <Card className="bg-card border-border p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl font-semibold">
            Receita por <em className="text-primary">Tenant</em>
          </h3>
          <Button variant="outline" size="sm" className="border-border">↓ Export CSV</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Tenant</th>
                <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Plano</th>
                <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Valor/mês</th>
                <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Status Pgto</th>
                <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Desde</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => {
                const planName = (sub.subscription_plans as any)?.name || "—";
                const tenantName = (sub as any).tenants?.name || sub.tenant_id.slice(0, 8);
                const planColors: Record<string, string> = {
                  Trial: "bg-warning/10 text-warning",
                  Starter: "bg-info/10 text-info",
                  Pro: "bg-purple/10 text-purple",
                  Premium: "bg-primary/10 text-primary",
                };
                return (
                  <tr key={sub.id} className="border-b border-border hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium">{tenantName}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${planColors[planName] || "bg-muted text-muted-foreground"}`}>
                        {planName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-primary font-medium">
                      R$ {(sub.amount || 0).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(sub.status)}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(sub.start_date).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                    </td>
                  </tr>
                );
              })}
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">Nenhuma assinatura encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border p-6">
          <h4 className="font-display text-lg font-semibold mb-4">
            MRR por <em className="text-primary">Plano</em>
          </h4>
          <div className="space-y-4">
            {Object.values(planMrr)
              .filter((p) => p.total > 0)
              .map((plan) => (
                <div key={plan.name} className="flex items-center gap-3 text-sm">
                  <span className="min-w-[80px]">{plan.name}</span>
                  <div className="flex-1">
                    <Progress value={(plan.total / maxPlanMrr) * 100} className="h-1.5" />
                  </div>
                  <span style={{ color: plan.color }} className="min-w-[80px] text-right font-medium">
                    R$ {plan.total.toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
          </div>
        </Card>

        <Card className="bg-card border-border p-6">
          <h4 className="font-display text-lg font-semibold mb-4">
            Métricas de <em className="text-primary">Retenção</em>
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-[11px] text-muted-foreground mb-1">Taxa de Conversão Trial→Pago</p>
              <p className="text-2xl font-bold text-success">67%</p>
            </div>
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-[11px] text-muted-foreground mb-1">Churn Mensal</p>
              <p className="text-2xl font-bold text-destructive">3.7%</p>
            </div>
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-[11px] text-muted-foreground mb-1">LTV Médio</p>
              <p className="text-2xl font-bold text-primary">R$ 2.430</p>
            </div>
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-[11px] text-muted-foreground mb-1">Tempo Médio de Vida</p>
              <p className="text-2xl font-bold">14 <span className="text-xs text-muted-foreground">meses</span></p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
