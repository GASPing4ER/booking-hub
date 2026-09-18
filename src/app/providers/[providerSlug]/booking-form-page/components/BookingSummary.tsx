import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface BookingSummaryProps {
  accommodation: {
    name: string;
    capacity: number;
    pricePerNight: number;
  } | null;
  checkInDate: string;
  checkOutDate: string;
  guestName: string;
  guestEmail: string;
}

const BookingSummary = ({
  accommodation,
  checkInDate,
  checkOutDate,
  guestName,
  guestEmail,
}: BookingSummaryProps) => {
  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    return Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('sl-SI', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const nights = calculateNights();
  const subtotal = accommodation ? accommodation.pricePerNight * nights : 0;
  const serviceFee = subtotal * 0.1; // 10% service fee
  const total = subtotal + serviceFee;

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-hospitality sticky top-4">
      <h3 className="font-heading font-semibold text-xl text-text-primary mb-4">
        Povzetek rezervacije
      </h3>

      {/* Accommodation Details */}
      {accommodation ? (
        <div className="mb-4 pb-4 border-b border-border">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-caption font-medium text-text-primary">
                {accommodation.name}
              </p>
              <p className="caption text-text-secondary">
                Do {accommodation.capacity} gostov
              </p>
            </div>
            <Icon
              name="CheckCircleIcon"
              variant="solid"
              size={24}
              className="text-success"
            />
          </div>
        </div>
      ) : (
        <div className="mb-4 pb-4 border-b border-border">
          <p className="caption text-text-secondary italic">
            Nastanitev ni izbrana
          </p>
        </div>
      )}

      {/* Date Details */}
      <div className="space-y-3 mb-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Icon
            name="CalendarIcon"
            variant="outline"
            size={20}
            className="text-text-secondary"
          />
          <div>
            <p className="caption text-text-secondary">Prijava</p>
            <p className="font-caption font-medium text-text-primary">
              {checkInDate ? formatDate(checkInDate) : 'Ni izbrano'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Icon
            name="CalendarIcon"
            variant="outline"
            size={20}
            className="text-text-secondary"
          />
          <div>
            <p className="caption text-text-secondary">Odjava</p>
            <p className="font-caption font-medium text-text-primary">
              {checkOutDate ? formatDate(checkOutDate) : 'Ni izbrano'}
            </p>
          </div>
        </div>
        {nights > 0 && (
          <div className="flex items-center gap-3">
            <Icon
              name="MoonIcon"
              variant="solid"
              size={20}
              className="text-primary"
            />
            <p className="font-caption text-text-primary">
              <strong>{nights}</strong> {nights === 1 ? 'noč' : 'noči'}
            </p>
          </div>
        )}
      </div>

      {/* Guest Details */}
      {(guestName || guestEmail) && (
        <div className="mb-4 pb-4 border-b border-border">
          <p className="caption text-text-secondary mb-2">Podatki o gostu</p>
          {guestName && (
            <p className="font-caption text-text-primary mb-1">{guestName}</p>
          )}
          {guestEmail && (
            <p className="caption text-text-secondary">{guestEmail}</p>
          )}
        </div>
      )}

      {/* Price Breakdown */}
      {accommodation && nights > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="caption text-text-secondary">
              ${accommodation.pricePerNight} × {nights}{' '}
              {nights === 1 ? 'noč' : 'noči'}
            </p>
            <p className="font-caption text-text-primary">
              ${subtotal.toFixed(2)}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="caption text-text-secondary">Strošek storitve (10%)</p>
            <p className="font-caption text-text-primary">
              ${serviceFee.toFixed(2)}
            </p>
          </div>
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <p className="font-heading font-semibold text-lg text-text-primary">
              Skupaj
            </p>
            <p className="font-heading font-semibold text-xl text-primary">
              ${total.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Info Notice */}
      <div className="mt-4 p-3 bg-accent/10 rounded-md">
        <div className="flex items-start gap-2">
          <Icon
            name="InformationCircleIcon"
            variant="solid"
            size={20}
            className="text-accent flex-shrink-0 mt-0.5"
          />
          <p className="caption text-text-secondary">
            Vašo zahtevo za rezervacijo bo pregledal lastnik nepremičnine. Ko bo odobrena, boste prejeli potrditveno e-pošto.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingSummary;