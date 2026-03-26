-- Adiciona campos para Landing Page 100% configurável pelo admin sem deploy.
-- Os fallbacks hardcoded nos componentes garantem retrocompatibilidade.

ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS hero_title       TEXT,
  ADD COLUMN IF NOT EXISTS hero_subtitle    TEXT,
  ADD COLUMN IF NOT EXISTS hero_description TEXT,
  ADD COLUMN IF NOT EXISTS about_title      TEXT DEFAULT 'Sobre Nós',
  ADD COLUMN IF NOT EXISTS about_image_url  TEXT,
  ADD COLUMN IF NOT EXISTS tagline          TEXT,
  ADD COLUMN IF NOT EXISTS seo_title        TEXT,
  ADD COLUMN IF NOT EXISTS seo_description  TEXT;

-- Trigger updated_at para salons
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS salons_updated_at ON public.salons;
CREATE TRIGGER salons_updated_at
  BEFORE UPDATE ON public.salons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- updated_at em bookings (rastrear mudanças de status para financeiro/auditoria)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS bookings_updated_at ON public.bookings;
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
