-- Remove legacy multi-tenant/superadmin tables no longer used by the single-salon app.
-- Safe to run even if some of these objects no longer exist.

BEGIN;

DROP TABLE IF EXISTS public.platform_users CASCADE;
DROP TABLE IF EXISTS public.tenant_subscriptions CASCADE;
DROP TABLE IF EXISTS public.tenant_branding CASCADE;
DROP TABLE IF EXISTS public.tenant_details CASCADE;
DROP TABLE IF EXISTS public.tenant_settings CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

COMMIT;
