'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Booking {
  id: string;
  guestName: string;
  guestEmail: string;
  accommodation: string;
  checkIn: string;
  checkOut: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  guests: number;
  totalAmount: string;
  bookingDate: string;
  specialRequests?: string;
  statusUpdatedAt?: string;
}

interface BookingTableRowProps {
  booking: Booking;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onStatusChange: (id: string, status: 'confirmed' | 'cancelled') => void;
  onEdit?: (booking: Booking) => void;
  onDelete?: (id: string) => void;
  isMobileView: boolean;
}

const BookingTableRow = ({
  booking,
  isSelected,
  onSelect,
  onStatusChange,
  onEdit,
  onDelete,
  isMobileView = false,
}: BookingTableRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success/10 text-success border-success/20';
      case 'cancelled':
        return 'bg-error/10 text-error border-error/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted text-text-secondary border-border';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      {/* Desktop Row */}
      {!isMobileView && (
        <tr className="hidden lg:table-row border-b border-border hover:bg-muted/50 transition-smooth">
          <td className="px-4 py-4">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(booking.id)}
              className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-ring cursor-pointer"
              aria-label={`Select booking for ${booking.guestName}`}
            />
          </td>
          <td className="px-4 py-4">
            <div className="flex flex-col">
              <span className="font-caption font-medium text-text-primary">
                {booking.guestName}
              </span>
              <span className="text-sm text-text-secondary">
                {booking.guestEmail}
              </span>
            </div>
          </td>
          <td className="px-4 py-4">
            <span className="font-caption text-text-primary">
              {booking.accommodation}
            </span>
          </td>
          <td className="px-4 py-4">
            <div className="flex flex-col">
              <span className="text-sm font-caption text-text-primary">
                {formatDate(booking.checkIn)}
              </span>
              <span className="text-xs text-text-secondary">Check-in</span>
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="flex flex-col">
              <span className="text-sm font-caption text-text-primary">
                {formatDate(booking.checkOut)}
              </span>
              <span className="text-xs text-text-secondary">Check-out</span>
            </div>
          </td>
          <td className="px-4 py-4">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-caption font-medium border ${getStatusColor(
                booking.status
              )}`}
            >
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </td>
          <td className="px-4 py-4">
            <span className="font-caption font-medium text-text-primary">
              {booking.totalAmount}
            </span>
          </td>
          <td className="px-4 py-4">
            <div className="flex items-center gap-2">
              {booking.status === 'pending' && (
                <>
                  <button
                    onClick={() => onStatusChange(booking.id, 'confirmed')}
                    className="p-2 rounded-md bg-success/10 text-success hover:bg-success/20 transition-smooth"
                    aria-label="Confirm booking"
                  >
                    <Icon name="CheckIcon" variant="solid" size={16} />
                  </button>
                  <button
                    onClick={() => onStatusChange(booking.id, 'cancelled')}
                    className="p-2 rounded-md bg-error/10 text-error hover:bg-error/20 transition-smooth"
                    aria-label="Cancel booking"
                  >
                    <Icon name="XMarkIcon" variant="solid" size={16} />
                  </button>
                </>
              )}
              {/* Actions */}
              <div className="flex items-center gap-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(booking)}
                    className="p-2 rounded-md text-text-secondary hover:bg-muted hover:text-primary transition-smooth"
                    aria-label="Edit booking"
                  >
                    <Icon name="PencilIcon" variant="outline" size={18} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(booking.id)}
                    className="p-2 rounded-md text-text-secondary hover:bg-muted hover:text-error transition-smooth"
                    aria-label="Delete booking"
                  >
                    <Icon name="TrashIcon" variant="outline" size={18} />
                  </button>
                )}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 rounded-md bg-muted text-text-secondary hover:bg-primary/10 hover:text-primary transition-smooth"
                  aria-label="View details"
                >
                  <Icon name="EyeIcon" variant="outline" size={16} />
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* Mobile Card */}
      {isMobileView && (
        <div className="lg:hidden bg-card border border-border rounded-lg p-4 mb-4 shadow-hospitality-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(booking.id)}
                className="mt-1 w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-ring cursor-pointer"
                aria-label={`Select booking for ${booking.guestName}`}
              />
              <div>
                <h4 className="font-caption font-semibold text-text-primary">
                  {booking.guestName}
                </h4>
                <p className="text-sm text-text-secondary">{booking.guestEmail}</p>
              </div>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-caption font-medium border ${getStatusColor(
                booking.status
              )}`}
            >
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </div>

          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2 text-sm">
              <Icon
                name="HomeIcon"
                variant="outline"
                size={16}
                className="text-text-secondary"
              />
              <span className="text-text-primary">{booking.accommodation}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Icon
                name="CalendarIcon"
                variant="outline"
                size={16}
                className="text-text-secondary"
              />
              <span className="text-text-primary">
                {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Icon
                name="CurrencyDollarIcon"
                variant="outline"
                size={16}
                className="text-text-secondary"
              />
              <span className="font-caption font-medium text-text-primary">
                {booking.totalAmount}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-border">
            {booking.status === 'pending' && (
              <>
                <button
                  onClick={() => onStatusChange(booking.id, 'confirmed')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-success text-success-foreground hover:bg-success/90 transition-smooth"
                >
                  <Icon name="CheckIcon" variant="solid" size={16} />
                  <span className="font-caption font-medium text-sm">Confirm</span>
                </button>
                <button
                  onClick={() => onStatusChange(booking.id, 'cancelled')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-error text-error-foreground hover:bg-error/90 transition-smooth"
                >
                  <Icon name="XMarkIcon" variant="solid" size={16} />
                  <span className="font-caption font-medium text-sm">Cancel</span>
                </button>
              </>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-md bg-muted text-text-secondary hover:bg-primary/10 hover:text-primary transition-smooth"
              aria-label="View details"
            >
              <Icon name="EyeIcon" variant="outline" size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Expanded Details Row (Desktop) */}
      {isExpanded && (
        <tr className="hidden lg:table-row bg-muted/30">
          <td colSpan={8} className="px-4 py-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-caption font-semibold text-text-primary mb-3">
                  Booking Details
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon
                      name="UserIcon"
                      variant="outline"
                      size={16}
                      className="text-text-secondary"
                    />
                    <span className="text-sm text-text-secondary">Guests:</span>
                    <span className="text-sm font-caption font-medium text-text-primary">
                      {booking.guests}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon
                      name="CalendarIcon"
                      variant="outline"
                      size={16}
                      className="text-text-secondary"
                    />
                    <span className="text-sm text-text-secondary">
                      Booked on:
                    </span>
                    <span className="text-sm font-caption font-medium text-text-primary">
                      {formatDate(booking.bookingDate)}
                    </span>
                  </div>
                  {booking.statusUpdatedAt && booking.status !== 'pending' && (
                    <div className="flex items-center gap-2">
                      <Icon
                        name="ClockIcon"
                        variant="outline"
                        size={16}
                        className="text-text-secondary"
                      />
                      <span className="text-sm text-text-secondary">
                        {booking.status === 'confirmed' ? 'Confirmed at:' : 'Cancelled at:'}
                      </span>
                      <span className="text-sm font-caption font-medium text-text-primary">
                        {new Date(booking.statusUpdatedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {booking.specialRequests && (
                <div>
                  <h4 className="font-caption font-semibold text-text-primary mb-3">
                    Special Requests
                  </h4>
                  <p className="text-sm text-text-secondary">
                    {booking.specialRequests}
                  </p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}

      {/* Expanded Details (Mobile) */}
      {isExpanded && (
        <div className="lg:hidden bg-muted/30 border border-border rounded-lg p-4 mb-4">
          <h4 className="font-caption font-semibold text-text-primary mb-3">
            Additional Details
          </h4>
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2">
              <Icon
                name="UserIcon"
                variant="outline"
                size={16}
                className="text-text-secondary"
              />
              <span className="text-sm text-text-secondary">Guests:</span>
              <span className="text-sm font-caption font-medium text-text-primary">
                {booking.guests}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Icon
                name="CalendarIcon"
                variant="outline"
                size={16}
                className="text-text-secondary"
              />
              <span className="text-sm text-text-secondary">Booked on:</span>
              <span className="text-sm font-caption font-medium text-text-primary">
                {formatDate(booking.bookingDate)}
              </span>
            </div>
            {booking.statusUpdatedAt && booking.status !== 'pending' && (
              <div className="flex items-center gap-2">
                <Icon
                  name="ClockIcon"
                  variant="outline"
                  size={16}
                  className="text-text-secondary"
                />
                <span className="text-sm text-text-secondary">
                  {booking.status === 'confirmed' ? 'Confirmed at:' : 'Cancelled at:'}
                </span>
                <span className="text-sm font-caption font-medium text-text-primary">
                  {new Date(booking.statusUpdatedAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>
          {booking.specialRequests && (
            <div>
              <h5 className="font-caption font-semibold text-text-primary mb-2 text-sm">
                Special Requests
              </h5>
              <p className="text-sm text-text-secondary">
                {booking.specialRequests}
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default BookingTableRow;