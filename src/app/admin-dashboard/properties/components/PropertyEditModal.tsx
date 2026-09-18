'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { slugifyPropertyLabel } from '@/lib/propertySlug';

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

interface PropertyEditModalProps {
  property: Property;
  isNew: boolean;
  providerStoreSlug?: string | null;
  /** When set, fills listing slug with one unique under this provider (recommended). */
  onSuggestSlug?: (name: string) => Promise<string>;
  onUploadImages: (files: File[], property: Property) => Promise<string[]>;
  onSave: (property: Property) => void | Promise<void>;
  onClose: () => void;
}

const COMMON_PROPERTY_TYPES = [
  'Room',
  'Suite',
  'Apartment',
  'Villa',
  'Cottage',
  'Lodge',
  'Studio',
];

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  Room: 'Soba',
  Suite: 'Suita',
  Apartment: 'Apartma',
  Villa: 'Vila',
  Cottage: 'Vikendica',
  Lodge: 'Koča',
  Studio: 'Studio',
};

const PropertyEditModal = ({
  property,
  isNew,
  providerStoreSlug,
  onSuggestSlug,
  onUploadImages,
  onSave,
  onClose,
}: PropertyEditModalProps) => {
  const [formData, setFormData] = useState<Property>(property);
  const [newAmenity, setNewAmenity] = useState('');
  const [listingSlugSuggestBusy, setListingSlugSuggestBusy] = useState(false);
  const [imageUploadBusy, setImageUploadBusy] = useState(false);

  useEffect(() => {
    setFormData(property);
    setNewAmenity('');
  }, [property]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUploadBusy) return;
    if (!formData.name?.trim() || !formData.description?.trim()) {
      alert('Izpolnite vsa obvezna polja');
      return;
    }
    if (!formData.type?.trim()) {
      alert('Izberite ali vnesite tip nepremičnine');
      return;
    }
    const effectiveSlug =
      typeof formData.slug === 'string' && formData.slug.trim()
        ? formData.slug.trim()
        : slugifyPropertyLabel(formData.name.trim());
    await Promise.resolve(
      onSave({
        ...formData,
        type: formData.type.trim(),
        slug: slugifyPropertyLabel(effectiveSlug),
      }),
    );
  };

  const handleChange = (field: keyof Property, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddAmenity = () => {
    if (newAmenity.trim()) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()],
      }));
      setNewAmenity('');
    }
  };

  const handleRemoveAmenity = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index),
    }));
  };

  const handleUploadImages = async (files: FileList | null) => {
    const selectedFiles = Array.from(files || []);
    if (selectedFiles.length === 0) return;

    setImageUploadBusy(true);
    try {
      const uploadedUrls = await onUploadImages(selectedFiles, formData);
      setFormData((prev) => {
        const images = [...prev.images, ...uploadedUrls];
        return {
          ...prev,
          image: images[0] || '',
          images,
        };
      });
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Slik nepremičnine ni bilo mogoče naložiti.');
    } finally {
      setImageUploadBusy(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => {
      const images = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        image: images[0] || '',
        images,
      };
    });
  };

  const handleMakeCoverImage = (index: number) => {
    setFormData((prev) => {
      const selected = prev.images[index];
      if (!selected) return prev;

      const images = [
        selected,
        ...prev.images.filter((_, i) => i !== index),
      ];

      return {
        ...prev,
        image: selected,
        images,
      };
    });
  };

  const slugPreviewPiece = slugifyPropertyLabel(formData.slug || formData.name || 'listing');
  const selectedPropertyType = COMMON_PROPERTY_TYPES.includes(formData.type)
    ? formData.type
    : 'custom';

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card rounded-lg border border-border shadow-hospitality-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-heading font-semibold text-2xl text-text-primary">
            {isNew ? 'Dodaj novo nepremičnino' : 'Uredi nepremičnino'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth"
            aria-label="Zapri okno"
          >
            <Icon name="XMarkIcon" variant="outline" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-4 sm:items-end">
            <div className="min-w-0">
              <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                Ime nepremičnine *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                required
                placeholder="npr. Deluxe suita s pogledom na morje"
              />
            </div>
            <div className="w-full sm:w-44 shrink-0">
              <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
              >
                <option value="available">Na voljo</option>
                <option value="unavailable">Ni na voljo</option>
                <option value="maintenance">Vzdrževanje</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
              <label className="block text-sm font-caption font-medium text-text-secondary">
                URL-oznaka oglasa *
              </label>
              <button
                type="button"
                onClick={async () => {
                  if (!formData.name?.trim()) return;
                  if (onSuggestSlug) {
                    setListingSlugSuggestBusy(true);
                    try {
                      const slug = await onSuggestSlug(formData.name.trim());
                      handleChange('slug', slug);
                    } catch (err) {
                      console.error(err);
                      alert('Ni bilo mogoče izbrati edinstvene oznake. Poskusite znova ali vnesite svojo.');
                    } finally {
                      setListingSlugSuggestBusy(false);
                    }
                  } else {
                    handleChange('slug', slugifyPropertyLabel(formData.name.trim() || ''));
                  }
                }}
                className="text-xs font-caption text-primary hover:underline flex items-center gap-1"
                disabled={!formData.name?.trim() || listingSlugSuggestBusy}
              >
                <Icon name="ArrowPathIcon" variant="outline" size={14} aria-hidden />
                Predlagaj iz imena
              </button>
            </div>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
              placeholder="ocean-view-suite"
              autoCapitalize="off"
              spellCheck={false}
              aria-describedby={
                providerStoreSlug?.trim() ? 'slug-help booking-path-preview' : 'slug-help'
              }
            />
            <p id="slug-help" className="text-xs text-text-secondary font-caption mt-2">
              Izpelje se iz imena nepremičnine, razen če jo prilagodite. Med vašimi oglasi mora biti edinstvena (dvakrat
              ista oznaka pri vaših nepremičninah bo zavrnjena). Za zajamčeno prosto možnost uporabite »Predlagaj iz
              imena« — ob shranjevanju se vaš vnos preveri tudi v bazi podatkov.
            </p>
            {providerStoreSlug?.trim() && (
              <p
                id="booking-path-preview"
                className="text-xs font-mono text-text-secondary font-caption mt-2 break-all"
              >
                /providers/{slugifyPropertyLabel(providerStoreSlug)}/accommodations/{slugPreviewPiece}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                Tip nepremičnine *
              </label>
              <select
                value={selectedPropertyType}
                onChange={(e) => {
                  const nextType = e.target.value;
                  handleChange('type', nextType === 'custom' ? '' : nextType);
                }}
                className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
              >
                {COMMON_PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {PROPERTY_TYPE_LABELS[type] || type}
                  </option>
                ))}
                <option value="custom">Tip po meri...</option>
              </select>
              {selectedPropertyType === 'custom' && (
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="mt-3 w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                  required
                  placeholder="npr. Hišica na drevesu, Glamping šotor, Koča"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                Kapaciteta (gostje) *
              </label>
              <input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => handleChange('capacity', parseInt(e.target.value))}
                className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
              Opis *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth resize-none"
              required
              placeholder="Opišite lastnosti in glavne prednosti nepremičnine..."
            />
          </div>

          <div>
            <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
              Cena na noč *
            </label>
            <input
              type="text"
              value={formData.pricePerNight}
              onChange={(e) => handleChange('pricePerNight', e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
              required
              placeholder="$150"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <label className="block text-sm font-caption font-medium text-text-secondary">
                  Galerija nepremičnine
                </label>
                <p className="text-xs text-text-secondary font-caption mt-1">
                  Naložite več fotografij. Prva slika se uporabi kot naslovna.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth font-caption font-medium cursor-pointer">
                <Icon name="PhotoIcon" variant="outline" size={18} />
                {imageUploadBusy ? 'Nalaganje...' : 'Naloži slike'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  disabled={imageUploadBusy}
                  onChange={(e) => {
                    void handleUploadImages(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

            {formData.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {formData.images.map((imageUrl, index) => (
                  <div
                    key={`${imageUrl}-${index}`}
                    className="relative overflow-hidden rounded-md border border-border bg-muted group"
                  >
                    <img
                      src={imageUrl}
                      alt={`Slika ${index + 1} nepremičnine ${formData.name || ''}`}
                      className="h-28 w-full object-cover"
                    />
                    {index === 0 && (
                      <span className="absolute left-2 top-2 rounded bg-primary px-2 py-1 text-xs font-caption font-medium text-primary-foreground">
                        Naslovna
                      </span>
                    )}
                    <div className="absolute inset-x-2 bottom-2 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {index !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleMakeCoverImage(index)}
                          className="flex-1 rounded bg-card/90 px-2 py-1 text-xs font-caption font-medium text-text-primary hover:bg-card"
                        >
                          Nastavi kot naslovno
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="rounded bg-card/90 px-2 py-1 text-xs font-caption font-medium text-error hover:bg-card"
                        aria-label={`Odstrani sliko ${index + 1}`}
                      >
                        Odstrani
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border bg-muted/40 p-6 text-center">
                <Icon name="PhotoIcon" variant="outline" size={32} className="mx-auto mb-2 text-text-secondary" />
                <p className="text-sm font-caption text-text-secondary">
                  Za nepremičnino še ni naloženih slik.
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
              Ugodnosti
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
                className="flex-1 px-4 py-2.5 bg-background border border-input rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                placeholder="Dodaj ugodnost (npr. WiFi, bazen)"
              />
              <button
                type="button"
                onClick={handleAddAmenity}
                className="px-4 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth"
              >
                <Icon name="PlusIcon" variant="solid" size={20} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.amenities.map((amenity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md"
                >
                  <span className="text-sm font-caption text-text-primary">{amenity}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAmenity(index)}
                    className="text-text-secondary hover:text-error transition-smooth"
                  >
                    <Icon name="XMarkIcon" variant="solid" size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-md border border-input text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth font-caption font-medium"
            >
              Prekliči
            </button>
            <button
              type="submit"
              disabled={imageUploadBusy}
              className="px-6 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth font-caption font-medium"
            >
              {imageUploadBusy ? 'Nalaganje slik...' : isNew ? 'Dodaj nepremičnino' : 'Shrani spremembe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertyEditModal;