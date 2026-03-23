import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Props {
  tenantId: string | null;
  onBack: () => void;
}

type DetailTab = "resumo" | "dados" | "branding" | "settings";

export default function SuperAdminTenantDetail({ tenantId, onBack }: Props) {
  const [tab, setTab] = useState<DetailTab>("resumo");

  const { data: tenant } = useQuery({
    queryKey: ["superadmin-tenant", tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data, error } = await supabase.from("tenants").select("*").eq("id", tenantId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const { data: details } = useQuery({
    queryKey: ["superadmin-tenant-details", tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data } = await supabase.from("tenant_details").select("*").eq("tenant_id", tenantId).single();
      return data;
    },
    enabled: !!tenantId,
  });

  const { data: branding } = useQuery({
    queryKey: ["superadmin-tenant-branding", tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data } = await supabase.from("tenant_branding").select("*").eq("tenant_id", tenantId).single();
      return data;
    },
    enabled: !!tenantId,
  });

  const { data: settings } = useQuery({
    queryKey: ["superadmin-tenant-settings", tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data } = await supabase.from("tenant_settings").select("*").eq("tenant_id", tenantId).single();
      return data;
    },
    enabled: !!tenantId,
  });

  const { data: subscription } = useQuery({
    queryKey: ["superadmin-tenant-sub", tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data } = await supabase
        .from("tenant_subscriptions")
        .select("*, subscription_plans(*)")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!tenantId,
  });

  if (!tenant) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Button variant="outline" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <p>Nenhum tenant selecionado.</p>
      </div>
    );
  }

  const plan = (subscription?.subscription_plans as any)?.name || "—";
  const initials = tenant.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const tabItems: { id: DetailTab; label: string }[] = [
    { id: "resumo", label: "Resumo" },
    { id: "dados", label: "Dados" },
    { id: "branding", label: "Branding" },
    { id: "settings", label: "Settings" },
  ];

  const featureFlags = settings
    ? [
        { name: "Booking online", on: settings.booking_enabled },
        { name: "Galeria", on: settings.gallery_enabled },
        { name: "Depoimentos", on: settings.testimonials_enabled },
        { name: "Vídeos", on: settings.video_enabled },
        { name: "WhatsApp", on: settings.whatsapp_notifications_enabled },
        { name: "Multi-unit", on: settings.multi_unit_enabled },
        { name: "Walk-in", on: settings.allow_walk_in },
        { name: "PWA", on: settings.pwa_enabled },
        { name: "Financeiro", on: settings.financial_enabled },
        { name: "Comissão", on: settings.commission_enabled },
        { name: "Relatórios", on: settings.reports_enabled },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-primary">
          {initials}
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold">{tenant.name}</h2>
          <p className="text-sm text-muted-foreground">{tenant.slug} · Criado em {new Date(tenant.created_at).toLocaleDateString("pt-BR")}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm">Editar</Button>
          <Button variant="destructive" size="sm">Suspender</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5">
        {tabItems.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-all ${
              tab === t.id ? "text-primary bg-muted" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Status</p>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
            tenant.is_active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          }`}>
            {tenant.is_active ? "Ativo" : "Inativo"}
          </span>
        </Card>
        <Card className="bg-card border-border p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Plano</p>
          <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary">
            {plan} — R${subscription?.amount || 0}/mês
          </span>
        </Card>
        <Card className="bg-card border-border p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Plano Atual</p>
          <p className="font-display text-2xl font-bold">{tenant.plan}</p>
        </Card>
        <Card className="bg-card border-border p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Serviços Ativos</p>
          <p className="font-display text-2xl font-bold text-info">{tenant.active_services}</p>
        </Card>
      </div>

      {/* Content based on tab */}
      {tab === "resumo" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card border-border p-6">
            <h4 className="font-display text-lg font-semibold mb-4">
              Dados do <em className="text-primary">Tenant</em>
            </h4>
            <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
              <span className="text-muted-foreground">Nome</span><span>{tenant.name}</span>
              <span className="text-muted-foreground">Slug</span><span className="text-primary">{tenant.slug}</span>
              <span className="text-muted-foreground">Razão Social</span><span>{details?.legal_name || "—"}</span>
              <span className="text-muted-foreground">CNPJ</span><span>{details?.document || "—"}</span>
              <span className="text-muted-foreground">Email</span><span>{details?.email || "—"}</span>
              <span className="text-muted-foreground">Telefone</span><span>{details?.phone || "—"}</span>
              <span className="text-muted-foreground">WhatsApp</span><span>{details?.whatsapp_phone || "—"}</span>
              <span className="text-muted-foreground">Endereço</span><span>{details?.address || "—"}</span>
              <span className="text-muted-foreground">Cidade</span><span>{details?.city || "—"}{details?.state ? ` - ${details.state}` : ""}</span>
            </div>
          </Card>

          <Card className="bg-card border-border p-6">
            <h4 className="font-display text-lg font-semibold mb-4">
              Branding <em className="text-primary">Visual</em>
            </h4>
            <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
              <span className="text-muted-foreground">Logo</span>
              {branding?.logo_url ? (
                <img src={branding.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-primary font-display text-lg">
                  {initials}
                </div>
              )}
              <span className="text-muted-foreground">Cor primária</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md border-2 border-border" style={{ background: branding?.primary_color || "#C6A85C" }} />
                <span className="text-muted-foreground text-xs">{branding?.primary_color || "#C6A85C"}</span>
              </div>
              <span className="text-muted-foreground">Cor secundária</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md border-2 border-border" style={{ background: branding?.secondary_color || "#1a1a1a" }} />
                <span className="text-muted-foreground text-xs">{branding?.secondary_color || "#1a1a1a"}</span>
              </div>
              <span className="text-muted-foreground">Fonte heading</span><span>{branding?.font_heading || "Playfair Display"}</span>
              <span className="text-muted-foreground">Fonte body</span><span>{branding?.font_body || "DM Sans"}</span>
              <span className="text-muted-foreground">Hero title</span><span>{branding?.hero_title || "—"}</span>
            </div>
          </Card>
        </div>
      )}

      {tab === "settings" && (
        <Card className="bg-card border-border p-6">
          <h4 className="font-display text-lg font-semibold mb-4">
            Feature <em className="text-primary">Flags</em> (Settings)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {featureFlags.map((flag) => (
              <div key={flag.name} className="flex items-center justify-between bg-muted p-3 rounded-lg text-sm">
                <span>{flag.name}</span>
                <span className={flag.on ? "text-success" : "text-destructive"}>
                  ● {flag.on ? "ON" : "OFF"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "dados" && (
        <Card className="bg-card border-border p-6">
          <h4 className="font-display text-lg font-semibold mb-4">Informações Completas</h4>
          <div className="grid grid-cols-[160px_1fr] gap-3 text-sm">
            <span className="text-muted-foreground">ID</span><span className="font-mono text-xs">{tenant.id}</span>
            <span className="text-muted-foreground">Nome</span><span>{tenant.name}</span>
            <span className="text-muted-foreground">Slug</span><span>{tenant.slug}</span>
            <span className="text-muted-foreground">Plano</span><span>{tenant.plan}</span>
            <span className="text-muted-foreground">Ativo</span><span>{tenant.is_active ? "Sim" : "Não"}</span>
            <span className="text-muted-foreground">Criado em</span><span>{new Date(tenant.created_at).toLocaleString("pt-BR")}</span>
            <span className="text-muted-foreground">Atualizado em</span><span>{new Date(tenant.updated_at).toLocaleString("pt-BR")}</span>
          </div>
        </Card>
      )}

      {tab === "branding" && branding && (
        <Card className="bg-card border-border p-6">
          <h4 className="font-display text-lg font-semibold mb-4">Branding Completo</h4>
          <div className="grid grid-cols-[160px_1fr] gap-3 text-sm">
            <span className="text-muted-foreground">Hero Title</span><span>{branding.hero_title || "—"}</span>
            <span className="text-muted-foreground">Hero Subtitle</span><span>{branding.hero_subtitle || "—"}</span>
            <span className="text-muted-foreground">About Title</span><span>{branding.about_title || "—"}</span>
            <span className="text-muted-foreground">About Text</span><span>{branding.about_text || "—"}</span>
            <span className="text-muted-foreground">Footer Text</span><span>{branding.footer_text || "—"}</span>
            <span className="text-muted-foreground">Accent Color</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md border-2 border-border" style={{ background: branding.accent_color || "transparent" }} />
              <span>{branding.accent_color || "—"}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
