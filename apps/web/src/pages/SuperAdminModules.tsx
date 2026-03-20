import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleLeft, Save } from "lucide-react";
import { appToast } from "@/lib/toast";
import { superadminApi } from "@/services/superadminApi";
import { supabase } from "@/integrations/supabase/client";

const modules = [
  { key: "booking_enabled", label: "Agendamento", desc: "Permitir agendamentos online" },
  { key: "gallery_enabled", label: "Galeria", desc: "Exibir galeria de fotos" },
  { key: "testimonials_enabled", label: "Depoimentos", desc: "Exibir depoimentos de clientes" },
  { key: "video_enabled", label: "Vídeo", desc: "Seção de vídeo na landing" },
  { key: "pwa_enabled", label: "PWA", desc: "App instalável" },
  { key: "whatsapp_notifications_enabled", label: "WhatsApp", desc: "Notificações via WhatsApp" },
  { key: "allow_walk_in", label: "Walk-in", desc: "Agendamento por ordem de chegada" },
  { key: "financial_enabled", label: "Financeiro", desc: "Relatórios financeiros" },
  { key: "reports_enabled", label: "Relatórios", desc: "Relatórios detalhados" },
  { key: "commission_enabled", label: "Comissão", desc: "Controle de comissões" },
  { key: "multi_unit_enabled", label: "Multiunidade", desc: "Múltiplas unidades" },
];

export default function SuperAdminModules() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      .from("tenant_settings" as any)
      .select("*")
      .eq("tenant_id", selectedTenantId)
      .maybeSingle()
      .then(({ data }) => {
        const defaults: Record<string, boolean> = {};
        modules.forEach((m) => { defaults[m.key] = true; });
        if (data) {
          modules.forEach((m) => {
            if (data[m.key] !== undefined) defaults[m.key] = data[m.key];
          });
        }
        setSettings(defaults);
        setLoading(false);
      });
  }, [selectedTenantId]);

  const handleSave = async () => {
    if (!selectedTenantId) return;
    setSaving(true);
    try {
      await supabase.from("tenant_settings" as any).upsert(
        { tenant_id: selectedTenantId, ...settings, updated_at: new Date().toISOString() },
        { onConflict: "tenant_id" }
      );
      appToast.success("Módulos atualizados!");
    } catch {
      appToast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 w-full sm:max-w-xs">
          <Label className="font-body text-sm mb-2 block">Selecionar Tenant</Label>
          <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
            <SelectTrigger className="bg-secondary border-border font-body">
              <SelectValue placeholder="Escolha um tenant..." />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedTenantId && (
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground gap-2 font-body mt-auto">
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        )}
      </div>

      {!selectedTenantId ? (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <ToggleLeft className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-body text-sm text-muted-foreground">Selecione um tenant para gerenciar módulos</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="grid md:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-card border-border"><CardContent className="p-4"><Skeleton className="h-4 w-32 mb-2" /><Skeleton className="h-6 w-12" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {modules.map((mod) => (
            <Card key={mod.key} className="bg-card border-border">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-body text-sm font-medium text-foreground">{mod.label}</p>
                  <p className="font-body text-xs text-muted-foreground">{mod.desc}</p>
                </div>
                <Switch
                  checked={settings[mod.key] ?? true}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, [mod.key]: checked }))}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
