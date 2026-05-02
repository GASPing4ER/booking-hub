'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface GuestInformationFormProps {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests: string;
  onGuestNameChange: (value: string) => void;
  onGuestEmailChange: (value: string) => void;
  onGuestPhoneChange: (value: string) => void;
  onSpecialRequestsChange: (value: string) => void;
}

const GuestInformationForm = ({
  guestName,
  guestEmail,
  guestPhone,
  specialRequests,
  onGuestNameChange,
  onGuestEmailChange,
  onGuestPhoneChange,
  onSpecialRequestsChange,
}: GuestInformationFormProps) => {
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNameError('');

    if (value.length > 0 && value.length < 2) {
      setNameError('Name must be at least 2 characters');
    }

    onGuestNameChange(value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmailError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value.length > 0 && !emailRegex.test(value)) {
      setEmailError('Please enter a valid email address');
    }

    onGuestEmailChange(value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneError('');

    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (value.length > 0 && !phoneRegex.test(value)) {
      setPhoneError('Please enter a valid phone number');
    }

    onGuestPhoneChange(value);
  };

  return (
    <div className="space-y-4">
      {/* Guest Name */}
      <div>
        <label
          htmlFor="guestName"
          className="block font-caption font-medium text-text-primary mb-2"
        >
          Full Name <span className="text-error">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            id="guestName"
            value={guestName}
            onChange={handleNameChange}
            placeholder="John Doe"
            required
            className={`
              w-full px-4 py-3 pr-12 rounded-md border transition-smooth
              font-caption text-text-primary placeholder:text-text-secondary/50
              ${
                nameError
                  ? 'border-error focus:ring-error' :'border-input focus:border-primary focus:ring-2 focus:ring-primary/20'
              }
              bg-card
            `}
          />
          <Icon
            name="UserIcon"
            variant="outline"
            size={20}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
          />
        </div>
        {nameError && (
          <p className="caption text-error mt-1 flex items-center gap-1">
            <Icon name="ExclamationCircleIcon" variant="solid" size={16} />
            {nameError}
          </p>
        )}
      </div>

      {/* Guest Email */}
      <div>
        <label
          htmlFor="guestEmail"
          className="block font-caption font-medium text-text-primary mb-2"
        >
          Email Address <span className="text-error">*</span>
        </label>
        <div className="relative">
          <input
            type="email"
            id="guestEmail"
            value={guestEmail}
            onChange={handleEmailChange}
            placeholder="john.doe@example.com"
            required
            className={`
              w-full px-4 py-3 pr-12 rounded-md border transition-smooth
              font-caption text-text-primary placeholder:text-text-secondary/50
              ${
                emailError
                  ? 'border-error focus:ring-error' :'border-input focus:border-primary focus:ring-2 focus:ring-primary/20'
              }
              bg-card
            `}
          />
          <Icon
            name="EnvelopeIcon"
            variant="outline"
            size={20}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
          />
        </div>
        {emailError && (
          <p className="caption text-error mt-1 flex items-center gap-1">
            <Icon name="ExclamationCircleIcon" variant="solid" size={16} />
            {emailError}
          </p>
        )}
      </div>

      {/* Guest Phone */}
      <div>
        <label
          htmlFor="guestPhone"
          className="block font-caption font-medium text-text-primary mb-2"
        >
          Phone Number <span className="text-error">*</span>
        </label>
        <div className="relative">
          <input
            type="tel"
            id="guestPhone"
            value={guestPhone}
            onChange={handlePhoneChange}
            placeholder="+1 (555) 123-4567"
            required
            className={`
              w-full px-4 py-3 pr-12 rounded-md border transition-smooth
              font-caption text-text-primary placeholder:text-text-secondary/50
              ${
                phoneError
                  ? 'border-error focus:ring-error' :'border-input focus:border-primary focus:ring-2 focus:ring-primary/20'
              }
              bg-card
            `}
          />
          <Icon
            name="PhoneIcon"
            variant="outline"
            size={20}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
          />
        </div>
        {phoneError && (
          <p className="caption text-error mt-1 flex items-center gap-1">
            <Icon name="ExclamationCircleIcon" variant="solid" size={16} />
            {phoneError}
          </p>
        )}
      </div>

      {/* Special Requests */}
      <div>
        <label
          htmlFor="specialRequests"
          className="block font-caption font-medium text-text-primary mb-2"
        >
          Special Requests <span className="caption text-text-secondary">(Optional)</span>
        </label>
        <textarea
          id="specialRequests"
          value={specialRequests}
          onChange={(e) => onSpecialRequestsChange(e.target.value)}
          placeholder="Any special requirements or requests for your stay..."
          rows={4}
          maxLength={500}
          className="
            w-full px-4 py-3 rounded-md border border-input transition-smooth
            font-caption text-text-primary placeholder:text-text-secondary/50
            focus:border-primary focus:ring-2 focus:ring-primary/20
            bg-card resize-none
          "
        />
        <p className="caption text-text-secondary mt-1 text-right">
          {specialRequests.length}/500 characters
        </p>
      </div>
    </div>
  );
};

export default GuestInformationForm;