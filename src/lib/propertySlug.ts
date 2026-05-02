import type { SupabaseClient } from '@supabase/supabase-js';

/** URL-safe slug for property listing paths (lowercase, hyphenated). */
export function slugifyPropertyLabel(raw: string): string {
  if (!raw || typeof raw !== 'string') return 'listing';
  const s = raw
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return s || 'listing';
}

async function slugTakenForOwner(
  supabase: SupabaseClient,
  ownerId: string,
  slug: string,
  excludePropertyId?: string | null,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('properties')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('slug', slug)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return false;
  if (excludePropertyId && data.id === excludePropertyId) return false;
  return true;
}

/** True if no other listing for this owner uses `slug` (same row excluded when editing). */
export async function isPropertySlugAvailableForOwner(
  supabase: SupabaseClient,
  ownerId: string,
  slug: string,
  excludePropertyId?: string | null,
): Promise<boolean> {
  const normalized = slug?.trim();
  if (!normalized) return false;
  const exclude =
    excludePropertyId && String(excludePropertyId).trim() ? excludePropertyId : null;
  const taken = await slugTakenForOwner(supabase, ownerId, normalized, exclude);
  return !taken;
}

/**
 * Picks an unused slug under this owner (`base`, then `base-2`, …).
 */
export async function allocateUniquePropertySlug(
  supabase: SupabaseClient,
  ownerId: string,
  preferredRaw: string,
  excludePropertyId?: string | null,
): Promise<string> {
  const base = slugifyPropertyLabel(preferredRaw);
  for (let n = 0; n < 150; n++) {
    const candidate = n === 0 ? base : `${base}-${n}`;
    const taken = await slugTakenForOwner(supabase, ownerId, candidate, excludePropertyId);
    if (!taken) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}
