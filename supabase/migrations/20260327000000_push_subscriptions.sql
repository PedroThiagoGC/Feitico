-- Migration: Web Push subscription storage

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id   UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  device_label TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (salon_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Admin can manage their own salon subscriptions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'push_subscriptions' AND policyname = 'push_subs_salon_owner'
  ) THEN
    CREATE POLICY push_subs_salon_owner ON public.push_subscriptions
      FOR ALL TO authenticated
      USING (salon_id IN (SELECT id FROM public.salons))
      WITH CHECK (salon_id IN (SELECT id FROM public.salons));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_push_subs_salon ON public.push_subscriptions(salon_id);
