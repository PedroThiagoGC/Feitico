import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save } from "lucide-react";

export default function AdminSalon() {
  const [salon, setSalon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSalon();
  }, []);

  async function loadSalon() {
    const { data } = await supabase.from("salons").select("*").limit(1).maybeSingle();
    setSalon(data || {
      name: "", phone: "", whatsapp: "", address: "", about_text: "",
      logo_url: "", hero_image_url: "", video_url: "", instagram: "", facebook: "",
    });
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    if (salon.id) {
      const { error } = await supabase.from("salons").update(salon).eq("id", salon.id);
      if (error) toast.error(error.message);
      else toast.success("Salão atualizado!");
    } else {
      const { data, error } = await supabase.from("salons").insert({ ...salon, active: true }).select().single();
      if (error) toast.error(error.message);
      else { setSalon(data); toast.success("Salão criado!"); }
    }
    setSaving(false);
  }

  if (loading) return <p className="text-muted-foreground font-body">Carregando...</p>;

  const fields = [
    { key: "name", label: "Nome do Salão", type: "text" },
    { key: "phone", label: "Telefone", type: "text" },
    { key: "whatsapp", label: "WhatsApp (com DDD e DDI)", type: "text" },
    { key: "address", label: "Endereço", type: "text" },
    { key: "logo_url", label: "URL do Logo", type: "text" },
    { key: "hero_image_url", label: "URL Imagem Hero", type: "text" },
    { key: "video_url", label: "URL do Vídeo (YouTube)", type: "text" },
    { key: "instagram", label: "Instagram (@usuario)", type: "text" },
    { key: "facebook", label: "Facebook", type: "text" },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-display text-xl">Configurações do Salão</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="font-body text-sm font-medium mb-1 block">{f.label}</label>
                <Input
                  value={salon[f.key] || ""}
                  onChange={(e) => setSalon({ ...salon, [f.key]: e.target.value })}
                  className="bg-secondary border-border font-body"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="font-body text-sm font-medium mb-1 block">Sobre o Salão</label>
            <Textarea
              value={salon.about_text || ""}
              onChange={(e) => setSalon({ ...salon, about_text: e.target.value })}
              className="bg-secondary border-border font-body min-h-[120px]"
            />
          </div>
          <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground font-body">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
