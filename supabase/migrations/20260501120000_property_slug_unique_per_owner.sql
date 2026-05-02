-- Listing URL slugs are scoped per provider (owner). Global uniqueness was too restrictive.
DROP INDEX IF EXISTS idx_properties_slug;

CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_owner_slug
  ON public.properties (owner_id, slug)
  WHERE slug IS NOT NULL AND btrim(slug) <> '';
