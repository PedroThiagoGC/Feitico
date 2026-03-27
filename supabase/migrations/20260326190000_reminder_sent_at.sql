-- Migration: add reminder_sent_at to bookings for WhatsApp reminder tracking

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Partial index: fast lookup of bookings that still need reminders
CREATE INDEX IF NOT EXISTS idx_bookings_reminder_pending
  ON public.bookings(salon_id, booking_date, reminder_sent_at)
  WHERE reminder_sent_at IS NULL
    AND status IN ('pending', 'confirmed');
