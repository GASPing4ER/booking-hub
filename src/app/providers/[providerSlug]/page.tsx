'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { slugifyPropertyLabel } from '@/lib/propertySlug';

interface ProviderHomeData {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  totalAccommodations: number;
  availableAccommodations: number;
}

function ProviderStorefrontHomeContent() {
  const params = useParams<{ providerSlug?: string | string[] }>();
  const raw = params?.providerSlug;
  const providerSlug =
    (Array.isArray(raw) ? raw[0] : raw)?.trim() || 'default';

  const storefrontLookupSlug =
    slugifyPropertyLabel(providerSlug.trim()) || providerSlug.trim();

  const supabase = createClient();
  const [providerData, setProviderData] = useState<ProviderHomeData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    const sendHeight = () => {
      if (typeof window !== 'undefined' && window.parent !== window) {
        window.parent.postMessage(
          { type: 'resize', height: document.body.scrollHeight },
          '*'
        );
      }
    };
    sendHeight();
    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    fetchProviderHome();
  }, [isHydrated, providerSlug]);

  const fetchProviderHome = async () => {
    try {
      setLoading(true);

      const { data: ownerProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('slug', storefrontLookupSlug)
        .maybeSingle();

      const ownerId = ownerProfile?.id;

      let totalAccommodations = 0;
      let availableAccommodations = 0;

      let totalQuery = supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });

      let availQuery = supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'available');

      if (ownerId) {
        totalQuery = totalQuery.eq('owner_id', ownerId);
        availQuery = availQuery.eq('owner_id', ownerId);
      }

      const [{ count: tc }, { count: ac }] = await Promise.all([
        totalQuery,
        availQuery,
      ]);

      totalAccommodations = tc ?? 0;
      availableAccommodations = ac ?? 0;

      setProviderData({
        slug: providerSlug,
        name: ownerProfile?.business_name || 'Seaside Retreat',
        tagline:
          ownerProfile?.tagline ||
          'Experience Coastal Luxury & Tranquility',
        description:
          ownerProfile?.bio ||
          'Welcome to our carefully curated accommodations offering the perfect blend of relaxation and adventure.',
        email: ownerProfile?.business_email || 'info@example.com',
        phone: ownerProfile?.business_phone || '',
        address:
          `${ownerProfile?.address || ''} ${ownerProfile?.city || ''}`.trim(),
        totalAccommodations,
        availableAccommodations,
      });
    } catch (err: any) {
      console.error('Error fetching provider:', err.message);
      setProviderData({
        slug: providerSlug,
        name: 'Seaside Retreat',
        tagline: 'Experience Coastal Luxury & Tranquility',
        description:
          'Welcome to our carefully curated accommodations.',
        email: 'info@example.com',
        phone: '+1 (555) 000-0000',
        address: 'Coastal Drive, Miami Beach',
        totalAccommodations: 0,
        availableAccommodations: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-caption text-text-secondary">Loading…</p>
        </div>
      </div>
    );
  }

  if (!providerData) return null;

  const accommodationsPath = `/providers/${encodeURIComponent(providerSlug)}/accommodations`;

  return (
    <div className="min-h-screen bg-background">
      <section className="relative bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground py-16 sm:py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-primary-foreground" />
          <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-accent" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-foreground/15 rounded-full mb-6 ring-4 ring-primary-foreground/20">
            <Icon name="HomeIcon" variant="solid" size={40} className="text-primary-foreground" />
          </div>
          <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl mb-4">{providerData.name}</h1>
          <p className="font-body text-lg sm:text-xl mb-8 text-primary-foreground/85 max-w-2xl mx-auto">{providerData.tagline}</p>

          <div className="flex flex-wrap items-center justify-center gap-6 text-primary-foreground/80 mb-10">
            <div className="flex items-center gap-2">
              <Icon name="ShieldCheckIcon" variant="solid" size={20} className="text-accent" />
              <span className="font-caption text-sm">Verified Property</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="StarIcon" variant="solid" size={20} className="text-accent" />
              <span className="font-caption text-sm">Top Rated</span>
            </div>
          </div>

          <Link
            href={accommodationsPath}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary-foreground text-primary font-heading font-semibold text-lg shadow-lg hover:bg-primary-foreground/90 transition-all"
          >
            View accommodations
            <span className="font-caption font-medium opacity-90">
              ({providerData.availableAccommodations} available)
            </span>
            <Icon name="ArrowRightIcon" variant="outline" size={22} className="text-primary" />
          </Link>
        </div>
      </section>

      <section className="py-12 bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2">
              <h2 className="font-heading font-semibold text-2xl text-text-primary mb-3">About Us</h2>
              <p className="font-body text-text-secondary leading-relaxed">{providerData.description}</p>
              <p className="font-caption text-text-secondary mt-4">
                {providerData.totalAccommodations}{' '}
                {providerData.totalAccommodations === 1 ? 'listing' : 'listings'} •{' '}
                <Link href={accommodationsPath} className="text-primary font-medium hover:underline">
                  Browse all
                </Link>
              </p>
            </div>
            <div className="space-y-3">
              {providerData.email && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Icon name="EnvelopeIcon" variant="outline" size={18} className="text-primary flex-shrink-0" />
                  <span className="font-caption text-sm text-text-secondary truncate">{providerData.email}</span>
                </div>
              )}
              {providerData.phone && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Icon name="PhoneIcon" variant="outline" size={18} className="text-primary flex-shrink-0" />
                  <span className="font-caption text-sm text-text-secondary">{providerData.phone}</span>
                </div>
              )}
              {providerData.address && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Icon name="MapPinIcon" variant="outline" size={18} className="text-primary flex-shrink-0" />
                  <span className="font-caption text-sm text-text-secondary">{providerData.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <Icon name="HomeIcon" variant="solid" size={18} className="text-primary-foreground" />
            </div>
            <span className="font-heading font-semibold text-text-primary">{providerData.name}</span>
          </div>
          <p className="font-caption text-sm text-text-secondary">
            Powered by <span className="text-primary font-medium">BookingHub</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function ProviderStorefrontHomePage() {
  return <ProviderStorefrontHomeContent />;
}
