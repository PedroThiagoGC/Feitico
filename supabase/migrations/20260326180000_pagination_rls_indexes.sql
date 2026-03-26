-- Migration: pagination, RLS isolation, and performance indexes
-- Analyzed by db-architect: column names confirmed from 20260323152507

-- 1. Add salon_id to professional_availability (if missing)
ALTER TABLE public.professional_availability
  ADD COLUMN IF NOT EXISTS salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE;

-- 2. Backfill salon_id from professionals (batched to avoid long lock)
DO $$
DECLARE
  rows_updated INT;
BEGIN
  LOOP
    UPDATE public.professional_availability pa
    SET salon_id = p.salon_id
    FROM public.professionals p
    WHERE pa.professional_id = p.id
      AND pa.salon_id IS NULL
      AND pa.id IN (
        SELECT pa2.id FROM public.professional_availability pa2
        WHERE pa2.salon_id IS NULL
        LIMIT 1000
      );
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    EXIT WHEN rows_updated = 0;
  END LOOP;
END $$;

-- 3. Indexes for performance

-- professional_availability: lookup by salon + professional + weekday
CREATE INDEX IF NOT EXISTS idx_prof_availability_salon
  ON public.professional_availability(salon_id, professional_id, weekday);

-- testimonials: pagination ordered by creation date
CREATE INDEX IF NOT EXISTS idx_testimonials_salon_created
  ON public.testimonials(salon_id, created_at DESC);

-- bookings: getAvailableSlots query (professional + date + active statuses)
CREATE INDEX IF NOT EXISTS idx_bookings_prof_date_status
  ON public.bookings(professional_id, booking_date, status)
  WHERE status IN ('pending', 'confirmed');

-- 4. RLS policy: enforce salon_id isolation on professional_availability
--    Scoped to authenticated only — does not interfere with existing anon SELECT policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'professional_availability'
      AND policyname = 'availability_salon_isolation'
  ) THEN
    CREATE POLICY availability_salon_isolation
      ON public.professional_availability
      FOR ALL
      TO authenticated
      USING (salon_id IN (SELECT id FROM public.salons))
      WITH CHECK (salon_id IN (SELECT id FROM public.salons));
  END IF;
END $$;
