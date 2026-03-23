import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Pencil, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";

interface Props {
  tenantId: string | null;
  onBack: () => void;
}

type DetailTab = "resumo" | "dados" | "branding" | "settings";

export default function SuperAdminTenantDetail({ tenantId, onBack }: Props) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<DetailTab>("resumo");
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [suspendOpen, setSuspendOpen] = useState(false);

  // Tenant form
  const [tenantForm, setTenantForm] = useState({ name: "", slug: "", plan: "", active_services: "" });
  // Details form
  const [detailsForm, setDetailsForm] = useState({ legal_name: "", document: "", email: "", phone: "", whatsapp_phone: "", address: "", city: "", state: "", zip_code: "" });
  // Branding form
  const [brandingForm, setBrandingForm] = useState({ primary_color: "", secondary_color: "", accent_color: "", background_color: "", text_color: "", font_heading: "", font_body: "", hero_title: "", hero_subtitle: "", about_title: "", about_text: "", footer_text: "", logo_url: "", favicon_url: "" });

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
      const { data } = await supabase.from("tenant_subscriptions").select("*, subscription_plans(*)").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(1).single();
      return data;
    },
    enabled: !!tenantId,
  });

  const updateTenantMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tenants").update({ name: tenantForm.name, slug: tenantForm.slug, plan: tenantForm.plan, active_services: tenantForm.active_services }).eq("id", tenantId!);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["superadmin-tenant", tenantId] }); toast.success("Tenant atualizado!"); setEditingSection(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateDetailsMut = useMutation({
    mutationFn: async () => {
      if (details?.id) {
        const { error } = await supabase.from("tenant_details").update(detailsForm).eq("id", details.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tenant_details").insert({ ...detailsForm, tenant_id: tenantId! });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["superadmin-tenant-details", tenantId] }); toast.success("Dados atualizados!"); setEditingSection(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateBrandingMut = useMutation({
    mutationFn: async () => {
      if (branding?.id) {
        const { error } = await supabase.from("tenant_branding").update(brandingForm).eq("id", branding.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tenant_branding").insert({ ...brandingForm, tenant_id: tenantId! });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["superadmin-tenant-branding", tenantId] }); toast.success("Branding atualizado!"); setEditingSection(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleSettingMut = useMutation({
    mutationFn: async (payload: { key: string; value: boolean }) => {
      if (!settings?.id) return;
      const { error } = await supabase.from("tenant_settings").update({ [payload.key]: payload.value }).eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["superadmin-tenant-settings", tenantId] }); toast.success("Setting atualizado!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const suspendMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tenants").update({ is_active: !tenant?.is_active }).eq("id", tenantId!);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["superadmin-tenant", tenantId] }); toast.success(tenant?.is_active ? "Tenant suspenso!" : "Tenant reativado!"); setSuspendOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  if (!tenant) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Button variant="outline" onClick={onBack} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
        <p>Nenhum tenant selecionado.</p>
      </div>
    );
  }

  const plan = (subscription?.subscription_plans as any)?.name || "—";
  const initials = tenant.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const tabItems: { id: DetailTab; label: string }[] = [
    { id: "resumo", label: "Resumo" }, { id: "dados", label: "Dados" }, { id: "branding", label: "Branding" }, { id: "settings", label: "Settings" },
  ];

  const startEditTenant = () => {
    setTenantForm({ name: tenant.name, slug: tenant.slug, plan: tenant.plan, active_services: tenant.active_services });
    setEditingSection("tenant");
  };

  const startEditDetails = () => {
    setDetailsForm({
      legal_name: details?.legal_name || "", document: details?.document || "", email: details?.email || "",
      phone: details?.phone || "", whatsapp_phone: details?.whatsapp_phone || "", address: details?.address || "",
      city: details?.city || "", state: details?.state || "", zip_code: details?.zip_code || "",
    });
    setEditingSection("details");
  };

  const startEditBranding = () => {
    setBrandingForm({
      primary_color: branding?.primary_color || "#C6A85C", secondary_color: branding?.secondary_color || "#1A1A1A",
      accent_color: branding?.accent_color || "#FFFFFF", background_color: branding?.background_color || "#0B0B0B",
      text_color: branding?.text_color || "#E5E0D5", font_heading: branding?.font_heading || "Playfair Display",
      font_body: branding?.font_body || "Montserrat", hero_title: branding?.hero_title || "", hero_subtitle: branding?.hero_subtitle || "",
      about_title: branding?.about_title || "", about_text: branding?.about_text || "", footer_text: branding?.footer_text || "",
      logo_url: branding?.logo_url || "", favicon_url: branding?.favicon_url || "",
    });
    setEditingSection("branding");
  };

  const featureFlags = settings ? [
    { key: "booking_enabled", name: "Booking online", on: settings.booking_enabled },
    { key: "gallery_enabled", name: "Galeria", on: settings.gallery_enabled },
    { key: "testimonials_enabled", name: "Depoimentos", on: settings.testimonials_enabled },
    { key: "video_enabled", name: "Vídeos", on: settings.video_enabled },
    { key: "whatsapp_notifications_enabled", name: "WhatsApp", on: settings.whatsapp_notifications_enabled },
    { key: "multi_unit_enabled", name: "Multi-unit", on: settings.multi_unit_enabled },
    { key: "allow_walk_in", name: "Walk-in", on: settings.allow_walk_in },
    { key: "pwa_enabled", name: "PWA", on: settings.pwa_enabled },
    { key: "financial_enabled", name: "Financeiro", on: settings.financial_enabled },
    { key: "commission_enabled", name: "Comissão", on: settings.commission_enabled },
    { key: "reports_enabled", name: "Relatórios", on: settings.reports_enabled },
  ] : [];

  const EditBtn = ({ onClick }: { onClick: () => void }) => (
    <Button variant="outline" size="sm" onClick={onClick} className="text-xs"><Pencil className="w-3 h-3 mr-1" /> Editar</Button>
  );

  const SaveCancelBtns = ({ onSave, isPending }: { onSave: () => void; isPending: boolean }) => (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => setEditingSection(null)}><X className="w-3 h-3 mr-1" /> Cancelar</Button>
      <Button size="sm" onClick={onSave} disabled={isPending}><Save className="w-3 h-3 mr-1" /> {isPending ? "Salvando..." : "Salvar"}</Button>
    </div>
  );

  const FieldInput = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div><label className="text-xs text-muted-foreground">{label}</label><Input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1" /></div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-primary">{initials}</div>
        <div>
          <h2 className="font-display text-2xl font-semibold">{tenant.name}</h2>
          <p className="text-sm text-muted-foreground">{tenant.slug} · Criado em {new Date(tenant.created_at).toLocaleDateString("pt-BR")}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={startEditTenant}>Editar</Button>
          <Button variant={tenant.is_active ? "destructive" : "default"} size="sm" onClick={() => setSuspendOpen(true)}>
            {tenant.is_active ? "Suspender" : "Reativar"}
          </Button>
        </div>
      </div>

      {/* Suspend Confirmation */}
      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{tenant.is_active ? "Suspender tenant?" : "Reativar tenant?"}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{tenant.is_active ? "O tenant será suspenso e não poderá acessar a plataforma." : "O tenant será reativado e voltará a ter acesso."}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendOpen(false)}>Cancelar</Button>
            <Button variant={tenant.is_active ? "destructive" : "default"} onClick={() => suspendMut.mutate()} disabled={suspendMut.isPending}>
              {suspendMut.isPending ? "Processando..." : tenant.is_active ? "Suspender" : "Reativar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <div className="flex gap-0.5">
        {tabItems.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 text-xs font-medium rounded-md transition-all ${tab === t.id ? "text-primary bg-muted" : "text-muted-foreground hover:text-foreground"}`}>{t.label}</button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Status</p>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${tenant.is_active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{tenant.is_active ? "Ativo" : "Inativo"}</span>
        </Card>
        <Card className="bg-card border-border p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Plano</p>
          <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary">{plan} — R${subscription?.amount || 0}/mês</span>
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

      {/* Resumo */}
      {tab === "resumo" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-display text-lg font-semibold">Dados do <em className="text-primary">Tenant</em></h4>
              {editingSection !== "details" ? <EditBtn onClick={startEditDetails} /> : <SaveCancelBtns onSave={() => updateDetailsMut.mutate()} isPending={updateDetailsMut.isPending} />}
            </div>
            {editingSection === "details" ? (
              <div className="space-y-3">
                <FieldInput label="Razão Social" value={detailsForm.legal_name} onChange={(v) => setDetailsForm({ ...detailsForm, legal_name: v })} />
                <FieldInput label="CNPJ" value={detailsForm.document} onChange={(v) => setDetailsForm({ ...detailsForm, document: v })} />
                <FieldInput label="Email" value={detailsForm.email} onChange={(v) => setDetailsForm({ ...detailsForm, email: v })} />
                <FieldInput label="Telefone" value={detailsForm.phone} onChange={(v) => setDetailsForm({ ...detailsForm, phone: v })} />
                <FieldInput label="WhatsApp" value={detailsForm.whatsapp_phone} onChange={(v) => setDetailsForm({ ...detailsForm, whatsapp_phone: v })} />
                <FieldInput label="Endereço" value={detailsForm.address} onChange={(v) => setDetailsForm({ ...detailsForm, address: v })} />
                <div className="grid grid-cols-2 gap-3">
                  <FieldInput label="Cidade" value={detailsForm.city} onChange={(v) => setDetailsForm({ ...detailsForm, city: v })} />
                  <FieldInput label="Estado" value={detailsForm.state} onChange={(v) => setDetailsForm({ ...detailsForm, state: v })} />
                </div>
                <FieldInput label="CEP" value={detailsForm.zip_code} onChange={(v) => setDetailsForm({ ...detailsForm, zip_code: v })} />
              </div>
            ) : (
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
            )}
          </Card>

          <Card className="bg-card border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-display text-lg font-semibold">Branding <em className="text-primary">Visual</em></h4>
              {editingSection !== "branding-resumo" ? (
                <EditBtn onClick={() => { startEditBranding(); setEditingSection("branding-resumo"); }} />
              ) : (
                <SaveCancelBtns onSave={() => updateBrandingMut.mutate()} isPending={updateBrandingMut.isPending} />
              )}
            </div>
            {editingSection === "branding-resumo" ? (
              <div className="space-y-3">
                <FieldInput label="Cor Primária" value={brandingForm.primary_color} onChange={(v) => setBrandingForm({ ...brandingForm, primary_color: v })} />
                <FieldInput label="Cor Secundária" value={brandingForm.secondary_color} onChange={(v) => setBrandingForm({ ...brandingForm, secondary_color: v })} />
                <FieldInput label="Fonte Heading" value={brandingForm.font_heading} onChange={(v) => setBrandingForm({ ...brandingForm, font_heading: v })} />
                <FieldInput label="Fonte Body" value={brandingForm.font_body} onChange={(v) => setBrandingForm({ ...brandingForm, font_body: v })} />
                <FieldInput label="Hero Title" value={brandingForm.hero_title} onChange={(v) => setBrandingForm({ ...brandingForm, hero_title: v })} />
              </div>
            ) : (
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Logo</span>
                {branding?.logo_url ? <img src={branding.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-primary font-display text-lg">{initials}</div>}
                <span className="text-muted-foreground">Cor primária</span>
                <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-md border-2 border-border" style={{ background: branding?.primary_color || "#C6A85C" }} /><span className="text-muted-foreground text-xs">{branding?.primary_color || "#C6A85C"}</span></div>
                <span className="text-muted-foreground">Cor secundária</span>
                <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-md border-2 border-border" style={{ background: branding?.secondary_color || "#1a1a1a" }} /><span className="text-muted-foreground text-xs">{branding?.secondary_color || "#1a1a1a"}</span></div>
                <span className="text-muted-foreground">Fonte heading</span><span>{branding?.font_heading || "Playfair Display"}</span>
                <span className="text-muted-foreground">Fonte body</span><span>{branding?.font_body || "DM Sans"}</span>
                <span className="text-muted-foreground">Hero title</span><span>{branding?.hero_title || "—"}</span>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Settings tab with toggles */}
      {tab === "settings" && (
        <Card className="bg-card border-border p-6">
          <h4 className="font-display text-lg font-semibold mb-4">Feature <em className="text-primary">Flags</em> (Settings)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {featureFlags.map((flag) => (
              <div key={flag.key} className="flex items-center justify-between bg-muted p-3 rounded-lg text-sm">
                <span>{flag.name}</span>
                <Switch
                  checked={!!flag.on}
                  onCheckedChange={(checked) => toggleSettingMut.mutate({ key: flag.key, value: checked })}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Dados tab */}
      {tab === "dados" && (
        <Card className="bg-card border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-display text-lg font-semibold">Informações Completas</h4>
            {editingSection !== "tenant" ? <EditBtn onClick={startEditTenant} /> : <SaveCancelBtns onSave={() => updateTenantMut.mutate()} isPending={updateTenantMut.isPending} />}
          </div>
          {editingSection === "tenant" ? (
            <div className="space-y-3 max-w-md">
              <FieldInput label="Nome" value={tenantForm.name} onChange={(v) => setTenantForm({ ...tenantForm, name: v })} />
              <FieldInput label="Slug" value={tenantForm.slug} onChange={(v) => setTenantForm({ ...tenantForm, slug: v })} />
              <FieldInput label="Plano" value={tenantForm.plan} onChange={(v) => setTenantForm({ ...tenantForm, plan: v })} />
              <FieldInput label="Serviços Ativos" value={tenantForm.active_services} onChange={(v) => setTenantForm({ ...tenantForm, active_services: v })} />
            </div>
          ) : (
            <div className="grid grid-cols-[160px_1fr] gap-3 text-sm">
              <span className="text-muted-foreground">ID</span><span className="font-mono text-xs">{tenant.id}</span>
              <span className="text-muted-foreground">Nome</span><span>{tenant.name}</span>
              <span className="text-muted-foreground">Slug</span><span>{tenant.slug}</span>
              <span className="text-muted-foreground">Plano</span><span>{tenant.plan}</span>
              <span className="text-muted-foreground">Ativo</span><span>{tenant.is_active ? "Sim" : "Não"}</span>
              <span className="text-muted-foreground">Criado em</span><span>{new Date(tenant.created_at).toLocaleString("pt-BR")}</span>
              <span className="text-muted-foreground">Atualizado em</span><span>{new Date(tenant.updated_at).toLocaleString("pt-BR")}</span>
            </div>
          )}
        </Card>
      )}

      {/* Branding tab */}
      {tab === "branding" && branding && (
        <Card className="bg-card border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-display text-lg font-semibold">Branding Completo</h4>
            {editingSection !== "branding" ? <EditBtn onClick={startEditBranding} /> : <SaveCancelBtns onSave={() => updateBrandingMut.mutate()} isPending={updateBrandingMut.isPending} />}
          </div>
          {editingSection === "branding" ? (
            <div className="space-y-3 max-w-lg">
              <div className="grid grid-cols-2 gap-3">
                <FieldInput label="Cor Primária" value={brandingForm.primary_color} onChange={(v) => setBrandingForm({ ...brandingForm, primary_color: v })} />
                <FieldInput label="Cor Secundária" value={brandingForm.secondary_color} onChange={(v) => setBrandingForm({ ...brandingForm, secondary_color: v })} />
                <FieldInput label="Cor Accent" value={brandingForm.accent_color} onChange={(v) => setBrandingForm({ ...brandingForm, accent_color: v })} />
                <FieldInput label="Cor Background" value={brandingForm.background_color} onChange={(v) => setBrandingForm({ ...brandingForm, background_color: v })} />
                <FieldInput label="Cor Texto" value={brandingForm.text_color} onChange={(v) => setBrandingForm({ ...brandingForm, text_color: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FieldInput label="Fonte Heading" value={brandingForm.font_heading} onChange={(v) => setBrandingForm({ ...brandingForm, font_heading: v })} />
                <FieldInput label="Fonte Body" value={brandingForm.font_body} onChange={(v) => setBrandingForm({ ...brandingForm, font_body: v })} />
              </div>
              <FieldInput label="Hero Title" value={brandingForm.hero_title} onChange={(v) => setBrandingForm({ ...brandingForm, hero_title: v })} />
              <FieldInput label="Hero Subtitle" value={brandingForm.hero_subtitle} onChange={(v) => setBrandingForm({ ...brandingForm, hero_subtitle: v })} />
              <FieldInput label="About Title" value={brandingForm.about_title} onChange={(v) => setBrandingForm({ ...brandingForm, about_title: v })} />
              <FieldInput label="About Text" value={brandingForm.about_text} onChange={(v) => setBrandingForm({ ...brandingForm, about_text: v })} />
              <FieldInput label="Footer Text" value={brandingForm.footer_text} onChange={(v) => setBrandingForm({ ...brandingForm, footer_text: v })} />
              <FieldInput label="Logo URL" value={brandingForm.logo_url} onChange={(v) => setBrandingForm({ ...brandingForm, logo_url: v })} />
              <FieldInput label="Favicon URL" value={brandingForm.favicon_url} onChange={(v) => setBrandingForm({ ...brandingForm, favicon_url: v })} />
            </div>
          ) : (
            <div className="grid grid-cols-[160px_1fr] gap-3 text-sm">
              <span className="text-muted-foreground">Hero Title</span><span>{branding.hero_title || "—"}</span>
              <span className="text-muted-foreground">Hero Subtitle</span><span>{branding.hero_subtitle || "—"}</span>
              <span className="text-muted-foreground">About Title</span><span>{branding.about_title || "—"}</span>
              <span className="text-muted-foreground">About Text</span><span>{branding.about_text || "—"}</span>
              <span className="text-muted-foreground">Footer Text</span><span>{branding.footer_text || "—"}</span>
              <span className="text-muted-foreground">Accent Color</span>
              <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-md border-2 border-border" style={{ background: branding.accent_color || "transparent" }} /><span>{branding.accent_color || "—"}</span></div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
