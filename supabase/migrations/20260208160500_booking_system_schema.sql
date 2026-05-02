-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DROP TYPE IF EXISTS public.booking_status CASCADE;
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled');

DROP TYPE IF EXISTS public.property_status CASCADE;
CREATE TYPE public.property_status AS ENUM ('available', 'unavailable', 'maintenance');

DROP TYPE IF EXISTS public.availability_status CASCADE;
CREATE TYPE public.availability_status AS ENUM ('available', 'unavailable', 'booked');

DROP TYPE IF EXISTS public.property_type CASCADE;
CREATE TYPE public.property_type AS ENUM ('Suite', 'Room', 'Cottage', 'Lodge', 'Studio');

-- User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    business_name TEXT,
    business_email TEXT,
    business_phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    timezone TEXT DEFAULT 'America/New_York',
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Properties Table
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type public.property_type DEFAULT 'Room'::public.property_type,
    description TEXT,
    capacity INTEGER NOT NULL DEFAULT 1,
    price_per_night DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
    status public.property_status DEFAULT 'available'::public.property_status,
    total_bookings INTEGER DEFAULT 0,
    rating DECIMAL(2, 1) DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Bookings Table
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

-- Availability Calendar Table
CREATE TABLE IF NOT EXISTS public.availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status public.availability_status DEFAULT 'available'::public.availability_status,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(property_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON public.bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in ON public.bookings(check_in);
CREATE INDEX IF NOT EXISTS idx_bookings_check_out ON public.bookings(check_out);
CREATE INDEX IF NOT EXISTS idx_availability_property_date ON public.availability(property_id, date);

-- Functions
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
    );
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

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
DROP POLICY IF EXISTS "users_manage_own_profile" ON public.user_profiles;
CREATE POLICY "users_manage_own_profile"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- RLS Policies for properties
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

-- RLS Policies for bookings
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

-- RLS Policies for availability
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

-- Triggers
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

-- Mock Data
DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    prop1_uuid UUID := gen_random_uuid();
    prop2_uuid UUID := gen_random_uuid();
    prop3_uuid UUID := gen_random_uuid();
    prop4_uuid UUID := gen_random_uuid();
BEGIN
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

    -- Update user profile with business info
    UPDATE public.user_profiles
    SET 
        business_name = 'Seaside Retreat',
        business_email = 'info@seasideresort.com',
        business_phone = '+1 (555) 987-6543',
        address = '123 Ocean Drive',
        city = 'Miami Beach',
        country = 'United States'
    WHERE id = admin_uuid;

    -- Create properties
    INSERT INTO public.properties (id, owner_id, name, type, description, capacity, price_per_night, image_url, amenities, status, total_bookings, rating)
    VALUES
        (prop1_uuid, admin_uuid, 'Deluxe Ocean View Suite', 'Suite'::public.property_type, 'Spacious suite with panoramic ocean views, king-size bed, private balcony, and modern amenities for a luxurious coastal retreat.', 4, 299.00, 'https://images.unsplash.com/photo-1611444756156-bbe40e0a2e56', ARRAY['Ocean View', 'King Bed', 'Balcony', 'WiFi', 'Mini Bar']::TEXT[], 'available'::public.property_status, 45, 4.8),
        (prop2_uuid, admin_uuid, 'Cozy Garden Cottage', 'Cottage'::public.property_type, 'Charming cottage nestled in lush gardens with queen bed, kitchenette, and private patio perfect for peaceful getaways.', 2, 179.00, 'https://images.unsplash.com/photo-1731154986176-3429b96340f3', ARRAY['Garden View', 'Queen Bed', 'Kitchenette', 'Patio']::TEXT[], 'available'::public.property_status, 38, 4.5),
        (prop3_uuid, admin_uuid, 'Family Mountain Lodge', 'Lodge'::public.property_type, 'Spacious lodge with mountain views, two bedrooms, full kitchen, and living area ideal for family vacations.', 6, 399.00, 'https://images.unsplash.com/photo-1542654260-aaa251bf70a6', ARRAY['Mountain View', '2 Bedrooms', 'Full Kitchen', 'Fireplace', 'WiFi']::TEXT[], 'available'::public.property_status, 32, 4.9),
        (prop4_uuid, admin_uuid, 'Standard Room', 'Room'::public.property_type, 'Cozy room with essential amenities for a comfortable stay', 1, 120.00, 'https://img.rocket.new/generatedImages/rocket_gen_img_1bf771dff-1769678017120.png', ARRAY['Single Bed', 'WiFi', 'TV']::TEXT[], 'maintenance'::public.property_status, 28, 4.2)
    ON CONFLICT (id) DO NOTHING;

    -- Create sample bookings
    INSERT INTO public.bookings (property_id, guest_name, guest_email, guest_phone, check_in, check_out, guests, status, total_amount, special_requests)
    VALUES
        (prop1_uuid, 'Sarah Johnson', 'sarah.johnson@email.com', '+1 (555) 234-5678', '2026-02-15', '2026-02-18', 2, 'pending'::public.booking_status, 897.00, 'Late check-in requested after 8 PM'),
        (prop2_uuid, 'Michael Chen', 'michael.chen@email.com', '+1 (555) 345-6789', '2026-02-12', '2026-02-14', 1, 'confirmed'::public.booking_status, 358.00, NULL),
        (prop3_uuid, 'Emily Rodriguez', 'emily.rodriguez@email.com', '+1 (555) 456-7890', '2026-02-20', '2026-02-25', 4, 'confirmed'::public.booking_status, 1995.00, 'Need crib for infant and high chair'),
        (prop4_uuid, 'David Thompson', 'david.thompson@email.com', '+1 (555) 567-8901', '2026-02-10', '2026-02-11', 1, 'cancelled'::public.booking_status, 120.00, NULL),
        (prop1_uuid, 'Lisa Anderson', 'lisa.anderson@email.com', '+1 (555) 678-9012', '2026-02-16', '2026-02-19', 2, 'pending'::public.booking_status, 897.00, NULL),
        (prop2_uuid, 'James Wilson', 'james.wilson@email.com', '+1 (555) 789-0123', '2026-02-22', '2026-02-24', 2, 'confirmed'::public.booking_status, 358.00, 'Anniversary celebration - champagne requested')
    ON CONFLICT (id) DO NOTHING;

    -- Create availability data for next 90 days
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
    WHERE p.owner_id = admin_uuid
    ON CONFLICT (property_id, date) DO NOTHING;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Mock data insertion failed: %', SQLERRM;
END $$;