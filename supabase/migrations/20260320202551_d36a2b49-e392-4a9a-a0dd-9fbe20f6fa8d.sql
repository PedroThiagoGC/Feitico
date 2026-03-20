-- 1. Tenant details (separate table as requested)
CREATE TABLE IF NOT EXISTS public.tenant_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  legal_name varchar,
  document varchar,
  phone varchar,
  whatsapp_phone varchar,
  email varchar,
  address text,
  city varchar,
  state varchar(2),
  zip_code varchar(10),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Tenant branding (white-label)
CREATE TABLE IF NOT EXISTS public.tenant_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  primary_color varchar DEFAULT '#C6A85C',
  secondary_color varchar DEFAULT '#1A1A1A',
  accent_color varchar DEFAULT '#FFFFFF',
  background_color varchar DEFAULT '#0B0B0B',
  text_color varchar DEFAULT '#E5E0D5',
  logo_url text,
  favicon_url text,
  hero_title text,
  hero_subtitle text,
  about_title text,
  about_text text,
  footer_text text,
  font_heading varchar DEFAULT 'Playfair Display',
  font_body varchar DEFAULT 'Montserrat',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Tenant settings (feature flags)
CREATE TABLE IF NOT EXISTS public.tenant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  booking_enabled boolean DEFAULT true,
  gallery_enabled boolean DEFAULT true,
  testimonials_enabled boolean DEFAULT true,
  video_enabled boolean DEFAULT true,
  pwa_enabled boolean DEFAULT true,
  whatsapp_notifications_enabled boolean DEFAULT true,
  allow_walk_in boolean DEFAULT true,
  financial_enabled boolean DEFAULT true,
  reports_enabled boolean DEFAULT true,
  commission_enabled boolean DEFAULT true,
  multi_unit_enabled boolean DEFAULT false,
  timezone varchar DEFAULT 'America/Sao_Paulo',
  currency varchar(3) DEFAULT 'BRL',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Subscription plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  description text,
  monthly_price numeric NOT NULL DEFAULT 0,
  annual_price numeric NOT NULL DEFAULT 0,
  max_professionals integer DEFAULT 5,
  max_units integer DEFAULT 1,
  max_bookings_per_month integer DEFAULT 500,
  features_json jsonb DEFAULT '[]'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Tenant subscriptions
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status varchar NOT NULL DEFAULT 'trial',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  billing_cycle varchar DEFAULT 'monthly',
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Platform users
CREATE TABLE IF NOT EXISTS public.platform_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  name varchar NOT NULL,
  email varchar NOT NULL UNIQUE,
  role varchar NOT NULL DEFAULT 'tenant_admin',
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Enhanced audit_logs
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS module varchar,
  ADD COLUMN IF NOT EXISTS entity_type varchar,
  ADD COLUMN IF NOT EXISTS entity_id uuid,
  ADD COLUMN IF NOT EXISTS metadata_json jsonb;

-- Enable RLS
ALTER TABLE public.tenant_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_users ENABLE ROW LEVEL SECURITY;

-- RLS policies - public read for plans
CREATE POLICY "Anyone can read active plans" ON public.subscription_plans FOR SELECT USING (active = true);

-- RLS policies - full access (API uses service role key for superadmin)
CREATE POLICY "Full access tenant_details" ON public.tenant_details FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access tenant_branding" ON public.tenant_branding FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access tenant_settings" ON public.tenant_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access tenant_subscriptions" ON public.tenant_subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access platform_users" ON public.platform_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access subscription_plans" ON public.subscription_plans FOR ALL USING (true) WITH CHECK (true);