import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreditCard, Plus, Pencil, Power } from "lucide-react";
import { appToast } from "@/lib/toast";
import { supabase } from "@/integrations/supabase/client";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  monthly_price: number;
  annual_price: number;
  max_professionals: number;
  max_units: number;
  max_bookings_per_month: number;
  features_json: string[];
  active: boolean;
}

export default function SuperAdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    monthly_price: "",
    annual_price: "",
    max_professionals: "5",
    max_units: "1",
    max_bookings_per_month: "500",
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("subscription_plans" as any).select("*").order("monthly_price");
    setPlans((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const openCreate = () => {
    setEditingPlan(null);
    setForm({ name: "", description: "", monthly_price: "", annual_price: "", max_professionals: "5", max_units: "1", max_bookings_per_month: "500" });
    setDialogOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      description: plan.description || "",
      monthly_price: String(plan.monthly_price),
      annual_price: String(plan.annual_price),
      max_professionals: String(plan.max_professionals),
      max_units: String(plan.max_units),
      max_bookings_per_month: String(plan.max_bookings_per_month),
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        monthly_price: Number(form.monthly_price),
        annual_price: Number(form.annual_price),
        max_professionals: Number(form.max_professionals),
        max_units: Number(form.max_units),
        max_bookings_per_month: Number(form.max_bookings_per_month),
        updated_at: new Date().toISOString(),
      };

      if (editingPlan) {
        await supabase.from("subscription_plans" as any).update(payload).eq("id", editingPlan.id);
      } else {
        await supabase.from("subscription_plans" as any).insert(payload);
      }
      appToast.success(editingPlan ? "Plano atualizado!" : "Plano criado!");
      setDialogOpen(false);
      await load();
    } catch {
      appToast.error("Erro ao salvar plano");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (plan: Plan) => {
    await supabase.from("subscription_plans" as any).update({ active: !plan.active }).eq("id", plan.id);
    appToast.success(plan.active ? "Plano desativado" : "Plano ativado");
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground">Planos de Assinatura</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-primary text-primary-foreground gap-2">
              <Plus className="w-4 h-4" /> Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">{editingPlan ? "Editar Plano" : "Novo Plano"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div><Label className="font-body text-sm">Nome</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-secondary border-border font-body mt-1" required /></div>
              <div><Label className="font-body text-sm">Descrição</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-secondary border-border font-body mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="font-body text-sm">Preço Mensal (R$)</Label><Input type="number" step="0.01" value={form.monthly_price} onChange={e => setForm({...form, monthly_price: e.target.value})} className="bg-secondary border-border font-body mt-1" required /></div>
                <div><Label className="font-body text-sm">Preço Anual (R$)</Label><Input type="number" step="0.01" value={form.annual_price} onChange={e => setForm({...form, annual_price: e.target.value})} className="bg-secondary border-border font-body mt-1" required /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="font-body text-xs">Max Profissionais</Label><Input type="number" value={form.max_professionals} onChange={e => setForm({...form, max_professionals: e.target.value})} className="bg-secondary border-border font-body mt-1 text-sm" /></div>
                <div><Label className="font-body text-xs">Max Unidades</Label><Input type="number" value={form.max_units} onChange={e => setForm({...form, max_units: e.target.value})} className="bg-secondary border-border font-body mt-1 text-sm" /></div>
                <div><Label className="font-body text-xs">Max Agendamentos/mês</Label><Input type="number" value={form.max_bookings_per_month} onChange={e => setForm({...form, max_bookings_per_month: e.target.value})} className="bg-secondary border-border font-body mt-1 text-sm" /></div>
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground font-body" disabled={saving}>
                {saving ? "Salvando..." : editingPlan ? "Atualizar" : "Criar Plano"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Card key={i} className="bg-card border-border"><CardContent className="p-6"><Skeleton className="h-6 w-32 mb-4" /><Skeleton className="h-8 w-24 mb-2" /><Skeleton className="h-4 w-full" /></CardContent></Card>)}
        </div>
      ) : plans.length === 0 ? (
        <Card className="bg-card border-border"><CardContent className="py-16 text-center"><CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" /><p className="font-body text-sm text-muted-foreground">Nenhum plano cadastrado</p></CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map(plan => (
            <Card key={plan.id} className={`bg-card border-border ${!plan.active ? 'opacity-50' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-lg">{plan.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(plan)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(plan)}><Power className={`w-3.5 h-3.5 ${plan.active ? 'text-emerald-400' : 'text-destructive'}`} /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-display text-2xl font-bold text-primary">R$ {Number(plan.monthly_price).toFixed(2)}</span>
                  <span className="font-body text-xs text-muted-foreground">/mês</span>
                </div>
                {plan.description && <p className="font-body text-xs text-muted-foreground">{plan.description}</p>}
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <p className="font-body text-xs text-foreground">Até {plan.max_professionals === -1 ? '∞' : plan.max_professionals} profissionais</p>
                  <p className="font-body text-xs text-foreground">Até {plan.max_units === -1 ? '∞' : plan.max_units} unidade{plan.max_units !== 1 ? 's' : ''}</p>
                  <p className="font-body text-xs text-foreground">Até {plan.max_bookings_per_month === -1 ? '∞' : plan.max_bookings_per_month} agendamentos/mês</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
