-- Add multi-image galleries for properties while keeping image_url as the cover image.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT ARRAY[]::TEXT[];

UPDATE public.properties
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL
  AND btrim(image_url) <> ''
  AND (image_urls IS NULL OR cardinality(image_urls) = 0);

-- Public bucket for listing photos. Object paths are scoped as: <owner_id>/<property_id>/<filename>.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "public_read_property_images" ON storage.objects;
CREATE POLICY "public_read_property_images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'property-images');

DROP POLICY IF EXISTS "users_upload_own_property_images" ON storage.objects;
CREATE POLICY "users_upload_own_property_images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "users_update_own_property_images" ON storage.objects;
CREATE POLICY "users_update_own_property_images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "users_delete_own_property_images" ON storage.objects;
CREATE POLICY "users_delete_own_property_images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
