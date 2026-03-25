import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import ImageUpload from "@/components/admin/ImageUpload";
import { Loader2 } from "lucide-react";

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

// Masks
function maskCPF(v: string) {
  return v.replace(/\D/g, "").slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function maskCNPJ(v: string) {
  return v.replace(/\D/g, "").slice(0, 14).replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}
function maskCEP(v: string) {
  return v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}

function applyDocMask(value: string, type: string) {
  return type === "cpf" ? maskCPF(value) : maskCNPJ(value);
}

export default function SuperAdminTenantNew({ onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [docType, setDocType] = useState<"cpf" | "cnpj">("cnpj");
  const [cep, setCep] = useState("");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    legalName: "",
    document: "",
    address: "",
    city: "",
    state: "",
    timezone: "America/Sao_Paulo",
    whatsapp: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    planId: "",
    primaryColor: "#C6A85C",
    secondaryColor: "#1a1a1a",
    logoUrl: "",
    heroTitle: "Sua beleza merece excelência",
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["superadmin-plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscription_plans").select("*").eq("active", true).order("monthly_price");
      if (error) throw error;
      return data;
    },
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "name" && !form.slug) {
      setForm((prev) => ({
        ...prev,
        [field]: value,
        slug: value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      }));
    }
  };

  const handleDocChange = (value: string) => {
    const masked = applyDocMask(value, docType);
    setForm((prev) => ({ ...prev, document: masked }));
  };

  const handleCepChange = async (value: string) => {
    const masked = maskCEP(value);
    setCep(masked);
    const digits = value.replace(/\D/g, "");
    if (digits.length === 8) {
      setCepLoading(true);
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${digits}`);
        if (res.ok) {
          const data = await res.json();
          setForm((prev) => ({
            ...prev,
            address: data.street || prev.address,
            city: data.city || prev.city,
            state: data.state || prev.state,
          }));
          toast.success("Endereço encontrado!");
        } else {
          toast.error("CEP não encontrado.");
        }
      } catch {
        toast.error("Erro ao buscar CEP.");
      } finally {
        setCepLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug || !form.adminName || !form.adminEmail || !form.adminPassword) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setLoading(true);
    try {
      const { data: tenant, error: tenantErr } = await supabase
        .from("tenants")
        .insert({ name: form.name, slug: form.slug, plan: "trial" })
        .select()
        .single();
      if (tenantErr) throw tenantErr;

      await supabase.from("tenant_details").insert({
        tenant_id: tenant.id,
        legal_name: form.legalName || null,
        document: form.document || null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        zip_code: cep.replace(/\D/g, "") || null,
        whatsapp_phone: form.whatsapp || null,
      });

      await supabase.from("tenant_branding").insert({
        tenant_id: tenant.id,
        primary_color: form.primaryColor,
        secondary_color: form.secondaryColor,
        logo_url: form.logoUrl || null,
        hero_title: form.heroTitle,
      });

      await supabase.from("tenant_settings").insert({
        tenant_id: tenant.id,
        timezone: form.timezone,
        booking_enabled: true,
        gallery_enabled: true,
        testimonials_enabled: true,
      });

      if (form.planId) {
        const selectedPlan = plans.find((p) => p.id === form.planId);
        await supabase.from("tenant_subscriptions").insert({
          tenant_id: tenant.id,
          plan_id: form.planId,
          amount: selectedPlan?.monthly_price || 0,
          status: selectedPlan?.monthly_price === 0 ? "trial" : "active",
          start_date: new Date().toISOString(),
          end_date: selectedPlan?.monthly_price === 0
            ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
            : null,
        });
      }

      await supabase.from("platform_users").insert({
        name: form.adminName,
        email: form.adminEmail,
        role: "tenant_admin",
        tenant_id: tenant.id,
      });

      toast.success("Tenant criado com sucesso!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar tenant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card border-border p-6">
      <h3 className="font-display text-xl font-semibold mb-2">
        Criar Novo <em className="text-primary">Tenant</em>
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Ao salvar, o sistema cria automaticamente: tenant + branding + settings + usuário admin + assinatura.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados do Salão */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Dados do Salão</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do Salão *</Label>
              <Input className="bg-muted border-border" placeholder="Ex: Studio Bella" value={form.name} onChange={(e) => updateField("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Slug (URL) *</Label>
              <Input className="bg-muted border-border font-mono" placeholder="studio-bella" value={form.slug} onChange={(e) => updateField("slug", e.target.value)} />
              <span className="text-[11px] text-muted-foreground">→ {form.slug || "slug"}.gm-tech-solution.com</span>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Razão Social</Label>
              <Input className="bg-muted border-border" placeholder="Nome legal da empresa" value={form.legalName} onChange={(e) => updateField("legalName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de Documento</Label>
              <div className="flex gap-2">
                <Select value={docType} onValueChange={(v: "cpf" | "cnpj") => { setDocType(v); setForm((prev) => ({ ...prev, document: "" })); }}>
                  <SelectTrigger className="bg-muted border-border w-[100px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpf">CPF</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  className="bg-muted border-border flex-1"
                  placeholder={docType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
                  value={form.document}
                  onChange={(e) => handleDocChange(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Endereço</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">CEP</Label>
              <div className="flex gap-2 items-center">
                <Input className="bg-muted border-border" placeholder="00000-000" value={cep} onChange={(e) => handleCepChange(e.target.value)} />
                {cepLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Endereço</Label>
              <Input className="bg-muted border-border" placeholder="Rua, número" value={form.address} onChange={(e) => updateField("address", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cidade</Label>
              <Input className="bg-muted border-border" placeholder="São Paulo" value={form.city} onChange={(e) => updateField("city", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Estado</Label>
              <Input className="bg-muted border-border" placeholder="SP" value={form.state} onChange={(e) => updateField("state", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Timezone</Label>
              <Select value={form.timezone} onValueChange={(v) => updateField("timezone", v)}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">America/Sao_Paulo</SelectItem>
                  <SelectItem value="America/Manaus">America/Manaus</SelectItem>
                  <SelectItem value="America/Fortaleza">America/Fortaleza</SelectItem>
                  <SelectItem value="America/Belem">America/Belem</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">WhatsApp</Label>
              <Input className="bg-muted border-border" placeholder="11999998888" value={form.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Admin */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Usuário Admin do Salão</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do Admin *</Label>
              <Input className="bg-muted border-border" placeholder="Nome completo" value={form.adminName} onChange={(e) => updateField("adminName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">E-mail do Admin *</Label>
              <Input className="bg-muted border-border" placeholder="admin@salao.com.br" value={form.adminEmail} onChange={(e) => updateField("adminEmail", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Senha temporária *</Label>
              <Input className="bg-muted border-border" type="password" placeholder="Min. 8 caracteres" value={form.adminPassword} onChange={(e) => updateField("adminPassword", e.target.value)} />
              <span className="text-[11px] text-muted-foreground">O admin poderá trocar no primeiro login</span>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Plano Inicial</Label>
              <Select value={form.planId} onValueChange={(v) => updateField("planId", v)}>
                <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Selecionar plano" /></SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>{plan.name} — R${plan.monthly_price}/mês</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Branding Inicial</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Cor primária</Label>
              <div className="flex items-center gap-2">
                <Input className="bg-muted border-border max-w-[120px] font-mono" value={form.primaryColor} onChange={(e) => updateField("primaryColor", e.target.value)} />
                <div className="w-6 h-6 rounded-md border-2 border-border" style={{ background: form.primaryColor }} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cor secundária</Label>
              <div className="flex items-center gap-2">
                <Input className="bg-muted border-border max-w-[120px] font-mono" value={form.secondaryColor} onChange={(e) => updateField("secondaryColor", e.target.value)} />
                <div className="w-6 h-6 rounded-md border-2 border-border" style={{ background: form.secondaryColor }} />
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Logo do Salão</Label>
              <ImageUpload value={form.logoUrl} onChange={(url) => updateField("logoUrl", url)} folder="logos" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hero Title</Label>
              <Input className="bg-muted border-border" value={form.heroTitle} onChange={(e) => updateField("heroTitle", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-border">
          <span className="text-xs text-muted-foreground">* Campos obrigatórios</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" className="bg-primary text-primary-foreground" disabled={loading}>
              {loading ? "Criando..." : "Criar Tenant"}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
