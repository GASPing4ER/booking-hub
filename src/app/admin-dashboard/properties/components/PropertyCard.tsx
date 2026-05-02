'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

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

interface PropertyCardProps {
  property: Property;
  onEdit: (property: Property) => void;
  onEmbed: (property: Property) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: 'available' | 'unavailable' | 'maintenance') => void;
}

const PropertyCard = ({ property, onEdit, onEmbed, onDelete, onStatusChange }: PropertyCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-success/10 text-success';
      case 'unavailable':
        return 'bg-error/10 text-error';
      case 'maintenance':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-muted text-text-secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return 'CheckCircleIcon';
      case 'unavailable':
        return 'XCircleIcon';
      case 'maintenance':
        return 'WrenchScrewdriverIcon';
      default:
        return 'QuestionMarkCircleIcon';
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-hospitality-sm hover:shadow-hospitality transition-smooth overflow-hidden">
      {/* Property Image */}
      <div className="relative h-48 overflow-hidden">
        <AppImage
          src={property.image}
          alt={`${property.name} accommodation`}
          fill
          className="object-cover"
        />
        <div className="absolute top-3 right-3">
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-md ${getStatusColor(property.status)}`}>
            <Icon
              name={getStatusIcon(property.status) as any}
              variant="solid"
              size={16}
            />
            <span className="text-xs font-caption font-medium capitalize">
              {property.status}
            </span>
          </div>
        </div>
        {property.images.length > 1 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-md bg-card/90 px-2.5 py-1 text-xs font-caption font-medium text-text-primary shadow-hospitality-sm">
            <Icon name="PhotoIcon" variant="outline" size={14} />
            {property.images.length} photos
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-heading font-semibold text-lg text-text-primary mb-1">
              {property.name}
            </h3>
            <p className="text-sm text-text-secondary font-caption">{property.type}</p>
        {property.slug ? (
            <p className="text-xs font-mono text-text-secondary/90 mt-1 truncate" title={property.slug}>
              {property.slug}
            </p>
          ) : (
            <p className="text-xs text-text-secondary italic mt-1 font-caption">Slug pending assignment</p>
          )}
          </div>
          <div className="flex items-center gap-1">
            <Icon name="StarIcon" variant="solid" size={16} className="text-accent" />
            <span className="text-sm font-caption font-medium text-text-primary">
              {property.rating.toFixed(1)}
            </span>
          </div>
        </div>

        <p className="text-sm text-text-secondary mb-4 line-clamp-2">
          {property.description}
        </p>

        {/* Amenities */}
        <div className="flex flex-wrap gap-2 mb-4">
          {property.amenities.slice(0, 3).map((amenity) => (
            <span
              key={amenity}
              className="px-2 py-1 bg-muted rounded text-xs font-caption text-text-secondary"
            >
              {amenity}
            </span>
          ))}
          {property.amenities.length > 3 && (
            <span className="px-2 py-1 bg-muted rounded text-xs font-caption text-text-secondary">
              +{property.amenities.length - 3} more
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Icon name="UserGroupIcon" variant="outline" size={18} className="text-text-secondary" />
            <span className="text-sm font-caption text-text-secondary">
              Up to {property.capacity} guests
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm text-text-secondary font-caption">Per Night</p>
            <p className="text-lg font-heading font-semibold text-primary">
              {property.pricePerNight}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(property)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-input text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth font-caption font-medium"
          >
            <Icon name="PencilIcon" variant="outline" size={16} />
            Edit
          </button>
          <button
            onClick={() => onEmbed(property)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-input text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth font-caption font-medium"
            aria-label={`Embed ${property.name}`}
          >
            <Icon name="CodeBracketIcon" variant="outline" size={16} />
            <span className="hidden sm:inline">Embed</span>
          </button>
          <button
            onClick={() => onDelete(property.id)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-input text-text-secondary hover:bg-error/10 hover:text-error hover:border-error transition-smooth font-caption font-medium"
          >
            <Icon name="TrashIcon" variant="outline" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;