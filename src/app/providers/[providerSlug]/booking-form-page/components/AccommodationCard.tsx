import React from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface AccommodationCardProps {
  accommodation: {
    id: string;
    name: string;
    description: string;
    capacity: number;
    pricePerNight: number;
    image: string;
    alt: string;
    amenities: string[];
  };
  isSelected: boolean;
  onSelect: () => void;
}

const AccommodationCard = ({
  accommodation,
  isSelected,
  onSelect,
}: AccommodationCardProps) => {
  return (
    <div
      onClick={onSelect}
      className={`
        relative rounded-lg overflow-hidden cursor-pointer transition-smooth
        border-2 ${
          isSelected
            ? 'border-primary shadow-hospitality-md'
            : 'border-border hover:border-primary/50 shadow-hospitality'
        }
      `}
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-muted">
        <AppImage
          src={accommodation.image}
          alt={accommodation.alt}
          className="w-full h-full object-cover"
        />
        {isSelected && (
          <div className="absolute top-3 right-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <Icon
              name="CheckIcon"
              variant="solid"
              size={20}
              className="text-primary-foreground"
            />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="font-heading font-semibold text-lg text-text-primary mb-2">
          {accommodation.name}
        </h3>
        <p className="text-sm text-text-secondary mb-3 line-clamp-2">
          {accommodation.description}
        </p>

        {/* Capacity & Price */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon
              name="UserGroupIcon"
              variant="outline"
              size={18}
              className="text-text-secondary"
            />
            <span className="caption text-text-secondary">
              Up to {accommodation.capacity} guests
            </span>
          </div>
          <div className="text-right">
            <p className="font-heading font-semibold text-lg text-primary">
              ${accommodation.pricePerNight}
            </p>
            <p className="caption text-text-secondary">per night</p>
          </div>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-2">
          {accommodation.amenities.slice(0, 3).map((amenity, index) => (
            <span
              key={index}
              className="caption px-2 py-1 bg-muted text-text-secondary rounded-md"
            >
              {amenity}
            </span>
          ))}
          {accommodation.amenities.length > 3 && (
            <span className="caption px-2 py-1 bg-muted text-text-secondary rounded-md">
              +{accommodation.amenities.length - 3} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccommodationCard;