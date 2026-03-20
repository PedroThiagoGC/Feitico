import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Palette, Save, Eye } from "lucide-react";
import { appToast } from "@/lib/toast";
import { superadminApi } from "@/services/superadminApi";
import { supabase } from "@/integrations/supabase/client";

interface Branding {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  logo_url: string;
  hero_title: string;
  hero_subtitle: string;
  about_title: string;
  about_text: string;
  footer_text: string;
  font_heading: string;
  font_body: string;
}

const defaultBranding: Branding = {
  primary_color: "#C6A85C",
  secondary_color: "#1A1A1A",
  accent_color: "#FFFFFF",
  background_color: "#0B0B0B",
  text_color: "#E5E0D5",
  logo_url: "",
  hero_title: "",
  hero_subtitle: "",
  about_title: "",
  about_text: "",
  footer_text: "",
  font_heading: "Playfair Display",
  font_body: "Montserrat",
};

export default function SuperAdminBranding() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [branding, setBranding] = useState<Branding>(defaultBranding);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    superadminApi.getTenants().then((data) => {
      setTenants(data || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedTenantId) return;
    setLoading(true);
    supabase
      .from("tenant_branding" as any)
      .select("*")
      .eq("tenant_id", selectedTenantId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setBranding({ ...defaultBranding, ...data });
        } else {
          setBranding(defaultBranding);
        }
        setLoading(false);
      });
  }, [selectedTenantId]);

  const handleSave = async () => {
    if (!selectedTenantId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("tenant_branding" as any).upsert(
        { tenant_id: selectedTenantId, ...branding, updated_at: new Date().toISOString() },
        { onConflict: "tenant_id" }
      );
      if (error) throw error;
      appToast.success("Branding salvo com sucesso!");
    } catch (error) {
      appToast.error("Erro ao salvar branding");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof Branding, value: string) => {
    setBranding((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Tenant selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 w-full sm:max-w-xs">
          <Label className="font-body text-sm mb-2 block">Selecionar Tenant</Label>
          <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
            <SelectTrigger className="bg-secondary border-border font-body">
              <SelectValue placeholder="Escolha um tenant..." />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedTenantId && (
          <div className="flex gap-2 mt-auto">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2 font-body border-border"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? "Ocultar" : "Preview"}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground gap-2 font-body">
              <Save className="w-4 h-4" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        )}
      </div>

      {!selectedTenantId ? (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-body text-sm text-muted-foreground">
              Selecione um tenant para configurar o branding
            </p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Colors */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Cores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "primary_color", label: "Primária" },
                { key: "secondary_color", label: "Secundária" },
                { key: "accent_color", label: "Destaque" },
                { key: "background_color", label: "Fundo" },
                { key: "text_color", label: "Texto" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={branding[key as keyof Branding]}
                    onChange={(e) => updateField(key as keyof Branding, e.target.value)}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent"
                  />
                  <div className="flex-1">
                    <Label className="font-body text-sm">{label}</Label>
                    <Input
                      value={branding[key as keyof Branding]}
                      onChange={(e) => updateField(key as keyof Branding, e.target.value)}
                      className="bg-secondary border-border font-body text-xs h-8 mt-1"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Typography */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Tipografia & Logo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="font-body text-sm">Fonte Títulos</Label>
                <Input
                  value={branding.font_heading}
                  onChange={(e) => updateField("font_heading", e.target.value)}
                  className="bg-secondary border-border font-body mt-1"
                />
              </div>
              <div>
                <Label className="font-body text-sm">Fonte Corpo</Label>
                <Input
                  value={branding.font_body}
                  onChange={(e) => updateField("font_body", e.target.value)}
                  className="bg-secondary border-border font-body mt-1"
                />
              </div>
              <div>
                <Label className="font-body text-sm">URL do Logo</Label>
                <Input
                  value={branding.logo_url}
                  onChange={(e) => updateField("logo_url", e.target.value)}
                  className="bg-secondary border-border font-body mt-1"
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Texts */}
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Textos da Landing</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="font-body text-sm">Título Hero</Label>
                <Input
                  value={branding.hero_title}
                  onChange={(e) => updateField("hero_title", e.target.value)}
                  className="bg-secondary border-border font-body mt-1"
                />
              </div>
              <div>
                <Label className="font-body text-sm">Subtítulo Hero</Label>
                <Input
                  value={branding.hero_subtitle}
                  onChange={(e) => updateField("hero_subtitle", e.target.value)}
                  className="bg-secondary border-border font-body mt-1"
                />
              </div>
              <div>
                <Label className="font-body text-sm">Título Sobre</Label>
                <Input
                  value={branding.about_title}
                  onChange={(e) => updateField("about_title", e.target.value)}
                  className="bg-secondary border-border font-body mt-1"
                />
              </div>
              <div>
                <Label className="font-body text-sm">Texto Footer</Label>
                <Input
                  value={branding.footer_text}
                  onChange={(e) => updateField("footer_text", e.target.value)}
                  className="bg-secondary border-border font-body mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="font-body text-sm">Texto Sobre</Label>
                <Textarea
                  value={branding.about_text}
                  onChange={(e) => updateField("about_text", e.target.value)}
                  className="bg-secondary border-border font-body mt-1 min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {showPreview && (
            <Card className="bg-card border-border lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="rounded-lg overflow-hidden p-6 space-y-4"
                  style={{ backgroundColor: branding.background_color, color: branding.text_color }}
                >
                  {/* Header preview */}
                  <div className="flex items-center justify-between pb-4" style={{ borderBottom: `1px solid ${branding.primary_color}30` }}>
                    {branding.logo_url ? (
                      <img src={branding.logo_url} alt="Logo" className="h-8 object-contain" />
                    ) : (
                      <span style={{ fontFamily: branding.font_heading, color: branding.primary_color }} className="text-xl font-bold">
                        Logo
                      </span>
                    )}
                    <button
                      style={{ backgroundColor: branding.primary_color, color: branding.background_color, fontFamily: branding.font_body }}
                      className="px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Agendar
                    </button>
                  </div>
                  {/* Hero preview */}
                  <div className="py-8 text-center">
                    <h2 style={{ fontFamily: branding.font_heading, color: branding.primary_color }} className="text-2xl font-bold mb-2">
                      {branding.hero_title || "Título Principal"}
                    </h2>
                    <p style={{ fontFamily: branding.font_body }} className="text-sm opacity-80">
                      {branding.hero_subtitle || "Subtítulo descritivo"}
                    </p>
                  </div>
                  {/* Footer preview */}
                  <div className="pt-4 text-center text-xs opacity-50" style={{ borderTop: `1px solid ${branding.primary_color}20`, fontFamily: branding.font_body }}>
                    {branding.footer_text || "© 2026 Todos os direitos reservados"}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
