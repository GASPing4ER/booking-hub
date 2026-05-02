# BookingHub

A full-stack property booking management platform built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, and **Supabase**. Providers can list properties, manage bookings, and receive automated email notifications via Resend.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Prerequisites](#prerequisites)
3. [Environment Variables](#environment-variables)
4. [Local Development Setup](#local-development-setup)
5. [Supabase Setup — Step by Step](#supabase-setup--step-by-step)
   - [Step 1: Create a Supabase Project](#step-1-create-a-supabase-project)
   - [Step 2: Run the Full Schema SQL](#step-2-run-the-full-schema-sql)
   - [Step 3: Run the Status Timestamp Migration](#step-3-run-the-status-timestamp-migration)
   - [Step 4: Run the pg_cron Migration (Daily Emails)](#step-4-run-the-pg_cron-migration-daily-emails)
6. [Edge Functions Setup](#edge-functions-setup)
   - [send-booking-confirmation](#1-send-booking-confirmation)
   - [send-booking-confirmed](#2-send-booking-confirmed)
   - [summary-email](#3-summary-email)
7. [Edge Function Secrets](#edge-function-secrets)
8. [Resend Setup](#resend-setup)
9. [Demo Credentials](#demo-credentials)
10. [Application Routes](#application-routes)
11. [Available Scripts](#available-scripts)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Email | Resend |
| Real-time | Supabase Realtime |
| Scheduled Jobs | pg_cron + pg_net |

---

## Prerequisites

- Node.js 18+
- npm or yarn
- A [Supabase](https://supabase.com) account (free tier works)
- A [Resend](https://resend.com) account (free tier works)

---

## Environment Variables

Create a `.env` file in the project root with the following keys:

```env
# Supabase — get these from your project's Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# Resend — get this from resend.com/api-keys
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

---

## Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill in environment variables
cp .env.example .env   # then edit .env with your real values

# 3. Start the development server
npm run dev
```

Open [http://localhost:4028](http://localhost:4028) in your browser.

---

## Supabase Setup — Step by Step

All SQL below is idempotent — safe to run multiple times.

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Note your **Project URL** and **anon key** from **Settings → API**
3. Add them to your `.env` file

---

### Step 2: Run the Full Schema SQL

Go to **Supabase Dashboard → SQL Editor** and run the following query. This creates all tables, types, indexes, functions, triggers, RLS policies, and sample seed data.

```sql
-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CUSTOM TYPES
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

-- User Profiles (auto-created on signup via trigger)
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
    status_updated_at TIMESTAMPTZ,
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
    ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE public.properties
    ADD COLUMN IF NOT EXISTS slug TEXT,
    ADD COLUMN IF NOT EXISTS min_stay_nights INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS house_rules TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;

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
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_slug ON public.properties (slug) WHERE slug IS NOT NULL;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-create user_profiles row when a new auth user signs up
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

-- Auto-update updated_at on row changes
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
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- user_profiles: authenticated users can only read/write their own row
DROP POLICY IF EXISTS "users_manage_own_profile" ON public.user_profiles;
CREATE POLICY "users_manage_own_profile"
ON public.user_profiles FOR ALL TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- properties: owners manage their own; public can read available ones
DROP POLICY IF EXISTS "users_manage_own_properties" ON public.properties;
CREATE POLICY "users_manage_own_properties"
ON public.properties FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "public_read_available_properties" ON public.properties;
CREATE POLICY "public_read_available_properties"
ON public.properties FOR SELECT TO public
USING (status = 'available'::public.property_status);

-- bookings: owners manage bookings for their properties; public can create and read
DROP POLICY IF EXISTS "users_manage_own_bookings" ON public.bookings;
CREATE POLICY "users_manage_own_bookings"
ON public.bookings FOR ALL TO authenticated
USING (
    property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
)
WITH CHECK (
    property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "public_create_bookings" ON public.bookings;
CREATE POLICY "public_create_bookings"
ON public.bookings FOR INSERT TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_own_bookings" ON public.bookings;
CREATE POLICY "public_read_own_bookings"
ON public.bookings FOR SELECT TO public
USING (true);

-- availability: owners manage; public can read
DROP POLICY IF EXISTS "users_manage_own_availability" ON public.availability;
CREATE POLICY "users_manage_own_availability"
ON public.availability FOR ALL TO authenticated
USING (
    property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
)
WITH CHECK (
    property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "public_read_availability" ON public.availability;
CREATE POLICY "public_read_availability"
ON public.availability FOR SELECT TO public
USING (true);

-- ============================================================
-- TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- SEED DATA (idempotent — skipped if admin already exists)
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
    SELECT id INTO existing_admin_id
    FROM auth.users WHERE email = 'admin@seasideresort.com' LIMIT 1;

    IF existing_admin_id IS NULL THEN
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

    UPDATE public.user_profiles SET
        business_name = 'Seaside Retreat',
        business_email = 'info@seasideresort.com',
        business_phone = '+1 (555) 987-6543',
        address = '123 Ocean Drive',
        city = 'Miami Beach',
        country = 'United States'
    WHERE id = existing_admin_id;

    IF NOT EXISTS (SELECT 1 FROM public.properties WHERE owner_id = existing_admin_id LIMIT 1) THEN
        INSERT INTO public.properties (id, owner_id, name, type, description, capacity, price_per_night, image_url, amenities, status, total_bookings, rating)
        VALUES
            (prop1_uuid, existing_admin_id, 'Deluxe Ocean View Suite', 'Suite', 'Spacious suite with panoramic ocean views, king-size bed, private balcony, and modern amenities.', 4, 299.00, 'https://images.unsplash.com/photo-1611444756156-bbe40e0a2e56', ARRAY['Ocean View', 'King Bed', 'Balcony', 'WiFi', 'Mini Bar']::TEXT[], 'available'::public.property_status, 45, 4.8),
            (prop2_uuid, existing_admin_id, 'Cozy Garden Cottage', 'Cottage', 'Charming cottage nestled in lush gardens with queen bed, kitchenette, and private patio.', 2, 179.00, 'https://images.unsplash.com/photo-1731154986176-3429b96340f3', ARRAY['Garden View', 'Queen Bed', 'Kitchenette', 'Patio']::TEXT[], 'available'::public.property_status, 38, 4.5),
            (prop3_uuid, existing_admin_id, 'Family Mountain Lodge', 'Lodge', 'Spacious lodge with mountain views, two bedrooms, full kitchen, and living area.', 6, 399.00, 'https://images.unsplash.com/photo-1542654260-aaa251bf70a6', ARRAY['Mountain View', '2 Bedrooms', 'Full Kitchen', 'Fireplace', 'WiFi']::TEXT[], 'available'::public.property_status, 32, 4.9),
            (prop4_uuid, existing_admin_id, 'Standard Room', 'Room', 'Cozy room with essential amenities for a comfortable stay.', 1, 120.00, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304', ARRAY['Single Bed', 'WiFi', 'TV']::TEXT[], 'maintenance'::public.property_status, 28, 4.2)
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO public.bookings (property_id, guest_name, guest_email, guest_phone, check_in, check_out, guests, status, total_amount, special_requests)
        VALUES
            (prop1_uuid, 'Sarah Johnson', 'sarah.johnson@email.com', '+1 (555) 234-5678', CURRENT_DATE + 5, CURRENT_DATE + 8, 2, 'pending'::public.booking_status, 897.00, 'Late check-in requested after 8 PM'),
            (prop2_uuid, 'Michael Chen', 'michael.chen@email.com', '+1 (555) 345-6789', CURRENT_DATE + 2, CURRENT_DATE + 4, 1, 'confirmed'::public.booking_status, 358.00, NULL),
            (prop3_uuid, 'Emily Rodriguez', 'emily.rodriguez@email.com', '+1 (555) 456-7890', CURRENT_DATE + 10, CURRENT_DATE + 15, 4, 'confirmed'::public.booking_status, 1995.00, 'Need crib for infant and high chair'),
            (prop4_uuid, 'David Thompson', 'david.thompson@email.com', '+1 (555) 567-8901', CURRENT_DATE - 5, CURRENT_DATE - 4, 1, 'cancelled'::public.booking_status, 120.00, NULL),
            (prop1_uuid, 'Lisa Anderson', 'lisa.anderson@email.com', '+1 (555) 678-9012', CURRENT_DATE + 6, CURRENT_DATE + 9, 2, 'pending'::public.booking_status, 897.00, NULL),
            (prop2_uuid, 'James Wilson', 'james.wilson@email.com', '+1 (555) 789-0123', CURRENT_DATE + 12, CURRENT_DATE + 14, 2, 'confirmed'::public.booking_status, 358.00, 'Anniversary celebration')
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO public.availability (property_id, date, status)
        SELECT
            p.id,
            (CURRENT_DATE + i)::DATE,
            CASE
                WHEN random() < 0.1 THEN 'booked'::public.availability_status
                WHEN random() < 0.2 THEN 'unavailable'::public.availability_status
                ELSE 'available'::public.availability_status
            END
        FROM public.properties p, generate_series(0, 89) i
        WHERE p.owner_id = existing_admin_id
        ON CONFLICT (property_id, date) DO NOTHING;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Seed data insertion failed: %', SQLERRM;
END $$;
```

---

### Step 3: Run the Status Timestamp Migration

This is already included in the full schema above (`status_updated_at` column). If you ran an older version of the schema without it, run this separately:

```sql
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;
```

---

### Step 4: Run the pg_cron Migration (Daily Emails)

This schedules the daily summary email edge function to run at **8:00 AM UTC** every day.

> **Note:** `pg_cron` must be enabled in your Supabase project. Go to **Database → Extensions** and enable `pg_cron` and `pg_net` first, then run:

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Set your project URL and anon key as database settings
-- Replace the values below with your actual Supabase project URL and anon key
ALTER DATABASE postgres SET app.supabase_url = 'https://<your-project-ref>.supabase.co';
ALTER DATABASE postgres SET app.supabase_anon_key = '<your-anon-key>';

-- Schedule daily summary email at 8:00 AM UTC
SELECT cron.schedule(
  'daily-booking-summary',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/summary-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

To verify the cron job was created:
```sql
SELECT * FROM cron.job;
```

To remove the cron job if needed:
```sql
SELECT cron.unschedule('daily-booking-summary');
```

---

## Edge Functions Setup

BookingHub uses three Supabase Edge Functions. Deploy them via the Supabase CLI or by pasting the code directly in the Supabase Dashboard under **Edge Functions**.

### 1. `send-booking-confirmation`

**Path:** `supabase/functions/send-booking-confirmation/index.ts`

This function is called after a guest submits a booking. It:
- Sends a **confirmation email to the guest** with booking details
- Looks up the property owner and sends them a **new booking alert email**

**Deploy via CLI:**
```bash
supabase functions deploy send-booking-confirmation
```

**Or manually:** Go to **Supabase Dashboard → Edge Functions → New Function**, name it `send-booking-confirmation`, and paste the contents of `supabase/functions/send-booking-confirmation/index.ts`.

**Called from:** `booking-confirmation/page.tsx`, `provider/[providerSlug]/accommodations/[accommodationSlug]/page.tsx`

**Payload shape:**
```json
{
  "guestEmail": "guest@example.com",
  "guestName": "Jane Doe",
  "bookingId": "uuid-here",
  "propertyName": "Ocean View Suite",
  "checkIn": "2026-06-01",
  "checkOut": "2026-06-05",
  "guests": 2,
  "totalAmount": "1196.00",
  "propertyId": "property-uuid-here"
}
```

---

### 2. `send-booking-confirmed`

**Path:** `supabase/functions/send-booking-confirmed/index.ts`

Called when a host **confirms** a booking (guest was not confirmed before). It sends a single **confirmation email to the guest** via Resend.

**Deploy via CLI:**
```bash
supabase functions deploy send-booking-confirmed
```

**Or manually:** Create a function named `send-booking-confirmed` and paste `supabase/functions/send-booking-confirmed/index.ts`.

**Called from:** admin booking flows — `ManageBookingsInteractive.tsx` (`/admin-dashboard/bookings`) and `AdminDashboardInteractive.tsx` (main dashboard bookings table).

**Requires:** `RESEND_API_KEY` (same as other Resend-backed functions).

**Payload shape:**
```json
{
  "guestEmail": "guest@example.com",
  "guestName": "Jane Doe",
  "bookingId": "uuid-here",
  "propertyName": "Ocean View Suite",
  "checkIn": "2026-06-01",
  "checkOut": "2026-06-05",
  "guests": 2,
  "totalAmount": "1196.00"
}
```

---

### 3. `summary-email`

**Path:** `supabase/functions/summary-email/index.ts`

This function is triggered by the pg_cron job every morning at 8:00 AM UTC. It:
- Queries all providers with properties
- For each provider, fetches pending bookings, today's check-ins, and 30-day occupancy rate
- Sends a **daily digest email** via Resend

**Deploy via CLI:**
```bash
supabase functions deploy summary-email
```

**Or manually:** Go to **Supabase Dashboard → Edge Functions → New Function**, name it `summary-email`, and paste the contents of `supabase/functions/summary-email/index.ts`.

**Can also be triggered manually** via HTTP POST (no body required):
```bash
curl -X POST https://<your-project-ref>.supabase.co/functions/v1/summary-email \
  -H "Authorization: Bearer <your-anon-key>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Edge Function Secrets

These edge functions use Resend and (for `send-booking-confirmation` provider lookup) the service role. Set secrets in **Supabase Dashboard → Edge Functions → Manage Secrets**:

| Secret | Where to get it |
|--------|----------------|
| `RESEND_API_KEY` | [resend.com/api-keys](https://resend.com/api-keys) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → `service_role` key |

> `SUPABASE_URL` is automatically available inside edge functions — you don't need to set it manually.

---

## Resend Setup

1. Create a free account at [resend.com](https://resend.com)
2. Go to **API Keys** → **Create API Key**
3. Add the key to your `.env` as `RESEND_API_KEY`
4. Also add it as an Edge Function secret (see above)

> **Note:** On the free Resend plan, emails can only be sent **from** `onboarding@resend.dev` and **to** your verified email address. To send to any address, add and verify a custom domain in Resend, then update the `from` field in the Resend-backed edge functions.

---

## Demo Credentials

A demo provider account is created by the seed data:

| Field | Value |
|-------|-------|
| Email | `admin@seasideresort.com` |
| Password | `admin123` |

Login at `/provider-login`.

---

## Application Routes

| Route | Description |
|-------|-------------|
| `/` | BookingHub marketing landing page |
| `/provider-landing-page` | Public sample property listing page |
| `/providers` | Public directory of providers |
| `/providers/[providerSlug]` | Provider storefront overview |
| `/providers/[providerSlug]/accommodations` | All listings (filter available vs all) |
| `/providers/[providerSlug]/accommodations/[accommodationSlug]` | Property detail + booking (slug or UUID) |
| `/providers/[providerSlug]/booking-form-page` | Multi-step booking form |
| `/providers/[providerSlug]/booking-confirmation` | Post-booking confirmation page |
| `/my-booking` | Guest booking lookup (by email + booking ID) |
| `/provider-login` | Provider login |
| `/provider-signup` | Provider registration |
| `/forgot-password` | Password reset request |
| `/reset-password` | Password reset (via email link) |
| `/verify-email` | Email verification page |
| `/admin-dashboard` | Provider dashboard (bookings overview) |
| `/admin-dashboard/bookings` | Manage all bookings |
| `/admin-dashboard/properties` | Manage properties |
| `/admin-dashboard/calendar-management-page` | Availability calendar |
| `/admin-dashboard/settings` | Account & business settings |
| `/admin-dashboard/reports` | Revenue and occupancy reports |

---

## Available Scripts

```bash
npm run dev        # Start development server on port 4028
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run lint:fix   # Auto-fix ESLint issues
npm run format     # Format code with Prettier
```

---

## Project Structure

```
├── public/
│   └── assets/images/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── admin-dashboard/          # Provider admin area (includes /reports)
│   │   ├── provider/[providerSlug]/           # storefront + nested booking flows
│   │   ├── my-booking/
│   │   ├── provider-landing-page/
│   │   └── ...auth pages
│   ├── components/
│   │   ├── common/                   # Shared layout components
│   │   └── ui/                       # Base UI components
│   ├── contexts/
│   │   └── AuthContext.tsx           # Supabase auth context
│   ├── lib/
│   │   └── supabase/                 # Supabase client helpers
│   └── styles/
├── supabase/
│   ├── functions/
│   │   ├── send-booking-confirmation/
│   │   ├── send-booking-confirmed/
│   │   └── summary-email/
│   └── migrations/                   # SQL migration files
├── .env                              # Environment variables
├── next.config.mjs
├── tailwind.config.js
└── package.json
```