'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AccommodationCard from './AccommodationCard';
import DateRangePicker from './DateRangePicker';
import GuestInformationForm from './GuestInformationForm';
import BookingSummary from './BookingSummary';
import Icon from '@/components/ui/AppIcon';
import PublicNavHeader from '@/components/common/PublicNavHeader';
import { createClient } from '@/lib/supabase/client';
import { slugifyPropertyLabel } from '@/lib/propertySlug';
import { getPropertyImageUrls } from '@/lib/propertyImages';

interface Accommodation {
  id: string;
  slug: string;
  name: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  image: string;
  alt: string;
  amenities: string[];
}

type BookingFormInteractiveProps = {
  providerSlug: string;
  initialAccommodationId?: string | null;
};

const BookingFormInteractive = ({
  providerSlug,
  initialAccommodationId = null,
}: BookingFormInteractiveProps) => {
  const router = useRouter();
  const supabase = createClient();
  const storefrontLookupSlug =
    slugifyPropertyLabel(providerSlug.trim()) || providerSlug.trim();
  const [isHydrated, setIsHydrated] = useState(false);

  const [selectedAccommodation, setSelectedAccommodation] =
    useState<Accommodation | null>(null);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [guestCount, setGuestCount] = useState(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    fetchAccommodations();
  }, [isHydrated, providerSlug]);

  useEffect(() => {
    if (selectedAccommodation) {
      fetchUnavailableDates(selectedAccommodation.id);
      // Reset guest count to 1 when accommodation changes
      setGuestCount(1);
    }
  }, [selectedAccommodation]);

  useEffect(() => {
    if (!initialAccommodationId || accommodations.length === 0) return;
    const preset = accommodations.find(
      (a) =>
        a.id === initialAccommodationId || a.slug === initialAccommodationId
    );
    if (preset) setSelectedAccommodation(preset);
  }, [initialAccommodationId, accommodations]);

  const fetchAccommodations = async () => {
    try {
      setLoading(true);

      const { data: ownerProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('slug', storefrontLookupSlug)
        .maybeSingle();

      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'available')
        .order('name');

      if (ownerProfile?.id) {
        query = query.eq('owner_id', ownerProfile.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedAccommodations: Accommodation[] = (data || []).map((prop: any) => ({
        id: prop.id,
        slug: prop.slug?.trim() || prop.id,
        name: prop.name,
        description: prop.description,
        capacity: prop.capacity,
        pricePerNight: parseFloat(prop.price_per_night),
        image: getPropertyImageUrls(prop.image_urls, prop.image_url)[0] || '',
        alt: `${prop.name} - ${prop.description}`,
        amenities: prop.amenities || [],
      }));

      setAccommodations(formattedAccommodations);
    } catch (error: any) {
      console.error('Error fetching accommodations:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnavailableDates = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from('availability')
        .select('date')
        .eq('property_id', propertyId)
        .in('status', ['unavailable', 'booked'])
        .gte('date', new Date().toISOString().split('T')[0]);

      if (error) throw error;

      const dates = (data || []).map((item: any) => item.date);
      setUnavailableDates(dates);
    } catch (error: any) {
      console.error('Error fetching unavailable dates:', error.message);
    }
  };

  const minStayNights = 2;

  const validateForm = () => {
    if (!selectedAccommodation) {
      setFormError('Please select an accommodation');
      return false;
    }

    if (!checkInDate || !checkOutDate) {
      setFormError('Please select check-in and check-out dates');
      return false;
    }

    if (!guestName || guestName.length < 2) {
      setFormError('Please enter a valid name (at least 2 characters)');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!guestEmail || !emailRegex.test(guestEmail)) {
      setFormError('Please enter a valid email address');
      return false;
    }

    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!guestPhone || !phoneRegex.test(guestPhone)) {
      setFormError('Please enter a valid phone number');
      return false;
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const currentDate = new Date(checkIn);

    while (currentDate < checkOut) {
      const dateString = currentDate.toISOString().split('T')[0];
      if (unavailableDates.includes(dateString)) {
        setFormError(
          'Selected dates include unavailable periods. Please choose different dates.'
        );
        return false;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );
      const totalAmount = nights * (selectedAccommodation?.pricePerNight || 0);

      // Build the list of dates this booking will occupy
      const bookingDates: string[] = [];
      const currentDate = new Date(checkIn);
      while (currentDate < checkOut) {
        bookingDates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Double-booking prevention: check for existing booked/unavailable dates
      const { data: conflictData, error: conflictError } = await supabase
        .from('availability')
        .select('date')
        .eq('property_id', selectedAccommodation?.id)
        .in('status', ['booked', 'unavailable'])
        .in('date', bookingDates);

      if (conflictError) throw conflictError;

      if (conflictData && conflictData.length > 0) {
        const conflictDates = conflictData.map((d: any) => d.date).join(', ');
        setFormError(
          `These dates are no longer available: ${conflictDates}. Please choose different dates.`
        );
        setIsSubmitting(false);
        return;
      }

      // Insert booking and use the returned data directly (no re-fetch needed)
      const { data: insertedBookings, error } = await supabase
        .from('bookings')
        .insert({
          property_id: selectedAccommodation?.id,
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone,
          check_in: checkInDate,
          check_out: checkOutDate,
          guests: guestCount,
          status: 'pending',
          total_amount: totalAmount,
          special_requests: specialRequests || null,
        })
        .select('id')
        .single();

      if (error) throw error;

      const bookingId = insertedBookings?.id || crypto.randomUUID();

      // Mark dates as booked in availability
      const availabilityRows = bookingDates.map((date) => ({
        property_id: selectedAccommodation?.id,
        date,
        status: 'booked',
      }));

      await supabase
        .from('availability')
        .upsert(availabilityRows, { onConflict: 'property_id,date' });

      const params = new URLSearchParams({
        bookingId,
        propertyName: selectedAccommodation?.name || '',
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: String(guestCount),
        total: totalAmount.toFixed(2),
        guestName,
        guestEmail,
      });

      router.push(
        `/providers/${encodeURIComponent(providerSlug)}/booking-confirmation?${params.toString()}`
      );
    } catch (error: any) {
      console.error('Error submitting booking:', error.message);
      setFormError('Failed to submit booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-caption text-text-secondary">Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNavHeader />
      <form onSubmit={handleSubmit}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form Section */}
            <div className="lg:col-span-2 space-y-8">
              {/* Step 1: Select Accommodation */}
              <section className="bg-card rounded-lg p-6 shadow-hospitality">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <span className="font-caption font-semibold text-primary-foreground">
                      1
                    </span>
                  </div>
                  <h2 className="font-heading font-semibold text-2xl text-text-primary">
                    Select Accommodation
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {accommodations.map((accommodation) => (
                    <AccommodationCard
                      key={accommodation.id}
                      accommodation={accommodation}
                      isSelected={selectedAccommodation?.id === accommodation.id}
                      onSelect={() => setSelectedAccommodation(accommodation)} />
                  ))}
                </div>
              </section>

              {/* Step 2: Select Dates */}
              <section className="bg-card rounded-lg p-6 shadow-hospitality">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <span className="font-caption font-semibold text-primary-foreground">
                      2
                    </span>
                  </div>
                  <h2 className="font-heading font-semibold text-2xl text-text-primary">
                    Select Dates
                  </h2>
                </div>

                <DateRangePicker
                  checkInDate={checkInDate}
                  checkOutDate={checkOutDate}
                  onCheckInChange={setCheckInDate}
                  onCheckOutChange={setCheckOutDate}
                  unavailableDates={unavailableDates}
                  minStayNights={minStayNights} />
              </section>

              {/* Step 3: Guest Count */}
              {selectedAccommodation && (
                <section className="bg-card rounded-lg p-6 shadow-hospitality">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <span className="font-caption font-semibold text-primary-foreground">
                        3
                      </span>
                    </div>
                    <h2 className="font-heading font-semibold text-2xl text-text-primary">
                      Number of Guests
                    </h2>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="font-caption text-text-secondary text-sm">
                      Guests (max {selectedAccommodation.capacity})
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
                        disabled={guestCount <= 1}
                        className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-text-primary hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-smooth"
                      >
                        <Icon name="MinusIcon" variant="outline" size={16} />
                      </button>
                      <span className="w-8 text-center font-heading font-semibold text-xl text-text-primary">
                        {guestCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setGuestCount((c) => Math.min(selectedAccommodation.capacity, c + 1))}
                        disabled={guestCount >= selectedAccommodation.capacity}
                        className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-text-primary hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-smooth"
                      >
                        <Icon name="PlusIcon" variant="outline" size={16} />
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* Step 4: Guest Information */}
              <section className="bg-card rounded-lg p-6 shadow-hospitality">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <span className="font-caption font-semibold text-primary-foreground">
                      {selectedAccommodation ? '4' : '3'}
                    </span>
                  </div>
                  <h2 className="font-heading font-semibold text-2xl text-text-primary">
                    Guest Information
                  </h2>
                </div>

                <GuestInformationForm
                  guestName={guestName}
                  guestEmail={guestEmail}
                  guestPhone={guestPhone}
                  specialRequests={specialRequests}
                  onGuestNameChange={setGuestName}
                  onGuestEmailChange={setGuestEmail}
                  onGuestPhoneChange={setGuestPhone}
                  onSpecialRequestsChange={setSpecialRequests} />
              </section>

              {/* Error Message */}
              {formError && (
                <div className="bg-error/10 border border-error rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Icon
                      name="ExclamationTriangleIcon"
                      variant="solid"
                      size={24}
                      className="text-error flex-shrink-0" />
                    <div>
                      <p className="font-caption font-medium text-error mb-1">
                        Unable to Submit Booking
                      </p>
                      <p className="caption text-error/80">{formError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button - Mobile */}
              <div className="lg:hidden">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-md font-caption font-medium transition-smooth hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Submit Booking Request
                      <Icon name="ArrowRightIcon" variant="outline" size={20} />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sidebar - Summary & Submit */}
            <div className="lg:col-span-1">
              <BookingSummary
                accommodation={selectedAccommodation}
                checkInDate={checkInDate}
                checkOutDate={checkOutDate}
                guestName={guestName}
                guestEmail={guestEmail} />

              {/* Submit Button - Desktop */}
              <div className="hidden lg:block mt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-md font-caption font-medium transition-smooth hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Submit Booking Request
                      <Icon name="ArrowRightIcon" variant="outline" size={20} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BookingFormInteractive;