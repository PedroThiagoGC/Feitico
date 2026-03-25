import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Json } from "@/integrations/supabase/types";

interface PlanForm {
  name: string;
  description: string;
  monthlyPrice: number;
  maxProfessionals: number;
  maxServices: number;
  features: string;
}

const emptyForm: PlanForm = {
  name: "",
  description: "",
  monthlyPrice: 0,
  maxProfessionals: 5,
  maxServices: 20,
  features: "",
};

export default function SuperAdminPlans() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);

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

  const mutation = useMutation({
    mutationFn: async (data: PlanForm & { id?: string }) => {
      const featuresArray = data.features.split("\n").map((f) => f.trim()).filter(Boolean);
      const row = {
        name: data.name,
        description: data.description || null,
        monthly_price: data.monthlyPrice,
        max_professionals: data.maxProfessionals,
        max_services: data.maxServices,
        features: featuresArray as unknown as Json,
      };
      if (data.id) {
        const { error } = await supabase.from("subscription_plans").update(row).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subscription_plans").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-plans-list"] });
      toast.success(editingId ? "Plano atualizado!" : "Plano criado!");
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subscription_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-plans-list"] });
      toast.success("Plano excluído!");
    },
    onError: (err: any) => toast.error("Erro ao excluir: " + err.message),
  });

  const parseFeatures = (features: Json | null): string[] => {
    if (!features) return [];
    if (Array.isArray(features)) return features.map(String);
    return [];
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (plan: any) => {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      description: plan.description || "",
      monthlyPrice: plan.monthly_price,
      maxProfessionals: plan.max_professionals,
      maxServices: plan.max_services,
      features: parseFeatures(plan.features).join("\n"),
    });
    setDialogOpen(true);
  };

  return (
    <Card className="bg-card border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl font-semibold">
          Planos de <em className="text-primary">Assinatura</em>
        </h3>
        <Button className="bg-primary text-primary-foreground" onClick={openNew}>+ Novo Plano</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan, i) => {
          const features = parseFeatures(plan.features);
          const isFeatured = i === 2;
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
                <li className="flex items-center justify-between text-xs text-muted-foreground pb-2">
                  <span>Profissionais</span>
                  <span className="text-xs">máx {plan.max_professionals >= 999 ? "ilimitado" : plan.max_professionals}</span>
                </li>
                <li className="flex items-center justify-between text-xs text-muted-foreground pb-2">
                  <span>Serviços</span>
                  <span className="text-xs">máx {plan.max_services >= 999 ? "ilimitado" : plan.max_services}</span>
                </li>
              </ul>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 border-border" onClick={() => openEdit(plan)}>
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    if (confirm("Tem certeza que deseja excluir este plano?")) deleteMutation.mutate(plan.id);
                  }}
                >
                  Excluir
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 text-center">
                {subCounts[plan.id] || 0} tenants neste plano
              </p>
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? "Editar Plano" : "Novo Plano"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate({ ...form, id: editingId || undefined });
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label className="text-xs">Nome</Label>
              <Input className="bg-muted border-border" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Descrição</Label>
              <Input className="bg-muted border-border" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Preço mensal (R$)</Label>
                <Input className="bg-muted border-border" type="number" value={form.monthlyPrice} onChange={(e) => setForm((p) => ({ ...p, monthlyPrice: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Máx profissionais</Label>
                <Input className="bg-muted border-border" type="number" value={form.maxProfessionals} onChange={(e) => setForm((p) => ({ ...p, maxProfessionals: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Máx serviços</Label>
              <Input className="bg-muted border-border" type="number" value={form.maxServices} onChange={(e) => setForm((p) => ({ ...p, maxServices: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Features (uma por linha)</Label>
              <Textarea className="bg-muted border-border min-h-[100px]" value={form.features} onChange={(e) => setForm((p) => ({ ...p, features: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-primary text-primary-foreground" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
