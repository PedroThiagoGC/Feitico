-- Migration: client recognition by phone number

CREATE TABLE IF NOT EXISTS public.clients (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id         UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  phone_normalized TEXT NOT NULL,
  preferred_name   TEXT NOT NULL,
  last_seen_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  merged_into_id   UUID REFERENCES public.clients(id),
  UNIQUE (salon_id, phone_normalized)
);

CREATE TABLE IF NOT EXISTS public.client_aliases (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  alias_name   TEXT NOT NULL,
  usage_count  INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (client_id, alias_name)
);

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id);

-- RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_aliases ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'clients_salon_rls') THEN
    CREATE POLICY clients_salon_rls ON public.clients
      FOR ALL TO authenticated
      USING (salon_id IN (SELECT id FROM public.salons))
      WITH CHECK (salon_id IN (SELECT id FROM public.salons));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_aliases' AND policyname = 'aliases_rls') THEN
    CREATE POLICY aliases_rls ON public.client_aliases
      FOR ALL TO authenticated
      USING (client_id IN (SELECT id FROM public.clients));
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clients_salon ON public.clients(salon_id, phone_normalized);
CREATE INDEX IF NOT EXISTS idx_clients_last_seen ON public.clients(salon_id, last_seen_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON public.bookings(client_id) WHERE client_id IS NOT NULL;

-- Helper function: upsert client by phone, track aliases
CREATE OR REPLACE FUNCTION public.upsert_client_by_phone(
  p_salon_id UUID,
  p_phone    TEXT,
  p_name     TEXT
) RETURNS UUID AS $$
DECLARE
  v_client_id  UUID;
  v_normalized TEXT;
BEGIN
  v_normalized := regexp_replace(p_phone, '[^0-9]', '', 'g');
  IF length(v_normalized) = 0 THEN RETURN NULL; END IF;

  INSERT INTO public.clients(salon_id, phone_normalized, preferred_name, last_seen_at, updated_at)
  VALUES (p_salon_id, v_normalized, p_name, now(), now())
  ON CONFLICT (salon_id, phone_normalized) DO UPDATE
    SET last_seen_at   = now(),
        updated_at     = now(),
        preferred_name = EXCLUDED.preferred_name
  RETURNING id INTO v_client_id;

  INSERT INTO public.client_aliases(client_id, alias_name, last_used_at)
  VALUES (v_client_id, p_name, now())
  ON CONFLICT (client_id, alias_name) DO UPDATE
    SET usage_count  = client_aliases.usage_count + 1,
        last_used_at = now();

  RETURN v_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
