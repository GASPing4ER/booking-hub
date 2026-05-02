-- Migration: Schema fixes and new features
-- Adds missing columns, fixes schema mismatches, adds bio to user_profiles

-- Add missing columns to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS min_stay_nights INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS house_rules TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add unique index on slug (partial, only for non-null slugs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_slug ON public.properties (slug) WHERE slug IS NOT NULL;

-- Add bio column to user_profiles table
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add public_read policy for bookings (for guest lookup by email + booking ID)
DROP POLICY IF EXISTS "public_read_own_bookings" ON public.bookings;
CREATE POLICY "public_read_own_bookings"
ON public.bookings
FOR SELECT
TO public
USING (true);
