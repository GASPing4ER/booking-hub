'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import PublicNavHeader from '@/components/common/PublicNavHeader';

interface BookingResult {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  total_amount: string;
  special_requests: string | null;
  created_at: string;
  properties: { name: string } | null;
}

export default function MyBookingInteractive() {
  const [email, setEmail] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<BookingResult | null>(null);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const supabase = createClient();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBooking(null);
    setLoading(true);
    setSearched(false);

    try {
      // Clean the booking ref - remove # prefix if present
      const cleanRef = bookingRef.replace(/^#/, '').trim().toLowerCase();

      // Search by email and booking ID prefix (first 8 chars)
      const { data, error: queryError } = await supabase
        .from('bookings')
        .select(`
          id,
          guest_name,
          guest_email,
          guest_phone,
          check_in,
          check_out,
          guests,
          status,
          total_amount,
          special_requests,
          created_at,
          properties (name)
        `)
        .eq('guest_email', email.toLowerCase().trim())
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      // Find matching booking by ID prefix
      const matched = (data || []).find(
        (b: any) => b.id.slice(0, 8).toLowerCase() === cleanRef
      );

      setSearched(true);

      if (matched) {
        setBooking(matched as BookingResult);
      } else {
        setError('No booking found with that email and reference number. Please check your details and try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to look up booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;
    setCancelling(true);
    setCancelError('');
    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking.id)
        .eq('guest_email', booking.guest_email);
      if (updateError) throw updateError;
      setBooking({ ...booking, status: 'cancelled' });
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel booking. Please try again.');
    } finally {
      setCancelling(false);
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

  const getNights = (checkIn: string, checkOut: string) => {
    return Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-success/10 text-success';
      case 'pending': return 'bg-yellow-50 text-yellow-700';
      case 'cancelled': return 'bg-error/10 text-error';
      default: return 'bg-muted text-text-secondary';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicNavHeader />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="MagnifyingGlassIcon" variant="outline" size={32} className="text-primary" />
          </div>
          <h1 className="font-heading font-bold text-3xl text-text-primary mb-2">Find My Booking</h1>
          <p className="text-text-secondary">Enter your email and booking reference to view your reservation details</p>
        </div>

        {/* Search Form */}
        <div className="bg-card rounded-xl border border-border shadow-hospitality p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm placeholder-gray-400"
                placeholder="The email you used when booking"
              />
            </div>

            <div>
              <label htmlFor="bookingRef" className="block text-sm font-medium text-text-primary mb-1.5">
                Booking Reference
              </label>
              <input
                id="bookingRef"
                type="text"
                value={bookingRef}
                onChange={(e) => setBookingRef(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm placeholder-gray-400 uppercase"
                placeholder="e.g. A1B2C3D4 (first 8 characters of your booking ID)"
                maxLength={8}
              />
              <p className="text-xs text-text-secondary mt-1">Found in your booking confirmation email</p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <Icon name="ExclamationCircleIcon" variant="solid" size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-semibold py-3 px-6 rounded-lg hover:bg-primary-dark transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <Icon name="MagnifyingGlassIcon" variant="outline" size={18} />
                  Find My Booking
                </>
              )}
            </button>
          </form>
        </div>

        {/* Booking Result */}
        {booking && (
          <div className="bg-card rounded-xl border border-border shadow-hospitality overflow-hidden">
            {/* Header */}
            <div className="bg-primary/5 border-b border-border px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-caption text-xs text-text-secondary uppercase tracking-wide mb-1">Booking Reference</p>
                <p className="font-heading font-bold text-lg text-primary tracking-wider">
                  #{booking.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-caption font-semibold capitalize ${getStatusColor(booking.status)}`}>
                {booking.status}
              </span>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Property */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon name="BuildingOfficeIcon" variant="outline" size={16} className="text-text-secondary" />
                </div>
                <div>
                  <p className="font-caption text-xs text-text-secondary uppercase tracking-wide">Property</p>
                  <p className="font-heading font-semibold text-text-primary">{booking.properties?.name || 'Unknown Property'}</p>
                </div>
              </div>

              {/* Guest */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon name="UserIcon" variant="outline" size={16} className="text-text-secondary" />
                </div>
                <div>
                  <p className="font-caption text-xs text-text-secondary uppercase tracking-wide">Guest</p>
                  <p className="font-heading font-semibold text-text-primary">{booking.guest_name}</p>
                  <p className="font-caption text-sm text-text-secondary">{booking.guest_email}</p>
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
                      <p className="font-caption font-medium text-text-primary text-sm">{formatDate(booking.check_in)}</p>
                    </div>
                    <div>
                      <p className="font-caption text-xs text-text-secondary">Check-out</p>
                      <p className="font-caption font-medium text-text-primary text-sm">{formatDate(booking.check_out)}</p>
                    </div>
                  </div>
                  <p className="font-caption text-xs text-text-secondary mt-1">
                    {getNights(booking.check_in, booking.check_out)} nights · {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}
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
                    ${parseFloat(booking.total_amount).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Special Requests */}
              {booking.special_requests && (
                <div className="flex items-start gap-3 pt-3 border-t border-border">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon name="ChatBubbleLeftEllipsisIcon" variant="outline" size={16} className="text-text-secondary" />
                  </div>
                  <div>
                    <p className="font-caption text-xs text-text-secondary uppercase tracking-wide">Special Requests</p>
                    <p className="font-caption text-sm text-text-primary mt-1">{booking.special_requests}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Status message */}
            <div className={`px-6 py-4 border-t border-border ${booking.status === 'confirmed' ? 'bg-success/5' : booking.status === 'cancelled' ? 'bg-error/5' : 'bg-yellow-50'}`}>
              <p className="font-caption text-sm">
                {booking.status === 'confirmed' && (
                  <span className="text-success">✓ Your booking has been confirmed. We look forward to welcoming you!</span>
                )}
                {booking.status === 'pending' && (
                  <span className="text-yellow-700">⏳ Your booking is pending confirmation. We'll review and confirm within 24 hours.</span>
                )}
                {booking.status === 'cancelled' && (
                  <span className="text-error">✗ This booking has been cancelled.</span>
                )}
              </p>

              {/* Cancel button — only for pending or confirmed */}
              {(booking.status === 'pending' || booking.status === 'confirmed') && (
                <div className="mt-4">
                  {cancelError && (
                    <p className="text-sm text-error mb-2">{cancelError}</p>
                  )}
                  <button
                    onClick={handleCancelBooking}
                    disabled={cancelling}
                    className="flex items-center gap-2 px-4 py-2 border border-error text-error rounded-lg font-caption text-sm font-medium hover:bg-error/5 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancelling ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <Icon name="XCircleIcon" variant="outline" size={16} />
                        Cancel Booking
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-primary hover:text-primary-dark transition-smooth font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
