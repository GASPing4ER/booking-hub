'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

interface BookingDetails {
  bookingId: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  total: string;
  guestName: string;
  guestEmail: string;
}

function BookingConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const routeParams = useParams<{ providerSlug?: string | string[] }>();
  const rawSlug = routeParams?.providerSlug;
  const providerSlug =
    (Array.isArray(rawSlug) ? rawSlug[0] : rawSlug)?.trim() || 'default';
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const bookingId = searchParams.get('bookingId');
    const propertyName = searchParams.get('propertyName');
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const guests = searchParams.get('guests');
    const total = searchParams.get('total');
    const guestName = searchParams.get('guestName');
    const guestEmail = searchParams.get('guestEmail');

    if (!bookingId || !propertyName || !checkIn || !checkOut) {
      router.push(`/providers/${encodeURIComponent(providerSlug)}/booking-form-page`);
      return;
    }

    const bookingData: BookingDetails = {
      bookingId: bookingId || '',
      propertyName: propertyName || '',
      checkIn: checkIn || '',
      checkOut: checkOut || '',
      guests: guests || '1',
      total: total || '0',
      guestName: guestName || '',
      guestEmail: guestEmail || '',
    };

    setBooking(bookingData);

    // Send confirmation email via Resend edge function
    if (bookingId && guestEmail && propertyName && checkIn && checkOut) {
      sendConfirmationEmail(bookingData);
    }
  }, [searchParams, router, providerSlug]);

  const sendConfirmationEmail = async (bookingData: BookingDetails) => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) return;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/send-booking-confirmation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            guestEmail: bookingData.guestEmail,
            guestName: bookingData.guestName,
            bookingId: bookingData.bookingId,
            propertyName: bookingData.propertyName,
            checkIn: bookingData.checkIn,
            checkOut: bookingData.checkOut,
            guests: bookingData.guests,
            totalAmount: bookingData.total,
          }),
        }
      );

      if (response.ok) {
        setEmailSent(true);
      }
    } catch {
      // Email sending failed silently - booking is still confirmed
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getNights = () => {
    if (!booking?.checkIn || !booking?.checkOut) return 0;
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleAddToCalendar = () => {
    if (!booking) return;

    const title = encodeURIComponent(`Stay at ${booking.propertyName}`);
    const startDate = booking.checkIn.replace(/-/g, '');
    const endDate = booking.checkOut.replace(/-/g, '');
    const details = encodeURIComponent(
      `Booking ID: ${booking.bookingId}\nGuests: ${booking.guests}\nTotal: $${parseFloat(booking.total).toFixed(2)}`
    );
    const location = encodeURIComponent(booking.propertyName);

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
    window.open(googleCalendarUrl, '_blank', 'noopener,noreferrer');
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const nights = getNights();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="CheckCircleIcon" variant="solid" size={48} className="text-success" />
          </div>
          <h1 className="font-heading font-bold text-3xl text-text-primary mb-2">
            Booking Confirmed!
          </h1>
          {booking.guestName && (
            <p className="font-caption text-text-secondary text-base">
              Thank you, <span className="font-semibold text-text-primary">{booking.guestName}</span>!
              {booking.guestEmail && (
                <> We{emailSent ? "'ve sent a confirmation to" : "'ll be in touch at"} <span className="font-semibold text-text-primary">{booking.guestEmail}</span>.</>
              )}
            </p>
          )}
          {emailSent && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-success/10 rounded-full">
              <Icon name="EnvelopeIcon" variant="outline" size={14} className="text-success" />
              <span className="font-caption text-xs text-success font-medium">Confirmation email sent</span>
            </div>
          )}
        </div>

        {/* Booking Card */}
        <div className="bg-card rounded-xl border border-border shadow-hospitality overflow-hidden mb-6">
          {/* Booking ID Banner */}
          <div className="bg-primary/5 border-b border-border px-6 py-4 flex items-center justify-between">
            <div>
              <p className="font-caption text-xs text-text-secondary uppercase tracking-wide mb-1">Booking Reference</p>
              <p className="font-heading font-bold text-lg text-primary tracking-wider">
                #{booking.bookingId.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon name="TicketIcon" variant="outline" size={20} className="text-primary" />
            </div>
          </div>

          {/* Booking Details */}
          <div className="px-6 py-5 space-y-4">
            {/* Property */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon name="BuildingOfficeIcon" variant="outline" size={16} className="text-text-secondary" />
              </div>
              <div>
                <p className="font-caption text-xs text-text-secondary uppercase tracking-wide">Property</p>
                <p className="font-heading font-semibold text-text-primary">{booking.propertyName}</p>
              </div>
            </div>

            {/* Dates */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon name="CalendarDaysIcon" variant="outline" size={16} className="text-text-secondary" />
              </div>
              <div className="flex-1">
                <p className="font-caption text-xs text-text-secondary uppercase tracking-wide mb-1">Dates</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="font-caption text-xs text-text-secondary">Check-in</p>
                    <p className="font-caption font-medium text-text-primary text-sm">{formatDate(booking.checkIn)}</p>
                  </div>
                  <div>
                    <p className="font-caption text-xs text-text-secondary">Check-out</p>
                    <p className="font-caption font-medium text-text-primary text-sm">{formatDate(booking.checkOut)}</p>
                  </div>
                </div>
                <p className="font-caption text-xs text-text-secondary mt-1">
                  {nights} {nights === 1 ? 'night' : 'nights'}
                </p>
              </div>
            </div>

            {/* Guests */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon name="UsersIcon" variant="outline" size={16} className="text-text-secondary" />
              </div>
              <div>
                <p className="font-caption text-xs text-text-secondary uppercase tracking-wide">Guests</p>
                <p className="font-heading font-semibold text-text-primary">
                  {booking.guests} {parseInt(booking.guests) === 1 ? 'guest' : 'guests'}
                </p>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-start gap-3 pt-3 border-t border-border">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon name="CurrencyDollarIcon" variant="outline" size={16} className="text-primary" />
              </div>
              <div>
                <p className="font-caption text-xs text-text-secondary uppercase tracking-wide">Total Amount</p>
                <p className="font-heading font-bold text-2xl text-primary">
                  ${parseFloat(booking.total).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleAddToCalendar}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-caption font-medium hover:bg-primary/90 transition-smooth"
          >
            <Icon name="CalendarDaysIcon" variant="outline" size={20} />
            Add to Google Calendar
          </button>

          <Link
            href="/my-booking"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-card border border-border text-text-primary rounded-lg font-caption font-medium hover:bg-muted transition-smooth"
          >
            <Icon name="MagnifyingGlassIcon" variant="outline" size={20} />
            Look Up My Booking
          </Link>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-card border border-border text-text-primary rounded-lg font-caption font-medium hover:bg-muted transition-smooth"
          >
            <Icon name="HomeIcon" variant="outline" size={20} />
            Back to Home
          </Link>
        </div>

        {/* Status Note */}
        <p className="text-center font-caption text-xs text-text-secondary mt-6">
          Your booking is pending confirmation. We'll review and confirm your reservation shortly.
        </p>
      </div>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BookingConfirmationContent />
    </Suspense>
  );
}
