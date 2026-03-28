-- Backfill client_id for existing bookings where customer_phone matches a client record
UPDATE public.bookings b
SET client_id = c.id
FROM public.clients c
WHERE c.salon_id = b.salon_id
  AND c.phone_normalized = regexp_replace(b.customer_phone, '[^0-9]', '', 'g')
  AND b.client_id IS NULL;
