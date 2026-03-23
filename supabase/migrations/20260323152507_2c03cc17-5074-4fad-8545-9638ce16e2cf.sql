-- Enable RLS on salons
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;

-- Public read access to active salons (landing page)
CREATE POLICY "Anyone can read active salons"
  ON public.salons FOR SELECT
  USING (active = true);

-- Authenticated users can insert/update salons
CREATE POLICY "Authenticated users can insert salons"
  ON public.salons FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update salons"
  ON public.salons FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant permissions on related tables used by admin
GRANT SELECT ON TABLE public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.services TO authenticated;

GRANT SELECT ON TABLE public.professionals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.professionals TO authenticated;

GRANT SELECT ON TABLE public.bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.bookings TO authenticated;

GRANT SELECT ON TABLE public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.testimonials TO authenticated;

GRANT SELECT ON TABLE public.gallery_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.gallery_images TO authenticated;

GRANT SELECT ON TABLE public.availability TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.availability TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.professional_availability TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.professional_services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.professional_exceptions TO authenticated;