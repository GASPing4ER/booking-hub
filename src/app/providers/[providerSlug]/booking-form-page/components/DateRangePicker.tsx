'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface DateRangePickerProps {
  checkInDate: string;
  checkOutDate: string;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
  unavailableDates: string[];
  minStayNights: number;
}

const DateRangePicker = ({
  checkInDate,
  checkOutDate,
  onCheckInChange,
  onCheckOutChange,
  unavailableDates,
  minStayNights,
}: DateRangePickerProps) => {
  const [checkInError, setCheckInError] = useState('');
  const [checkOutError, setCheckOutError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    setCheckInError('');

    if (unavailableDates.includes(selectedDate)) {
      setCheckInError('Ta datum ni na voljo');
      return;
    }

    onCheckInChange(selectedDate);

    // Auto-adjust checkout if needed
    if (checkOutDate && selectedDate >= checkOutDate) {
      const newCheckOut = new Date(selectedDate);
      newCheckOut.setDate(newCheckOut.getDate() + minStayNights);
      onCheckOutChange(newCheckOut.toISOString().split('T')[0]);
    }
  };

  const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    setCheckOutError('');

    if (unavailableDates.includes(selectedDate)) {
      setCheckOutError('Ta datum ni na voljo');
      return;
    }

    if (checkInDate && selectedDate <= checkInDate) {
      setCheckOutError('Odjava mora biti po prijavi');
      return;
    }

    // Validate minimum stay
    if (checkInDate) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(selectedDate);
      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (nights < minStayNights) {
        setCheckOutError(`Najkrajše bivanje je ${minStayNights} noči`);
        return;
      }
    }

    onCheckOutChange(selectedDate);
  };

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    return Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const nights = calculateNights();

  return (
    <div className="space-y-4">
      {/* Check-in Date */}
      <div>
        <label
          htmlFor="checkInDate"
          className="block font-caption font-medium text-text-primary mb-2"
        >
          Datum prijave <span className="text-error">*</span>
        </label>
        <div className="relative">
          <input
            type="date"
            id="checkInDate"
            value={checkInDate}
            onChange={handleCheckInChange}
            min={today}
            required
            className={`
              w-full px-4 py-3 pr-12 rounded-md border transition-smooth
              font-caption text-text-primary
              ${
                checkInError
                  ? 'border-error focus:ring-error' :'border-input focus:border-primary focus:ring-2 focus:ring-primary/20'
              }
              bg-card
            `}
          />
          <Icon
            name="CalendarIcon"
            variant="outline"
            size={20}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
          />
        </div>
        {checkInError && (
          <p className="caption text-error mt-1 flex items-center gap-1">
            <Icon name="ExclamationCircleIcon" variant="solid" size={16} />
            {checkInError}
          </p>
        )}
      </div>

      {/* Check-out Date */}
      <div>
        <label
          htmlFor="checkOutDate"
          className="block font-caption font-medium text-text-primary mb-2"
        >
          Datum odjave <span className="text-error">*</span>
        </label>
        <div className="relative">
          <input
            type="date"
            id="checkOutDate"
            value={checkOutDate}
            onChange={handleCheckOutChange}
            min={checkInDate || today}
            required
            disabled={!checkInDate}
            className={`
              w-full px-4 py-3 pr-12 rounded-md border transition-smooth
              font-caption text-text-primary
              ${
                checkOutError
                  ? 'border-error focus:ring-error' :'border-input focus:border-primary focus:ring-2 focus:ring-primary/20'
              }
              bg-card disabled:opacity-50 disabled:cursor-not-allowed
            `}
          />
          <Icon
            name="CalendarIcon"
            variant="outline"
            size={20}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
          />
        </div>
        {checkOutError && (
          <p className="caption text-error mt-1 flex items-center gap-1">
            <Icon name="ExclamationCircleIcon" variant="solid" size={16} />
            {checkOutError}
          </p>
        )}
      </div>

      {/* Nights Summary */}
      {nights > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
          <Icon
            name="MoonIcon"
            variant="solid"
            size={20}
            className="text-primary"
          />
          <span className="font-caption text-text-primary">
            <strong>{nights}</strong> {nights === 1 ? 'noč' : 'noči'}
          </span>
        </div>
      )}

      {/* Minimum Stay Notice */}
      <div className="flex items-start gap-2 p-3 bg-accent/10 rounded-md">
        <Icon
          name="InformationCircleIcon"
          variant="solid"
          size={20}
          className="text-accent flex-shrink-0 mt-0.5"
        />
        <p className="caption text-text-secondary">
          Najkrajše bivanje: {minStayNights}{' '}
          {minStayNights === 1 ? 'noč' : 'noči'}
        </p>
      </div>
    </div>
  );
};

export default DateRangePicker;