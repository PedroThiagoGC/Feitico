import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save } from "lucide-react";
import ImageUpload from "./ImageUpload";
import OpeningHoursEditor from "./OpeningHoursEditor";
import { normalizeWhatsAppPhone, splitWhatsAppPhone } from "@/lib/phone";

export default function AdminSalon() {
  const [salon, setSalon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [whatsappCountryCode, setWhatsappCountryCode] = useState("55");
  const [whatsappNationalNumber, setWhatsappNationalNumber] = useState("");

  useEffect(() => {
    loadSalon();
  }, []);

  async function loadSalon() {
    const { data } = await supabase.from("salons").select("*").limit(1).maybeSingle();
    const initialSalon = data || {
      name: "", phone: "", whatsapp: "", address: "", about_text: "",
      logo_url: "", hero_image_url: "", video_url: "", instagram: "", facebook: "",
      opening_hours: {
        mon: "09:00-19:00", tue: "09:00-19:00", wed: "09:00-19:00",
        thu: "09:00-19:00", fri: "09:00-19:00", sat: "09:00-18:00", sun: "closed",
      },
    };

    setSalon(initialSalon);

    const parts = splitWhatsAppPhone(initialSalon.whatsapp || initialSalon.phone || "", "55");
    setWhatsappCountryCode(parts.countryCode);
    setWhatsappNationalNumber(parts.nationalNumber);

    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const normalizedWhatsapp = normalizeWhatsAppPhone(
      `${whatsappCountryCode}${whatsappNationalNumber}`,
      whatsappCountryCode || "55"
    );

    if (whatsappNationalNumber.trim() && !normalizedWhatsapp) {
      toast.error("WhatsApp inválido. Informe DDI e número com DDD.");
      setSaving(false);
      return;
    }

    const payload = {
      ...salon,
      whatsapp: normalizedWhatsapp || null,
    };

    if (salon.id) {
      const { error } = await supabase.from("salons").update(payload).eq("id", salon.id);
      if (error) toast.error(error.message);
      else {
        setSalon(payload);
        toast.success("Salão atualizado!");
      }
    } else {
      const { data, error } = await supabase.from("salons").insert({ ...payload, active: true }).select().single();
      if (error) toast.error(error.message);
      else { setSalon(data); toast.success("Salão criado!"); }
    }
    setSaving(false);
  }

  if (loading) return <p className="text-muted-foreground font-body">Carregando...</p>;

  const textFields = [
    { key: "name", label: "Nome do Salão" },
    { key: "phone", label: "Telefone" },
    { key: "address", label: "Endereço" },
    { key: "video_url", label: "URL do Vídeo (YouTube)" },
    { key: "instagram", label: "Instagram (@usuario)" },
    { key: "facebook", label: "Facebook" },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-display text-xl">Configurações do Salão</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {textFields.map((f) => (
              <div key={f.key}>
                <label className="font-body text-sm font-medium mb-1 block">{f.label}</label>
                <Input
                  value={salon[f.key] || ""}
                  onChange={(e) => setSalon({ ...salon, [f.key]: e.target.value })}
                  className="bg-secondary border-border font-body"
                />
              </div>
            ))}

            <div>
              <label className="font-body text-sm font-medium mb-1 block">WhatsApp (DDI)</label>
              <Input
                value={whatsappCountryCode}
                onChange={(e) => setWhatsappCountryCode(e.target.value.replace(/\D/g, ""))}
                className="bg-secondary border-border font-body"
                placeholder="55"
                maxLength={3}
              />
            </div>

            <div>
              <label className="font-body text-sm font-medium mb-1 block">WhatsApp (DDD + número)</label>
              <Input
                value={whatsappNationalNumber}
                onChange={(e) => setWhatsappNationalNumber(e.target.value.replace(/\D/g, ""))}
                className="bg-secondary border-border font-body"
                placeholder="11912345678"
                maxLength={12}
              />
            </div>
          </div>

          {/* Image uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-body text-sm font-medium mb-1 block">Logo</label>
              <ImageUpload
                value={salon.logo_url || ""}
                onChange={(url) => setSalon({ ...salon, logo_url: url })}
                folder="logos"
              />
            </div>
            <div>
              <label className="font-body text-sm font-medium mb-1 block">Imagem Hero</label>
              <ImageUpload
                value={salon.hero_image_url || ""}
                onChange={(url) => setSalon({ ...salon, hero_image_url: url })}
                folder="hero"
              />
            </div>
          </div>

          {/* About */}
          <div>
            <label className="font-body text-sm font-medium mb-1 block">Sobre o Salão</label>
            <Textarea
              value={salon.about_text || ""}
              onChange={(e) => setSalon({ ...salon, about_text: e.target.value })}
              className="bg-secondary border-border font-body min-h-[120px]"
            />
          </div>

          {/* Opening Hours */}
          <OpeningHoursEditor
            value={salon.opening_hours as Record<string, string> | null}
            onChange={(hours) => setSalon({ ...salon, opening_hours: hours })}
          />

          <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground font-body">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
