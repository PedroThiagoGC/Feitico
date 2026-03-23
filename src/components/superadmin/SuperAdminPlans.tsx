import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

export default function SuperAdminPlans() {
  const { data: plans = [] } = useQuery({
    queryKey: ["superadmin-plans-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscription_plans").select("*").order("monthly_price");
      if (error) throw error;
      return data;
    },
  });

  const { data: subCounts = {} } = useQuery({
    queryKey: ["superadmin-plan-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tenant_subscriptions").select("plan_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((s) => { counts[s.plan_id] = (counts[s.plan_id] || 0) + 1; });
      return counts;
    },
  });

  const parseFeatures = (features: Json | null): string[] => {
    if (!features) return [];
    if (Array.isArray(features)) return features.map(String);
    return [];
  };

  return (
    <Card className="bg-card border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl font-semibold">
          Planos de <em className="text-primary">Assinatura</em>
        </h3>
        <Button className="bg-primary text-primary-foreground">+ Novo Plano</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan, i) => {
          const features = parseFeatures(plan.features_json);
          const isFeatured = i === 2; // Pro is usually index 2
          return (
            <div
              key={plan.id}
              className={`relative bg-muted border rounded-xl p-6 transition-colors hover:border-primary/40 ${
                isFeatured ? "border-primary" : "border-border"
              }`}
            >
              {isFeatured && (
                <span className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-[9px] font-bold px-2.5 py-0.5 rounded-full tracking-wider">
                  POPULAR
                </span>
              )}
              <h4 className="font-display text-lg font-semibold">{plan.name}</h4>
              <p className="text-xs text-muted-foreground mb-3">{plan.description || "—"}</p>
              <p className="text-3xl font-bold text-primary mb-4">
                R$ {plan.monthly_price} <span className="text-sm font-normal text-muted-foreground">/mês</span>
              </p>

              <ul className="space-y-2 mb-4">
                {features.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground border-b border-border pb-2">
                    <Check className="w-3.5 h-3.5 text-success flex-shrink-0" />
                    {f}
                  </li>
                ))}
                {plan.max_units && (
                  <li className="flex items-center justify-between text-xs text-muted-foreground pb-2">
                    <span>Unidades</span>
                    <span className="text-xs">máx {plan.max_units === 999 ? "ilimitado" : plan.max_units}</span>
                  </li>
                )}
                {plan.max_professionals && (
                  <li className="flex items-center justify-between text-xs text-muted-foreground pb-2">
                    <span>Profissionais</span>
                    <span className="text-xs">máx {plan.max_professionals === 999 ? "ilimitado" : plan.max_professionals}</span>
                  </li>
                )}
                {plan.max_bookings_per_month && (
                  <li className="flex items-center justify-between text-xs text-muted-foreground pb-2">
                    <span>Bookings/mês</span>
                    <span className="text-xs">máx {plan.max_bookings_per_month === 999999 ? "ilimitado" : plan.max_bookings_per_month.toLocaleString("pt-BR")}</span>
                  </li>
                )}
              </ul>

              <Button variant="outline" size="sm" className="w-full border-border">
                Editar
              </Button>
              <p className="text-[11px] text-muted-foreground mt-2 text-center">
                {subCounts[plan.id] || 0} tenants neste plano
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
