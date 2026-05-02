-- Add status_updated_at column to bookings table
-- Tracks when a booking status was last changed to confirmed or cancelled

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;
