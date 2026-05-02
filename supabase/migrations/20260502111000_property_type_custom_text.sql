-- Property types should not be limited to a fixed enum. Providers can choose
-- a common type or save any custom accommodation type from the dashboard.
ALTER TABLE public.properties
  ALTER COLUMN type DROP DEFAULT,
  ALTER COLUMN type TYPE TEXT USING type::text,
  ALTER COLUMN type SET DEFAULT 'Room';

DROP TYPE IF EXISTS public.property_type;
