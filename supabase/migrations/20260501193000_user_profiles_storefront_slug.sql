-- Public storefront resolves providers by slug: /providers/{slug}/...
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_slug_unique
  ON public.user_profiles (slug)
  WHERE slug IS NOT NULL AND btrim(slug) <> '';

-- Anonymous guests need to resolve owner by storefront slug: /providers/{slug}/...
-- Policy applies to all roles with SELECT that pass the predicate (combined with manage-own policy via OR).

DROP POLICY IF EXISTS "public_read_provider_profile_by_slug" ON public.user_profiles;
CREATE POLICY "public_read_provider_profile_by_slug"
  ON public.user_profiles
  FOR SELECT
  USING (slug IS NOT NULL AND length(btrim(slug)) > 0);
