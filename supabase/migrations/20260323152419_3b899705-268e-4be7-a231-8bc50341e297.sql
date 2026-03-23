-- Restore schema access required by Supabase PostgREST roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Restore expected service role access in public schema
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- Required permissions for salon CRUD flow
GRANT SELECT ON TABLE public.salons TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.salons TO authenticated;