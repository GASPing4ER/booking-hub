import type { SupabaseClient } from '@supabase/supabase-js';
import { slugifyPropertyLabel } from './propertySlug';

async function storefrontSlugTaken(
  supabase: SupabaseClient,
  slug: string,
  excludeUserId?: string | null,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return false;
  if (excludeUserId && data.id === excludeUserId) return false;
  return true;
}

/** True if `slug` is not used by another provider (ignoring `excludeUserId`, usually the current user). */
export async function isStorefrontSlugAvailable(
  supabase: SupabaseClient,
  slug: string,
  excludeUserId?: string | null,
): Promise<boolean> {
  const normalized = slug?.trim();
  if (!normalized) return false;
  const taken = await storefrontSlugTaken(supabase, normalized, excludeUserId ?? undefined);
  return !taken;
}

/**
 * Picks an unused storefront slug globally (`base`, then `base-1`, ...) for `/providers/{slug}`.
 */
export async function allocateUniqueBusinessSlug(
  supabase: SupabaseClient,
  preferredRaw: string,
  excludeUserId?: string | null,
): Promise<string> {
  const base = slugifyPropertyLabel(preferredRaw);
  for (let n = 0; n < 200; n++) {
    const candidate = n === 0 ? base : `${base}-${n}`;
    const taken = await storefrontSlugTaken(supabase, candidate, excludeUserId ?? undefined);
    if (!taken) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}
