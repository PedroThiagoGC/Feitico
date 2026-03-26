-- Indexes para queries mais frequentes conforme volume cresce.

CREATE INDEX IF NOT EXISTS idx_bookings_salon_date
  ON public.bookings(salon_id, booking_date);

CREATE INDEX IF NOT EXISTS idx_bookings_professional_date
  ON public.bookings(professional_id, booking_date);

CREATE INDEX IF NOT EXISTS idx_bookings_status
  ON public.bookings(status);

CREATE INDEX IF NOT EXISTS idx_professionals_salon
  ON public.professionals(salon_id);

CREATE INDEX IF NOT EXISTS idx_services_salon
  ON public.services(salon_id);

CREATE INDEX IF NOT EXISTS idx_professional_availability_professional
  ON public.professional_availability(professional_id);

CREATE INDEX IF NOT EXISTS idx_gallery_images_salon
  ON public.gallery_images(salon_id);
