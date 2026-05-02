'use client';

import React, { useState, useEffect } from 'react';
import PropertyCard from './PropertyCard';
import PropertyEditModal from './PropertyEditModal';
import Icon from '@/components/ui/AppIcon';
import { allocateUniquePropertySlug, isPropertySlugAvailableForOwner, slugifyPropertyLabel } from '@/lib/propertySlug';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Property {
  id: string;
  slug: string;
  name: string;
  type: string;
  description: string;
  capacity: number;
  pricePerNight: string;
  image: string;
  images: string[];
  amenities: string[];
  status: 'available' | 'unavailable' | 'maintenance';
  totalBookings: number;
  rating: number;
}

const PAGE_SIZE = 9;
const PROPERTY_IMAGE_BUCKET = 'property-images';

const normalizePropertyImages = (imageUrls: unknown, coverImage: unknown) => {
  const gallery = Array.isArray(imageUrls)
    ? imageUrls.filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
    : [];
  const cover = typeof coverImage === 'string' && coverImage.trim() ? coverImage.trim() : '';

  if (gallery.length > 0) return gallery;
  return cover ? [cover] : [];
};

const sanitizeStorageFileName = (fileName: string) => {
  const parts = fileName.split('.');
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : '';
  const base = parts.join('.').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${base || 'image'}${ext ? `.${ext}` : ''}`;
};

const escapeHtmlAttribute = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const ManagePropertiesInteractive = () => {
  const { user } = useAuth();
  const supabase = createClient();
  const [isHydrated, setIsHydrated] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [embeddingProperty, setEmbeddingProperty] = useState<Property | null>(null);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [providerStoreSlug, setProviderStoreSlug] = useState<string | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || !user?.id) return;
    (async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('slug')
        .eq('id', user.id)
        .maybeSingle();
      setProviderStoreSlug(typeof data?.slug === 'string' && data.slug.trim() ? data.slug.trim() : null);
    })();
  }, [isHydrated, user?.id]);

  useEffect(() => {
    if (!isHydrated || !user) return;
    fetchProperties();
  }, [isHydrated, user]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProperties: Property[] = (data || []).map((prop: any) => ({
        id: prop.id,
        slug: typeof prop.slug === 'string' ? prop.slug.trim() : '',
        name: prop.name,
        type: prop.type,
        description: prop.description,
        capacity: prop.capacity,
        pricePerNight: `$${parseFloat(prop.price_per_night).toFixed(0)}`,
        image: normalizePropertyImages(prop.image_urls, prop.image_url)[0] || '',
        images: normalizePropertyImages(prop.image_urls, prop.image_url),
        amenities: prop.amenities || [],
        status: prop.status,
        totalBookings: prop.total_bookings,
        rating: parseFloat(prop.rating),
      }));

      let enriched = formattedProperties.map((p) => ({ ...p }));

      if (user?.id) {
        for (let i = 0; i < enriched.length; i++) {
          if (enriched[i].slug) continue;
          try {
            const slug = await allocateUniquePropertySlug(
              supabase,
              user.id,
              enriched[i].name || 'listing',
              enriched[i].id,
            );
            const { error: upErr } = await supabase
              .from('properties')
              .update({ slug })
              .eq('id', enriched[i].id);
            if (!upErr) {
              enriched[i] = { ...enriched[i], slug };
            }
          } catch (e: unknown) {
            console.error(
              'Error ensuring property slug:',
              e instanceof Error ? e.message : e,
            );
          }
        }
      }

      setProperties(enriched);
    } catch (error: any) {
      console.error('Error fetching properties:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isHydrated) return;

    let filtered = [...properties];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((property) => property.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (property) =>
          property.name.toLowerCase().includes(query) ||
          property.type.toLowerCase().includes(query) ||
          (property.slug || '').toLowerCase().includes(query) ||
          property.description.toLowerCase().includes(query)
      );
    }

    setFilteredProperties(filtered);
    setCurrentPage(1);
  }, [statusFilter, searchQuery, properties, isHydrated]);

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setIsAddingNew(false);
    setIsModalOpen(true);
  };

  const handleEmbedProperty = (property: Property) => {
    if (!providerStoreSlug?.trim()) {
      alert('Set your provider storefront slug in Settings before embedding properties.');
      return;
    }

    setEmbedCopied(false);
    setEmbeddingProperty(property);
  };

  const handleAddProperty = () => {
    const newProperty: Property = {
      id: crypto.randomUUID(),
      slug: '',
      name: '',
      type: 'Room',
      description: '',
      capacity: 1,
      pricePerNight: '$0',
      image: '',
      images: [],
      amenities: [],
      status: 'available',
      totalBookings: 0,
      rating: 0,
    };
    setEditingProperty(newProperty);
    setIsAddingNew(true);
    setIsModalOpen(true);
  };

  const handleSaveProperty = async (updatedProperty: Property) => {
    try {
      if (!user?.id) return;

      const excludePropId =
        !isAddingNew && updatedProperty.id.trim() ? updatedProperty.id : null;

      const desiredSlug = slugifyPropertyLabel(
        updatedProperty.slug?.trim()
          ? updatedProperty.slug.trim()
          : updatedProperty.name.trim() || 'listing',
      );

      const available = await isPropertySlugAvailableForOwner(
        supabase,
        user.id,
        desiredSlug,
        excludePropId,
      );
      if (!available) {
        alert(
          'This listing slug is already used by another property on your account. Choose a different slug or click “Suggest from name”.'
        );
        return;
      }

      if (isAddingNew) {
        const imageUrls = updatedProperty.images.filter(Boolean);
        const { error } = await supabase.from('properties').insert({
          id: updatedProperty.id || crypto.randomUUID(),
          owner_id: user.id,
          name: updatedProperty.name,
          type: updatedProperty.type,
          description: updatedProperty.description,
          capacity: updatedProperty.capacity,
          price_per_night: parseFloat(
            updatedProperty.pricePerNight.replace('$', '')
          ),
          image_url: imageUrls[0] || updatedProperty.image || null,
          image_urls: imageUrls,
          amenities: updatedProperty.amenities,
          status: updatedProperty.status,
          total_bookings: 0,
          rating: 0,
          slug: desiredSlug,
        });

        if (error) {
          const msg = String(error?.message || '');
          const isDup = msg.includes('duplicate') || msg.includes('unique') || (error as any)?.code === '23505';
          throw new Error(
            isDup
              ? 'That listing slug conflicts with another property. Pick a different slug or use “Suggest from name”.'
              : msg || 'Could not save property',
          );
        }
      } else {
        const imageUrls = updatedProperty.images.filter(Boolean);
        const { error } = await supabase
          .from('properties')
          .update({
            name: updatedProperty.name,
            type: updatedProperty.type,
            description: updatedProperty.description,
            capacity: updatedProperty.capacity,
            price_per_night: parseFloat(
              updatedProperty.pricePerNight.replace('$', '')
            ),
            image_url: imageUrls[0] || updatedProperty.image || null,
            image_urls: imageUrls,
            amenities: updatedProperty.amenities,
            status: updatedProperty.status,
            slug: desiredSlug,
          })
          .eq('id', updatedProperty.id);

        if (error) {
          const msg = String(error?.message || '');
          const isDup = msg.includes('duplicate') || msg.includes('unique') || (error as any)?.code === '23505';
          throw new Error(
            isDup
              ? 'That listing slug conflicts with another property. Pick a different slug or use “Suggest from name”.'
              : msg || 'Could not save property',
          );
        }
      }

      await fetchProperties();
      setIsModalOpen(false);
      setEditingProperty(null);
      setIsAddingNew(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error saving property';
      console.error('Error saving property:', message);
      alert(message);
    }
  };

  const handleUploadPropertyImages = async (files: File[], property: Property) => {
    if (!user?.id) throw new Error('You must be signed in to upload property images.');

    const propertyId = property.id || crypto.randomUUID();
    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        throw new Error(`${file.name} is not an image file.`);
      }

      const safeName = sanitizeStorageFileName(file.name);
      const storagePath = `${user.id}/${propertyId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
      const { error } = await supabase.storage
        .from(PROPERTY_IMAGE_BUCKET)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from(PROPERTY_IMAGE_BUCKET)
        .getPublicUrl(storagePath);

      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      await fetchProperties();
    } catch (error: any) {
      console.error('Error deleting property:', error.message);
    }
  };

  const handleStatusChange = async (propertyId: string, newStatus: 'available' | 'unavailable' | 'maintenance') => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: newStatus })
        .eq('id', propertyId);

      if (error) throw error;

      await fetchProperties();
    } catch (error: any) {
      console.error('Error updating property status:', error.message);
    }
  };

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading properties...</div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Properties',
      value: properties.length.toString(),
      icon: 'HomeIcon',
      color: 'text-primary'
    },
    {
      label: 'Available',
      value: properties.filter((p) => p.status === 'available').length.toString(),
      icon: 'CheckCircleIcon',
      color: 'text-success'
    },
    {
      label: 'Maintenance',
      value: properties.filter((p) => p.status === 'maintenance').length.toString(),
      icon: 'WrenchScrewdriverIcon',
      color: 'text-warning'
    },
    {
      label: 'Unavailable',
      value: properties.filter((p) => p.status === 'unavailable').length.toString(),
      icon: 'XCircleIcon',
      color: 'text-error'
    }
  ];

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / PAGE_SIZE));
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const embedPropertyKey = embeddingProperty?.slug?.trim() || embeddingProperty?.id || '';
  const embedUrl =
    embeddingProperty && providerStoreSlug?.trim() && embedPropertyKey
      ? `${window.location.origin}/providers/${encodeURIComponent(
          slugifyPropertyLabel(providerStoreSlug),
        )}/accommodations/${encodeURIComponent(embedPropertyKey)}`
      : '';
  const embedCode =
    embeddingProperty && embedUrl
      ? `<iframe src="${escapeHtmlAttribute(embedUrl)}" title="${escapeHtmlAttribute(
          `${embeddingProperty.name} booking`,
        )}" width="100%" height="900" style="border:0;border-radius:12px;max-width:100%;" loading="lazy"></iframe>`
      : '';

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card rounded-lg border border-border p-6 shadow-hospitality-sm">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center`}>
                <Icon
                  name={stat.icon as any}
                  variant="solid"
                  size={24}
                  className={stat.color} />
              </div>
              <div>
                <p className="text-text-secondary text-sm font-caption">{stat.label}</p>
                <p className="text-text-primary text-2xl font-heading font-semibold">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Add Button */}
      <div className="bg-card rounded-lg border border-border p-4 sm:p-6 shadow-hospitality-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 w-full sm:w-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <Icon
                  name="MagnifyingGlassIcon"
                  variant="outline"
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search properties..."
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-md text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth" />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth">
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleAddProperty}
            className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth font-caption font-medium whitespace-nowrap">
            <Icon name="PlusIcon" variant="solid" size={20} />
            Add Property
          </button>
        </div>
      </div>

      {/* Properties count */}
      <div className="flex items-center justify-between">
        <p className="text-text-secondary font-caption text-sm">
          Showing {filteredProperties.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredProperties.length)} of {filteredProperties.length} properties
        </p>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedProperties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            onEdit={handleEditProperty}
            onEmbed={handleEmbedProperty}
            onDelete={handleDeleteProperty}
            onStatusChange={handleStatusChange} />
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <Icon
            name="HomeIcon"
            variant="outline"
            size={48}
            className="text-text-secondary mx-auto mb-4" />
          <p className="text-text-secondary font-caption">
            No properties found matching your filters.
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-card rounded-lg border border-border px-4 py-3">
          <p className="text-sm text-text-secondary font-caption">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md text-text-secondary hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-smooth"
              aria-label="First page"
            >
              <Icon name="ChevronDoubleLeftIcon" variant="outline" size={16} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-md text-text-secondary hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-smooth"
              aria-label="Previous page"
            >
              <Icon name="ChevronLeftIcon" variant="outline" size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-text-secondary text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    className={`w-8 h-8 rounded-md text-sm font-caption transition-smooth ${
                      currentPage === p
                        ? 'bg-primary text-primary-foreground'
                        : 'text-text-secondary hover:bg-muted'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md text-text-secondary hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-smooth"
              aria-label="Next page"
            >
              <Icon name="ChevronRightIcon" variant="outline" size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md text-text-secondary hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-smooth"
              aria-label="Last page"
            >
              <Icon name="ChevronDoubleRightIcon" variant="outline" size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {isModalOpen && editingProperty && (
        <PropertyEditModal
          property={editingProperty}
          isNew={isAddingNew}
          providerStoreSlug={providerStoreSlug}
          onSuggestSlug={(name) =>
            allocateUniquePropertySlug(
              supabase,
              user!.id,
              name,
              isAddingNew ? null : editingProperty.id,
            )
          }
          onUploadImages={handleUploadPropertyImages}
          onSave={handleSaveProperty}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProperty(null);
            setIsAddingNew(false);
          }} />
      )}

      {embeddingProperty && (
        <div className="fixed inset-0 z-300 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card rounded-lg border border-border shadow-hospitality-lg max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="font-heading font-semibold text-2xl text-text-primary">
                  Embed Accommodation
                </h2>
                <p className="text-sm font-caption text-text-secondary mt-1">
                  Copy this iframe code into any website where you want to show {embeddingProperty.name}.
                </p>
              </div>
              <button
                onClick={() => setEmbeddingProperty(null)}
                className="w-8 h-8 rounded-md flex items-center justify-center text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth"
                aria-label="Close embed modal"
              >
                <Icon name="XMarkIcon" variant="outline" size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                  HTML iframe code
                </label>
                <textarea
                  value={embedCode}
                  readOnly
                  rows={5}
                  className="w-full px-4 py-3 bg-background border border-input rounded-md text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              <div className="rounded-md bg-muted p-4">
                <p className="text-sm font-caption text-text-secondary mb-2">
                  Direct accommodation URL
                </p>
                <a
                  href={embedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-mono text-primary hover:underline break-all"
                >
                  {embedUrl}
                </a>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEmbeddingProperty(null)}
                  className="px-6 py-2.5 rounded-md border border-input text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth font-caption font-medium"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(embedCode);
                      setEmbedCopied(true);
                    } catch {
                      setEmbedCopied(false);
                      alert('Could not copy automatically. Select the iframe code and copy it manually.');
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth font-caption font-medium"
                >
                  <Icon name={embedCopied ? 'CheckIcon' : 'ClipboardDocumentIcon'} variant="outline" size={18} />
                  {embedCopied ? 'Copied' : 'Copy Code'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePropertiesInteractive;