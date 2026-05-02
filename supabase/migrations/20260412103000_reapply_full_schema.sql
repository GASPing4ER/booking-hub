-- Reapply full schema: idempotent consolidation of all migrations
-- Safe to run multiple times

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CUSTOM TYPES (drop + recreate for idempotency)
-- ============================================================
DROP TYPE IF EXISTS public.booking_status CASCADE;
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled');

DROP TYPE IF EXISTS public.property_status CASCADE;
CREATE TYPE public.property_status AS ENUM ('available', 'unavailable', 'maintenance');

DROP TYPE IF EXISTS public.availability_status CASCADE;
CREATE TYPE public.availability_status AS ENUM ('available', 'unavailable', 'booked');

-- ============================================================
-- TABLES
-- ============================================================

-- User Profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    bio TEXT,
    business_name TEXT,
    business_email TEXT,
    business_phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    timezone TEXT DEFAULT 'America/New_York',
    currency TEXT DEFAULT 'USD',
    slug TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Properties
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Room',
    description TEXT,
    capacity INTEGER NOT NULL DEFAULT 1,
    price_per_night DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
    status public.property_status DEFAULT 'available'::public.property_status,
    total_bookings INTEGER DEFAULT 0,
    rating DECIMAL(2, 1) DEFAULT 0.0,
    slug TEXT,
    min_stay_nights INTEGER DEFAULT 1,
    house_rules TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests INTEGER NOT NULL DEFAULT 1,
    status public.booking_status DEFAULT 'pending'::public.booking_status,
    total_amount DECIMAL(10, 2) NOT NULL,
    special_requests TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Availability Calendar
CREATE TABLE IF NOT EXISTS public.availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status public.availability_status DEFAULT 'available'::public.availability_status,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(property_id, date)
);

-- ============================================================
-- ALTER TABLE: add missing columns if not already present
-- ============================================================
ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS slug TEXT;

ALTER TABLE public.properties
    ADD COLUMN IF NOT EXISTS slug TEXT,
    ADD COLUMN IF NOT EXISTS min_stay_nights INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS house_rules TEXT[] DEFAULT ARRAY[]::TEXT[];

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON public.bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in ON public.bookings(check_in);
CREATE INDEX IF NOT EXISTS idx_bookings_check_out ON public.bookings(check_out);
CREATE INDEX IF NOT EXISTS idx_availability_property_date ON public.availability(property_id, date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_owner_slug
  ON public.properties (owner_id, slug)
  WHERE slug IS NOT NULL AND btrim(slug) <> '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_slug_unique
  ON public.user_profiles (slug)
  WHERE slug IS NOT NULL AND btrim(slug) <> '';

-- ============================================================
-- FUNCTIONS (must be before RLS policies)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, phone)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'phone', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- ============================================================
-- ENABLE RLS
-- ============================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- user_profiles
DROP POLICY IF EXISTS "users_manage_own_profile" ON public.user_profiles;
CREATE POLICY "users_manage_own_profile"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "public_read_provider_profile_by_slug" ON public.user_profiles;
CREATE POLICY "public_read_provider_profile_by_slug"
ON public.user_profiles
FOR SELECT
USING (slug IS NOT NULL AND length(btrim(slug)) > 0);

-- properties
DROP POLICY IF EXISTS "users_manage_own_properties" ON public.properties;
CREATE POLICY "users_manage_own_properties"
ON public.properties
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "public_read_available_properties" ON public.properties;
CREATE POLICY "public_read_available_properties"
ON public.properties
FOR SELECT
TO public
USING (status = 'available'::public.property_status);

-- bookings
DROP POLICY IF EXISTS "users_manage_own_bookings" ON public.bookings;
CREATE POLICY "users_manage_own_bookings"
ON public.bookings
FOR ALL
TO authenticated
USING (
    property_id IN (
        SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
)
WITH CHECK (
    property_id IN (
        SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "public_create_bookings" ON public.bookings;
CREATE POLICY "public_create_bookings"
ON public.bookings
FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_own_bookings" ON public.bookings;
CREATE POLICY "public_read_own_bookings"
ON public.bookings
FOR SELECT
TO public
USING (true);

-- availability
DROP POLICY IF EXISTS "users_manage_own_availability" ON public.availability;
CREATE POLICY "users_manage_own_availability"
ON public.availability
FOR ALL
TO authenticated
USING (
    property_id IN (
        SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
)
WITH CHECK (
    property_id IN (
        SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "public_read_availability" ON public.availability;
CREATE POLICY "public_read_availability"
ON public.availability
FOR SELECT
TO public
USING (true);

-- ============================================================
-- TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- MOCK DATA (idempotent)
-- ============================================================
DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    prop1_uuid UUID := gen_random_uuid();
    prop2_uuid UUID := gen_random_uuid();
    prop3_uuid UUID := gen_random_uuid();
    prop4_uuid UUID := gen_random_uuid();
    existing_admin_id UUID;
BEGIN
    -- Check if admin user already exists
    SELECT id INTO existing_admin_id
    FROM auth.users
    WHERE email = 'admin@seasideresort.com'
    LIMIT 1;

    IF existing_admin_id IS NULL THEN
        -- Create admin user
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
            is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
            recovery_token, recovery_sent_at, email_change_token_new, email_change,
            email_change_sent_at, email_change_token_current, email_change_confirm_status,
            reauthentication_token, reauthentication_sent_at, phone, phone_change,
            phone_change_token, phone_change_sent_at
        ) VALUES (
            admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'admin@seasideresort.com', crypt('admin123', gen_salt('bf', 10)), now(), now(), now(),
            jsonb_build_object('full_name', 'Resort Admin', 'phone', '+1 (555) 123-4567'),
            jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
            false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
        ) ON CONFLICT (id) DO NOTHING;

        existing_admin_id := admin_uuid;
    END IF;

    -- Update user profile with business info
    UPDATE public.user_profiles
    SET
        business_name = 'Seaside Retreat',
        business_email = 'info@seasideresort.com',
        business_phone = '+1 (555) 987-6543',
        address = '123 Ocean Drive',
        city = 'Miami Beach',
        country = 'United States'
    WHERE id = existing_admin_id;

    UPDATE public.user_profiles
    SET slug = 'seaside-retreat'
    WHERE id = existing_admin_id
      AND (slug IS NULL OR btrim(slug) = '');

    -- Only insert properties if none exist for this owner
    IF NOT EXISTS (SELECT 1 FROM public.properties WHERE owner_id = existing_admin_id LIMIT 1) THEN
        INSERT INTO public.properties (id, owner_id, name, type, description, capacity, price_per_night, image_url, amenities, status, total_bookings, rating, slug)
        VALUES
            (prop1_uuid, existing_admin_id, 'Deluxe Ocean View Suite', 'Suite', 'Spacious suite with panoramic ocean views, king-size bed, private balcony, and modern amenities for a luxurious coastal retreat.', 4, 299.00, 'https://images.unsplash.com/photo-1611444756156-bbe40e0a2e56', ARRAY['Ocean View', 'King Bed', 'Balcony', 'WiFi', 'Mini Bar']::TEXT[], 'available'::public.property_status, 45, 4.8, 'deluxe-ocean-view-suite'),
            (prop2_uuid, existing_admin_id, 'Cozy Garden Cottage', 'Cottage', 'Charming cottage nestled in lush gardens with queen bed, kitchenette, and private patio perfect for peaceful getaways.', 2, 179.00, 'https://images.unsplash.com/photo-1731154986176-3429b96340f3', ARRAY['Garden View', 'Queen Bed', 'Kitchenette', 'Patio']::TEXT[], 'available'::public.property_status, 38, 4.5, 'cozy-garden-cottage'),
            (prop3_uuid, existing_admin_id, 'Family Mountain Lodge', 'Lodge', 'Spacious lodge with mountain views, two bedrooms, full kitchen, and living area ideal for family vacations.', 6, 399.00, 'https://images.unsplash.com/photo-1542654260-aaa251bf70a6', ARRAY['Mountain View', '2 Bedrooms', 'Full Kitchen', 'Fireplace', 'WiFi']::TEXT[], 'available'::public.property_status, 32, 4.9, 'family-mountain-lodge'),
            (prop4_uuid, existing_admin_id, 'Standard Room', 'Room', 'Cozy room with essential amenities for a comfortable stay', 1, 120.00, 'https://img.rocket.new/generatedImages/rocket_gen_img_1bf771dff-1769678017120.png', ARRAY['Single Bed', 'WiFi', 'TV']::TEXT[], 'maintenance'::public.property_status, 28, 4.2, 'standard-room')
        ON CONFLICT (id) DO NOTHING;

        -- Sample bookings
        INSERT INTO public.bookings (property_id, guest_name, guest_email, guest_phone, check_in, check_out, guests, status, total_amount, special_requests)
        VALUES
            (prop1_uuid, 'Sarah Johnson', 'sarah.johnson@email.com', '+1 (555) 234-5678', '2026-02-15', '2026-02-18', 2, 'pending'::public.booking_status, 897.00, 'Late check-in requested after 8 PM'),
            (prop2_uuid, 'Michael Chen', 'michael.chen@email.com', '+1 (555) 345-6789', '2026-02-12', '2026-02-14', 1, 'confirmed'::public.booking_status, 358.00, NULL),
            (prop3_uuid, 'Emily Rodriguez', 'emily.rodriguez@email.com', '+1 (555) 456-7890', '2026-02-20', '2026-02-25', 4, 'confirmed'::public.booking_status, 1995.00, 'Need crib for infant and high chair'),
            (prop4_uuid, 'David Thompson', 'david.thompson@email.com', '+1 (555) 567-8901', '2026-02-10', '2026-02-11', 1, 'cancelled'::public.booking_status, 120.00, NULL),
            (prop1_uuid, 'Lisa Anderson', 'lisa.anderson@email.com', '+1 (555) 678-9012', '2026-02-16', '2026-02-19', 2, 'pending'::public.booking_status, 897.00, NULL),
            (prop2_uuid, 'James Wilson', 'james.wilson@email.com', '+1 (555) 789-0123', '2026-02-22', '2026-02-24', 2, 'confirmed'::public.booking_status, 358.00, 'Anniversary celebration - champagne requested')
        ON CONFLICT (id) DO NOTHING;

        -- Availability for next 90 days
        INSERT INTO public.availability (property_id, date, status)
        SELECT
            p.id,
            (CURRENT_DATE + i)::DATE,
            CASE
                WHEN random() < 0.1 THEN 'booked'::public.availability_status
                WHEN random() < 0.2 THEN 'unavailable'::public.availability_status
                ELSE 'available'::public.availability_status
            END
        FROM
            public.properties p,
            generate_series(0, 89) i
        WHERE p.owner_id = existing_admin_id
        ON CONFLICT (property_id, date) DO NOTHING;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Mock data insertion failed: %', SQLERRM;
END $$;
