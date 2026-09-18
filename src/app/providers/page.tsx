'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { slugifyPropertyLabel } from '@/lib/propertySlug';
import { createClient } from '@/lib/supabase/client';

interface ProviderSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  location: string;
  availableProperties: number;
}

export default function ProvidersPage() {
  const supabase = createClient();
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    void fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);

      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, slug, business_name, full_name, bio, address, city, country')
        .not('slug', 'is', null)
        .order('business_name', { ascending: true });

      if (profilesError) throw profilesError;

      const providerIds = (profiles || []).map((profile: any) => profile.id);
      const availableCounts = new Map<string, number>();

      if (providerIds.length > 0) {
        const { data: properties, error: propertiesError } = await supabase
          .from('properties')
          .select('owner_id')
          .in('owner_id', providerIds)
          .eq('status', 'available');

        if (propertiesError) throw propertiesError;

        (properties || []).forEach((property: any) => {
          availableCounts.set(
            property.owner_id,
            (availableCounts.get(property.owner_id) || 0) + 1,
          );
        });
      }

      const summaries: ProviderSummary[] = (profiles || [])
        .map((profile: any) => {
          const slug = slugifyPropertyLabel(profile.slug || '');
          const location = [profile.city, profile.country].filter(Boolean).join(', ');

          return {
            id: profile.id,
            slug,
            name: profile.business_name || profile.full_name || 'Ponudnik',
            description:
              profile.bio ||
              'Prebrskajte nastanitve tega ponudnika in neposredno rezervirajte svoje bivanje.',
            location: location || profile.address || '',
            availableProperties: availableCounts.get(profile.id) || 0,
          };
        })
        .filter((provider) => provider.slug);

      setProviders(summaries);
    } catch (err) {
      console.error('Error fetching providers:', err);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProviders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return providers;

    return providers.filter((provider) =>
      [provider.name, provider.description, provider.location]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [providers, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="font-caption text-sm uppercase tracking-wide text-primary-foreground/75 mb-3">
              BookingHub ponudniki
            </p>
            <h1 className="font-heading font-bold text-4xl sm:text-5xl mb-4">
              Poiščite svoje naslednje bivanje
            </h1>
            <p className="font-body text-lg text-primary-foreground/85">
              Prebrskajte ponudnike nastanitev, primerjajte razpoložljive nastanitve in rezervirajte neposredno v vsaki trgovini.
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-hospitality-sm mb-8">
          <div className="relative">
            <Icon
              name="MagnifyingGlassIcon"
              variant="outline"
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Iščite ponudnike po imenu ali lokaciji..."
              className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-md text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="font-caption text-text-secondary">Nalaganje ponudnikov...</p>
            </div>
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-border bg-card">
            <Icon
              name="HomeIcon"
              variant="outline"
              size={40}
              className="text-text-secondary mx-auto mb-3"
            />
            <h2 className="font-heading font-semibold text-xl text-text-primary mb-2">
              Ni najdenih ponudnikov
            </h2>
            <p className="font-caption text-text-secondary">
              Poskusite z drugim iskanjem ali se vrnite, ko bo objavljenih več ponudnikov.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map((provider) => (
              <Link
                key={provider.id}
                href={`/providers/${encodeURIComponent(provider.slug)}`}
                className="group bg-card border border-border rounded-xl p-6 shadow-hospitality-sm hover:shadow-hospitality transition-smooth"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon name="HomeIcon" variant="solid" size={24} className="text-primary" />
                </div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="font-heading font-semibold text-xl text-text-primary group-hover:text-primary transition-colors">
                    {provider.name}
                  </h2>
                  <Icon
                    name="ArrowRightIcon"
                    variant="outline"
                    size={18}
                    className="text-text-secondary group-hover:text-primary transition-colors"
                  />
                </div>
                <p className="font-body text-sm text-text-secondary line-clamp-3 mb-4">
                  {provider.description}
                </p>
                <div className="space-y-2">
                  {provider.location && (
                    <div className="flex items-center gap-2 text-sm font-caption text-text-secondary">
                      <Icon name="MapPinIcon" variant="outline" size={16} className="text-primary" />
                      <span>{provider.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm font-caption text-text-secondary">
                    <Icon name="BuildingOfficeIcon" variant="outline" size={16} className="text-primary" />
                    <span>
                      {provider.availableProperties}{' '}
                      {provider.availableProperties === 1 ? 'razpoložljiva nastanitev' : 'razpoložljivih nastanitev'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
