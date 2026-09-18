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
}

interface BookingEditModalProps {
  booking: Booking;
  onSave: (booking: Booking) => void;
  onClose: () => void;
}

const BookingEditModal = ({ booking, onSave, onClose }: BookingEditModalProps) => {
  const [formData, setFormData] = useState<Booking>(booking);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: keyof Booking, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card rounded-lg border border-border shadow-hospitality-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-heading font-semibold text-2xl text-text-primary">
            Uredi rezervacijo
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                ID rezervacije
              </label>
              <input
                type="text"
                value={formData.id}
                disabled
                className="w-full px-4 py-2.5 bg-muted border border-input rounded-md text-text-secondary cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
              >
                <option value="pending">V obdelavi</option>
                <option value="confirmed">Potrjeno</option>
                <option value="cancelled">Preklicano</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                Ime gosta
              </label>
              <input
                type="text"
                value={formData.guestName}
                onChange={(e) => handleChange('guestName', e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                E-pošta gosta
              </label>
              <input
                type="email"
                value={formData.guestEmail}
                onChange={(e) => handleChange('guestEmail', e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
              Nastanitev
            </label>
            <select
              value={formData.accommodation}
              onChange={(e) => handleChange('accommodation', e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
            >
              <option value="Deluxe Ocean View Suite">Deluxe Ocean View Suite</option>
              <option value="Garden View Room">Garden View Room</option>
              <option value="Family Suite">Family Suite</option>
              <option value="Standard Room">Standard Room</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                Datum prijave
              </label>
              <input
                type="date"
                value={formData.checkIn}
                onChange={(e) => handleChange('checkIn', e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                Datum odjave
              </label>
              <input
                type="date"
                value={formData.checkOut}
                onChange={(e) => handleChange('checkOut', e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                Število gostov
              </label>
              <input
                type="number"
                min="1"
                value={formData.guests}
                onChange={(e) => handleChange('guests', parseInt(e.target.value))}
                className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                Skupni znesek
              </label>
              <input
                type="text"
                value={formData.totalAmount}
                onChange={(e) => handleChange('totalAmount', e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
              Posebne zahteve
            </label>
            <textarea
              value={formData.specialRequests || ''}
              onChange={(e) => handleChange('specialRequests', e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth resize-none"
              placeholder="Morebitne posebne zahteve ali opombe..."
            />
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
              className="px-6 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth font-caption font-medium"
            >
              Shrani spremembe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingEditModal;