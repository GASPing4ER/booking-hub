'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { slugifyPropertyLabel } from '@/lib/propertySlug';
import { getPropertyImages } from '@/lib/propertyImages';

interface Accommodation {
  id: string;
  name: string;
  slug: string;
  description: string;
  capacity: number;
  images: Array<{ url: string; alt: string }>;
  amenities: string[];
  pricePerNight: number;
  status: string;
}

interface ProviderData {
  id: string;
  slug: string;
  name: string;
  accommodations: Accommodation[];
}

function AccommodationCard({
  accommodation,
  onBookClick,
}: {
  accommodation: Accommodation;
  onBookClick: (slugOrId: string) => void;
}) {
  return (
    <div className="bg-card rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col">
      <div className="relative h-56 overflow-hidden bg-muted">
        <AppImage
          src={accommodation.images[0]?.url || ''}
          alt={accommodation.images[0]?.alt || accommodation.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 rounded-md text-xs font-medium font-caption capitalize bg-muted text-text-secondary">
            {accommodation.status === 'available'
              ? 'Razpoložljivo'
              : accommodation.status}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-heading font-semibold text-xl text-text-primary leading-tight">
            {accommodation.name}
          </h3>
          <div className="text-right ml-3 flex-shrink-0">
            <p className="font-caption text-xs text-text-secondary">Od</p>
            <p className="font-heading font-bold text-lg text-primary">
              ${accommodation.pricePerNight}
            </p>
          </div>
        </div>

        <p className="font-body text-sm text-text-secondary mb-4 line-clamp-2 flex-1">
          {accommodation.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {accommodation.amenities.slice(0, 3).map((amenity, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs font-caption text-text-secondary"
            >
              <Icon
                name="CheckCircleIcon"
                variant="solid"
                size={12}
                className="text-success"
              />
              {amenity}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            onBookClick(accommodation.slug || accommodation.id)
          }
          disabled={accommodation.status !== 'available'}
          className="w-full bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-caption font-medium text-sm shadow hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>
            {accommodation.status === 'available' ? 'Poglej in rezerviraj' : 'Ni na voljo'}
          </span>
          <Icon name="ArrowRightIcon" variant="outline" size={16} />
        </button>
      </div>
    </div>
  );
}

function ProviderAccommodationsPageContent() {
  const router = useRouter();
  const params = useParams<{ providerSlug?: string | string[] }>();
  const raw = params?.providerSlug;
  const providerSlug =
    (Array.isArray(raw) ? raw[0] : raw)?.trim() || 'default';

  const storefrontLookupSlug =
    slugifyPropertyLabel(providerSlug.trim()) || providerSlug.trim();

  const supabase = createClient();
  const [providerData, setProviderData] = useState<ProviderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available'>('available');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    fetchListings();
  }, [isHydrated, providerSlug]);

  const fetchListings = async () => {
    try {
      setLoading(true);

      const { data: ownerProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('slug', storefrontLookupSlug)
        .maybeSingle();

      const ownerId = ownerProfile?.id;

      let propertiesQuery = supabase.from('properties').select('*').order('name');

      if (ownerId) {
        propertiesQuery = propertiesQuery.eq('owner_id', ownerId);
      }

      const { data: properties, error } = await propertiesQuery;

      if (error) throw error;

      const accommodations: Accommodation[] = (properties || []).map((prop: any) => ({
        id: prop.id,
        name: prop.name,
        slug: prop.slug?.trim() || prop.id,
        description: prop.description || '',
        capacity: prop.capacity || 2,
        pricePerNight: parseFloat(prop.price_per_night) || 0,
        status: prop.status || 'available',
        images: getPropertyImages(prop.image_urls, prop.image_url, `${prop.name} nastanitev`),
        amenities: prop.amenities || [],
      }));

      setProviderData({
        id: ownerProfile?.id || '',
        slug: providerSlug,
        name: ownerProfile?.business_name || 'Ponudnik',
        accommodations,
      });
    } catch (err: any) {
      console.error('Error fetching accommodations:', err.message);
      setProviderData({
        id: '',
        slug: providerSlug,
        name: 'Ponudnik',
        accommodations: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const basePath = `/providers/${encodeURIComponent(providerSlug)}`;

  const handleBook = (slugOrId: string) => {
    router.push(
      `${basePath}/accommodations/${encodeURIComponent(slugOrId)}`
    );
  };

  const filtered =
    providerData?.accommodations.filter(
      (a) => filter === 'all' || a.status === 'available'
    ) || [];

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-caption text-text-secondary">Nalaganje nastanitev…</p>
        </div>
      </div>
    );
  }

  if (!providerData) return null;

  const availableCount = providerData.accommodations.filter(
    (a) => a.status === 'available'
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link
            href={basePath}
            className="inline-flex items-center gap-2 font-caption text-sm text-text-secondary hover:text-primary transition-colors"
          >
            <Icon name="ArrowLeftIcon" variant="outline" size={18} />
            Nazaj na {providerData.name}
          </Link>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary">
            Nastanitve
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <p className="font-body text-text-secondary">
            Nastanitve tega ponudnika, ki jih lahko rezervirate. Preklopite za prikaz nerazpoložljivih nastanitev.
          </p>
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1 w-fit">
            <button
              type="button"
              onClick={() => setFilter('available')}
              className={`px-4 py-2 rounded-md font-caption text-sm font-medium transition-all ${
                filter === 'available'
                  ? 'bg-card shadow text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Razpoložljivo ({availableCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md font-caption text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-card shadow text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Vse ({providerData.accommodations.length})
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-border">
            <Icon
              name="HomeIcon"
              variant="outline"
              size={40}
              className="text-text-secondary mx-auto mb-3"
            />
            <p className="font-heading text-lg text-text-primary mb-1">Nobena nastanitev ne ustreza</p>
            <p className="font-caption text-text-secondary mb-4">
              {filter === 'available'
                ? 'Trenutno ni razpoložljivih nastanitev.'
                : 'Ta ponudnik še ni dodal nobene nepremičnine.'}
            </p>
            <Link href={basePath} className="text-primary font-caption font-medium hover:underline">
              Vrni se na trgovino
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((accommodation) => (
              <AccommodationCard
                key={accommodation.id}
                accommodation={accommodation}
                onBookClick={handleBook}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProviderAccommodationsPage() {
  return <ProviderAccommodationsPageContent />;
}
