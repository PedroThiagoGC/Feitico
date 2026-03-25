
-- ==============================
-- CORE TABLES
-- ==============================

-- Create salons table
CREATE TABLE IF NOT EXISTS public.salons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  hero_image_url TEXT,
  primary_color TEXT DEFAULT '#C6A85C',
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  about_text TEXT,
  video_url TEXT,
  instagram TEXT,
  facebook TEXT,
  opening_hours JSONB DEFAULT '{"mon":"09:00-19:00","tue":"09:00-19:00","wed":"09:00-19:00","thu":"09:00-19:00","fri":"09:00-19:00","sat":"09:00-18:00","sun":"closed"}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create services table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 30,
  buffer_minutes INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  category TEXT,
  is_combo BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT services_duration_multiple_5 CHECK (duration % 5 = 0),
  CONSTRAINT services_buffer_multiple_5 CHECK (buffer_minutes % 5 = 0)
);

-- Create professionals table
CREATE TABLE IF NOT EXISTS public.professionals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photo_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  commission_type TEXT NOT NULL DEFAULT 'percentage',
  commission_value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create professional_services (N:N)
CREATE TABLE IF NOT EXISTS public.professional_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  custom_price NUMERIC,
  custom_duration_minutes INTEGER,
  custom_buffer_minutes INTEGER,
  commission_override_type TEXT,
  commission_override_value NUMERIC,
  active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(professional_id, service_id),
  CONSTRAINT ps_custom_duration_multiple_5 CHECK (custom_duration_minutes IS NULL OR custom_duration_minutes % 5 = 0),
  CONSTRAINT ps_custom_buffer_multiple_5 CHECK (custom_buffer_minutes IS NULL OR custom_buffer_minutes % 5 = 0)
);

-- Create professional_availability (recurring weekly)
CREATE TABLE IF NOT EXISTS public.professional_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true
);

-- Create professional_exceptions (date-specific overrides)
CREATE TABLE IF NOT EXISTS public.professional_exceptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  type TEXT NOT NULL DEFAULT 'day_off',
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  services JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_duration INTEGER NOT NULL DEFAULT 0,
  total_buffer_minutes INTEGER NOT NULL DEFAULT 0,
  total_occupied_minutes INTEGER NOT NULL DEFAULT 0,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  profit_amount NUMERIC NOT NULL DEFAULT 0,
  booking_date DATE NOT NULL,
  booking_time TIME,
  booking_type TEXT NOT NULL DEFAULT 'scheduled' CHECK (booking_type IN ('scheduled', 'walk_in')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create availability table
CREATE TABLE IF NOT EXISTS public.availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '19:00',
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(salon_id, date)
);

-- Create gallery_images table
CREATE TABLE IF NOT EXISTS public.gallery_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_image TEXT,
  content TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================
-- SUPERADMIN / MULTI-TENANT TABLES
-- ==============================

-- Tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'trial',
  active_services TEXT DEFAULT '0',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenant details (legal/contact info)
CREATE TABLE IF NOT EXISTS public.tenant_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  legal_name TEXT,
  document TEXT,
  email TEXT,
  phone TEXT,
  whatsapp_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenant branding (visual customization)
CREATE TABLE IF NOT EXISTS public.tenant_branding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  primary_color TEXT DEFAULT '#C6A85C',
  secondary_color TEXT DEFAULT '#1A1A1A',
  accent_color TEXT DEFAULT '#FFFFFF',
  background_color TEXT DEFAULT '#0B0B0B',
  text_color TEXT DEFAULT '#E5E0D5',
  font_heading TEXT DEFAULT 'Playfair Display',
  font_body TEXT DEFAULT 'Montserrat',
  hero_title TEXT,
  hero_subtitle TEXT,
  about_title TEXT,
  about_text TEXT,
  footer_text TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenant settings (feature flags/modules)
CREATE TABLE IF NOT EXISTS public.tenant_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  booking_enabled BOOLEAN NOT NULL DEFAULT true,
  gallery_enabled BOOLEAN NOT NULL DEFAULT true,
  testimonials_enabled BOOLEAN NOT NULL DEFAULT true,
  video_enabled BOOLEAN NOT NULL DEFAULT false,
  whatsapp_notifications_enabled BOOLEAN NOT NULL DEFAULT false,
  multi_unit_enabled BOOLEAN NOT NULL DEFAULT false,
  allow_walk_in BOOLEAN NOT NULL DEFAULT true,
  pwa_enabled BOOLEAN NOT NULL DEFAULT false,
  financial_enabled BOOLEAN NOT NULL DEFAULT true,
  commission_enabled BOOLEAN NOT NULL DEFAULT true,
  reports_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subscription plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  max_professionals INTEGER NOT NULL DEFAULT 5,
  max_services INTEGER NOT NULL DEFAULT 20,
  features JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenant subscriptions
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'suspended', 'canceled')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Platform users (superadmin, tenant_admin, manager, professional)
CREATE TABLE IF NOT EXISTS public.platform_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'tenant_admin' CHECK (role IN ('superadmin', 'tenant_admin', 'manager', 'professional')),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  auth_user_id UUID,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT,
  user_email TEXT,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================
-- RLS POLICIES
-- ==============================

ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read policies (landing page)
CREATE POLICY "Public read active salons" ON public.salons FOR SELECT USING (active = true);
CREATE POLICY "Public read active services" ON public.services FOR SELECT USING (active = true);
CREATE POLICY "Public read availability" ON public.availability FOR SELECT USING (true);
CREATE POLICY "Public read gallery" ON public.gallery_images FOR SELECT USING (true);
CREATE POLICY "Public read testimonials" ON public.testimonials FOR SELECT USING (active = true);
CREATE POLICY "Public read professionals" ON public.professionals FOR SELECT USING (active = true);
CREATE POLICY "Public read professional_services" ON public.professional_services FOR SELECT USING (active = true);
CREATE POLICY "Public read professional_availability" ON public.professional_availability FOR SELECT USING (active = true);
CREATE POLICY "Public read professional_exceptions" ON public.professional_exceptions FOR SELECT USING (true);
CREATE POLICY "Public read bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Public create bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read plans" ON public.subscription_plans FOR SELECT USING (active = true);

-- Authenticated full access policies
CREATE POLICY "Auth full salons" ON public.salons FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full services" ON public.services FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full bookings" ON public.bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full availability" ON public.availability FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full gallery" ON public.gallery_images FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full testimonials" ON public.testimonials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full professionals" ON public.professionals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full professional_services" ON public.professional_services FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full professional_availability" ON public.professional_availability FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full professional_exceptions" ON public.professional_exceptions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full tenants" ON public.tenants FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full tenant_details" ON public.tenant_details FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full tenant_branding" ON public.tenant_branding FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full tenant_settings" ON public.tenant_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full subscription_plans" ON public.subscription_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full tenant_subscriptions" ON public.tenant_subscriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full platform_users" ON public.platform_users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full audit_logs" ON public.audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Anon full access (temporary for development - replace with proper auth later)
CREATE POLICY "Anon full tenants" ON public.tenants FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full tenant_details" ON public.tenant_details FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full tenant_branding" ON public.tenant_branding FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full tenant_settings" ON public.tenant_settings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full subscription_plans" ON public.subscription_plans FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full tenant_subscriptions" ON public.tenant_subscriptions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full platform_users" ON public.platform_users FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full audit_logs" ON public.audit_logs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full salons" ON public.salons FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full services" ON public.services FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full bookings" ON public.bookings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full availability" ON public.availability FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full gallery" ON public.gallery_images FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full testimonials" ON public.testimonials FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full professionals" ON public.professionals FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full professional_services" ON public.professional_services FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full professional_availability" ON public.professional_availability FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full professional_exceptions" ON public.professional_exceptions FOR ALL TO anon USING (true) WITH CHECK (true);

-- ==============================
-- GRANTS
-- ==============================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- ==============================
-- STORAGE
-- ==============================
INSERT INTO storage.buckets (id, name, public) VALUES ('salon-images', 'salon-images', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read salon images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'salon-images');
CREATE POLICY "Auth upload salon images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'salon-images');
CREATE POLICY "Auth update salon images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'salon-images');
CREATE POLICY "Auth delete salon images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'salon-images');
CREATE POLICY "Anon upload salon images" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'salon-images');
