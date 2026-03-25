import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { Json } from "@/integrations/supabase/types";

interface PlanForm {
  name: string;
  description: string;
  monthly_price: number;
  annual_price: number;
  max_units: number;
  max_professionals: number;
  max_bookings_per_month: number;
  features_json: string;
}

const emptyForm: PlanForm = {
  name: "", description: "", monthly_price: 0, annual_price: 0,
  max_units: 1, max_professionals: 5, max_bookings_per_month: 500, features_json: "",
};

export default function SuperAdminPlans() {
  const qc = useQueryClient();
  const [editId, setEditId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const saveMutation = useMutation({
    mutationFn: async (payload: { id?: string; form: PlanForm }) => {
      const features = payload.form.features_json ? payload.form.features_json.split("\n").map(s => s.trim()).filter(Boolean) : [];
      const row = {
        name: payload.form.name, description: payload.form.description || null,
        monthly_price: payload.form.monthly_price, annual_price: payload.form.annual_price,
        max_units: payload.form.max_units, max_professionals: payload.form.max_professionals,
        max_bookings_per_month: payload.form.max_bookings_per_month,
        features_json: features as unknown as Json,
      };
      if (payload.id) {
        const { error } = await supabase.from("subscription_plans").update(row).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subscription_plans").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["superadmin-plans-list"] }); toast.success(editId ? "Plano atualizado!" : "Plano criado!"); closeForm(); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subscription_plans").update({ active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["superadmin-plans-list"] }); toast.success("Plano desativado!"); setDeleteId(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (plan: any) => {
    setForm({
      name: plan.name, description: plan.description || "",
      monthly_price: plan.monthly_price, annual_price: plan.annual_price,
      max_units: plan.max_units || 1, max_professionals: plan.max_professionals || 5,
      max_bookings_per_month: plan.max_bookings_per_month || 500,
      features_json: parseFeatures(plan.features_json).join("\n"),
    });
    setEditId(plan.id);
  };

  const closeForm = () => { setEditId(null); setShowNew(false); setForm(emptyForm); };

  const parseFeatures = (features: Json | null): string[] => {
    if (!features) return [];
    if (Array.isArray(features)) return features.map(String);
    return [];
  };

  const isFormOpen = !!editId || showNew;

  return (
    <Card className="bg-card border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl font-semibold">Planos de <em className="text-primary">Assinatura</em></h3>
        <Button className="bg-primary text-primary-foreground" onClick={() => { setForm(emptyForm); setShowNew(true); }}>+ Novo Plano</Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) closeForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Editar Plano" : "Novo Plano"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome do plano" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Preço mensal (R$)</label><Input type="number" value={form.monthly_price} onChange={(e) => setForm({ ...form, monthly_price: +e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">Preço anual (R$)</label><Input type="number" value={form.annual_price} onChange={(e) => setForm({ ...form, annual_price: +e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-muted-foreground">Máx unidades</label><Input type="number" value={form.max_units} onChange={(e) => setForm({ ...form, max_units: +e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">Máx profissionais</label><Input type="number" value={form.max_professionals} onChange={(e) => setForm({ ...form, max_professionals: +e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">Bookings/mês</label><Input type="number" value={form.max_bookings_per_month} onChange={(e) => setForm({ ...form, max_bookings_per_month: +e.target.value })} /></div>
            </div>
            <div><label className="text-xs text-muted-foreground">Features (uma por linha)</label><Textarea rows={4} value={form.features_json} onChange={(e) => setForm({ ...form, features_json: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate({ id: editId || undefined, form })} disabled={!form.name || saveMutation.isPending}>{saveMutation.isPending ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Desativar plano?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">O plano será desativado. Tenants existentes não serão afetados.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Desativando..." : "Desativar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan, i) => {
          const features = parseFeatures(plan.features as any);
          const isFeatured = i === 2;
          return (
            <div key={plan.id} className={`relative bg-muted border rounded-xl p-6 transition-colors hover:border-primary/40 ${isFeatured ? "border-primary" : "border-border"}`}>
              {isFeatured && <span className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-[9px] font-bold px-2.5 py-0.5 rounded-full tracking-wider">POPULAR</span>}
              <h4 className="font-display text-lg font-semibold">{plan.name}</h4>
              <p className="text-xs text-muted-foreground mb-3">{plan.description || "—"}</p>
              <p className="text-3xl font-bold text-primary mb-4">R$ {plan.monthly_price} <span className="text-sm font-normal text-muted-foreground">/mês</span></p>
              <ul className="space-y-2 mb-4">
                {features.map((f, idx) => (<li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground border-b border-border pb-2"><Check className="w-3.5 h-3.5 text-success flex-shrink-0" />{f}</li>))}
                {plan.max_professionals && <li className="flex items-center justify-between text-xs text-muted-foreground pb-2"><span>Profissionais</span><span>máx {plan.max_professionals === 999 ? "ilimitado" : plan.max_professionals}</span></li>}
                {plan.max_services && <li className="flex items-center justify-between text-xs text-muted-foreground pb-2"><span>Serviços</span><span>máx {plan.max_services === 999 ? "ilimitado" : plan.max_services}</span></li>}
              </ul>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 border-border" onClick={() => openEdit(plan)}><Pencil className="w-3 h-3 mr-1" /> Editar</Button>
                <Button variant="outline" size="sm" className="border-border text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(plan.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 text-center">{subCounts[plan.id] || 0} tenants neste plano</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
