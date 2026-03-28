import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, ChevronDown, ChevronRight, Image, Star, Settings, FileText, Type, Clock } from "lucide-react";
import ImageUpload from "./ImageUpload";
import OpeningHoursEditor from "./OpeningHoursEditor";
import AdminGallery from "./AdminGallery";
import AdminTestimonials from "./AdminTestimonials";
import { normalizeWhatsAppPhone, splitWhatsAppPhone } from "@/lib/phone";
import { type Database } from "@/integrations/supabase/types";
import { getSalon } from "@/services/salonService";
import type { SalonRecord } from "@/types/domain";

type SalonFormState = Partial<SalonRecord>;

const SALON_DRAFT_KEY = "feitico:form:admin-salon";

export default function AdminSalon() {
  const [salon, setSalon] = useState<SalonFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [whatsappCountryCode, setWhatsappCountryCode] = useState("55");
  const [whatsappNationalNumber, setWhatsappNationalNumber] = useState("");
  const [imagesOpen, setImagesOpen] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [textsOpen, setTextsOpen] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [testimonialsOpen, setTestimonialsOpen] = useState(false);

  useEffect(() => { loadSalon(); }, []);

  // Persiste rascunho no localStorage enquanto o admin edita
  useEffect(() => {
    if (loading || !salon) return;
    try { localStorage.setItem(SALON_DRAFT_KEY, JSON.stringify(salon)); } catch { /* storage cheio */ }
  }, [salon, loading]);

  async function loadSalon() {
    const data = await getSalon();
    const initialSalon = data || {
      name: "", phone: "", whatsapp: "", address: "", about_text: "",
      logo_url: "", hero_image_url: "", video_url: "", instagram: "", facebook: "",
      opening_hours: {
        mon: "09:00-19:00", tue: "09:00-19:00", wed: "09:00-19:00",
        thu: "09:00-19:00", fri: "09:00-19:00", sat: "09:00-18:00", sun: "closed",
      },
    };

    // Restaura rascunho do localStorage se existir (PWA: previne perda de dados)
    try {
      const draft = localStorage.getItem(SALON_DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft) as SalonFormState;
        setSalon({ ...initialSalon, ...parsed });
      } else {
        setSalon(initialSalon);
      }
    } catch {
      setSalon(initialSalon);
    }

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

    const payload: SalonFormState = {
      ...salon,
      whatsapp: normalizedWhatsapp || null,
    };

    if (salon.id) {
      const { error } = await supabase
        .from("salons")
        .update(payload as Database["public"]["Tables"]["salons"]["Update"] & Record<string, unknown>)
        .eq("id", salon.id);
      if (error) toast.error(error.message);
      else {
        setSalon(payload);
        try { localStorage.removeItem(SALON_DRAFT_KEY); } catch { /* silencioso */ }
        toast.success("Salão atualizado!");
      }
    } else {
      const { data, error } = await supabase
        .from("salons")
        .insert({
          ...payload,
          active: true,
        } as Database["public"]["Tables"]["salons"]["Insert"] & Record<string, unknown>)
        .select()
        .single();
      if (error) toast.error(error.message);
      else {
        setSalon(data as SalonFormState);
        try { localStorage.removeItem(SALON_DRAFT_KEY); } catch { /* silencioso */ }
        toast.success("Salão criado!");
      }
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
    <div className="space-y-4">
      <form onSubmit={handleSave} className="space-y-4">

        {/* Informações Básicas — sempre visível */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center gap-2 pb-4">
            <Settings className="w-4 h-4 text-primary" />
            <CardTitle className="font-display text-xl">Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* Imagens — colapsável, default aberto */}
        <Card className="bg-card border-border">
          <button
            type="button"
            onClick={() => setImagesOpen((v) => !v)}
            className="w-full flex items-center justify-between p-4 md:p-6 text-left hover:bg-secondary/50 transition-colors rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-primary" />
              <span className="font-display text-lg font-semibold text-foreground">Imagens</span>
            </div>
            {imagesOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </button>
          {imagesOpen && (
            <CardContent className="pt-0 pb-6 px-4 md:px-6 space-y-4">
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
                  <label className="font-body text-sm font-medium mb-1 block">Foto de fundo da página inicial</label>
                  <ImageUpload
                    value={salon.hero_image_url || ""}
                    onChange={(url) => setSalon({ ...salon, hero_image_url: url })}
                    folder="hero"
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Sobre o Salão — colapsável, default fechado */}
        <Card className="bg-card border-border">
          <button
            type="button"
            onClick={() => setAboutOpen((v) => !v)}
            className="w-full flex items-center justify-between p-4 md:p-6 text-left hover:bg-secondary/50 transition-colors rounded-lg"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="font-display text-lg font-semibold text-foreground">Sobre o Salão</span>
            </div>
            {aboutOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </button>
          {aboutOpen && (
            <CardContent className="pt-0 pb-6 px-4 md:px-6 space-y-4">
              <div>
                <label className="font-body text-sm font-medium mb-1 block">Sobre o Salão</label>
                <Textarea
                  value={salon.about_text || ""}
                  onChange={(e) => setSalon({ ...salon, about_text: e.target.value })}
                  className="bg-secondary border-border font-body min-h-[120px]"
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Textos do Site — colapsável, default fechado */}
        <Card className="bg-card border-border">
          <button
            type="button"
            onClick={() => setTextsOpen((v) => !v)}
            className="w-full flex items-center justify-between p-4 md:p-6 text-left hover:bg-secondary/50 transition-colors rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-primary" />
              <span className="font-display text-lg font-semibold text-foreground">Textos do Site</span>
            </div>
            {textsOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </button>
          {textsOpen && (
            <CardContent className="pt-0 pb-6 px-4 md:px-6 space-y-4">
              <p className="font-body text-xs text-muted-foreground">
                Personalize o que aparece para os clientes na página principal.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-sm font-medium mb-1 block">
                    Frase principal da página
                    <span className="text-muted-foreground font-normal ml-1">(ex: "Sua beleza merece")</span>
                  </label>
                  <Input
                    value={salon.hero_title || ""}
                    onChange={(e) => setSalon({ ...salon, hero_title: e.target.value })}
                    className="bg-secondary border-border font-body"
                    placeholder="Sua beleza merece"
                  />
                </div>
                <div>
                  <label className="font-body text-sm font-medium mb-1 block">
                    Palavra de destaque em dourado
                    <span className="text-muted-foreground font-normal ml-1">(ex: "excelência")</span>
                  </label>
                  <Input
                    value={salon.hero_subtitle || ""}
                    onChange={(e) => setSalon({ ...salon, hero_subtitle: e.target.value })}
                    className="bg-secondary border-border font-body"
                    placeholder="excelência"
                  />
                </div>
              </div>

              <div>
                <label className="font-body text-sm font-medium mb-1 block">
                  Texto de apresentação abaixo da frase principal
                  <span className="text-muted-foreground font-normal ml-1">(ex: "Agende agora e viva uma experiência premium.")</span>
                </label>
                <Textarea
                  value={salon.hero_description || ""}
                  onChange={(e) => setSalon({ ...salon, hero_description: e.target.value })}
                  className="bg-secondary border-border font-body min-h-[80px]"
                  placeholder="Transforme seu visual com os melhores profissionais. Agende agora e viva uma experiência premium."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-sm font-medium mb-1 block">
                    Título da seção "Sobre nós"
                    <span className="text-muted-foreground font-normal ml-1">(ex: "Nossa história")</span>
                  </label>
                  <Input
                    value={salon.about_title || ""}
                    onChange={(e) => setSalon({ ...salon, about_title: e.target.value })}
                    className="bg-secondary border-border font-body"
                    placeholder="Sobre Nós"
                  />
                </div>
                <div>
                  <label className="font-body text-sm font-medium mb-1 block">
                    Slogan curto do salão
                    <span className="text-muted-foreground font-normal ml-1">(ex: "Beleza & Bem-estar")</span>
                  </label>
                  <Input
                    value={salon.tagline || ""}
                    onChange={(e) => setSalon({ ...salon, tagline: e.target.value })}
                    className="bg-secondary border-border font-body"
                    placeholder="Beleza & Bem-estar"
                  />
                </div>
              </div>

              <div>
                <label className="font-body text-sm font-medium mb-1 block">Foto da seção "Sobre nós"</label>
                <ImageUpload
                  value={salon.about_image_url || ""}
                  onChange={(url) => setSalon({ ...salon, about_image_url: url })}
                  folder="about"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-sm font-medium mb-1 block">
                    Nome que aparece na aba do navegador
                    <span className="text-muted-foreground font-normal ml-1">(ex: "Salão Feitiço | Agendamento Online")</span>
                  </label>
                  <Input
                    value={salon.seo_title || ""}
                    onChange={(e) => setSalon({ ...salon, seo_title: e.target.value })}
                    className="bg-secondary border-border font-body"
                    placeholder="Nome do Salão | Agendamento Online"
                  />
                </div>
                <div>
                  <label className="font-body text-sm font-medium mb-1 block">
                    Descrição para o Google
                    <span className="text-muted-foreground font-normal ml-1">(aparece nos resultados de busca)</span>
                  </label>
                  <Input
                    value={salon.seo_description || ""}
                    onChange={(e) => setSalon({ ...salon, seo_description: e.target.value })}
                    className="bg-secondary border-border font-body"
                    placeholder="Agende seu horário online no melhor salão da cidade."
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Horário de Funcionamento — colapsável, default fechado */}
        <Card className="bg-card border-border">
          <button
            type="button"
            onClick={() => setHoursOpen((v) => !v)}
            className="w-full flex items-center justify-between p-4 md:p-6 text-left hover:bg-secondary/50 transition-colors rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-display text-lg font-semibold text-foreground">Horário de Funcionamento</span>
            </div>
            {hoursOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </button>
          {hoursOpen && (
            <CardContent className="pt-0 pb-6 px-4 md:px-6">
              <OpeningHoursEditor
                value={salon.opening_hours as Record<string, string> | null}
                onChange={(hours) => setSalon({ ...salon, opening_hours: hours })}
              />
            </CardContent>
          )}
        </Card>

        {/* Save bar */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground font-body">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>

      </form>

      {/* Galeria — colapsável */}
      <Card className="bg-card border-border">
        <button
          type="button"
          onClick={() => setGalleryOpen((v) => !v)}
          className="w-full flex items-center justify-between p-4 md:p-6 text-left hover:bg-secondary/50 transition-colors rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-primary" />
            <span className="font-display text-lg font-semibold text-foreground">Galeria de Fotos</span>
          </div>
          {galleryOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </button>
        {galleryOpen && <AdminGallery />}
      </Card>

      {/* Depoimentos — colapsável */}
      <Card className="bg-card border-border">
        <button
          type="button"
          onClick={() => setTestimonialsOpen((v) => !v)}
          className="w-full flex items-center justify-between p-4 md:p-6 text-left hover:bg-secondary/50 transition-colors rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            <span className="font-display text-lg font-semibold text-foreground">Depoimentos</span>
          </div>
          {testimonialsOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </button>
        {testimonialsOpen && <AdminTestimonials />}
      </Card>
    </div>
  );
}
