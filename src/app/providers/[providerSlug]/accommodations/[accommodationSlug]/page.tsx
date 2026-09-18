'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { slugifyPropertyLabel } from '@/lib/propertySlug';
import { getPropertyImages } from '@/lib/propertyImages';

interface Accommodation {
  id: string;
  name: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  minStayNights: number;
  amenities: string[];
  houseRules: string[];
  images: Array<{ url: string; alt: string }>;
}

interface CalendarDay {
  date: string;
  status: 'available' | 'booked' | 'blocked' | 'past';
  price?: number;
}

type BookingStep = 'browse' | 'confirm';

const DAYS_OF_WEEK = ['Ned', 'Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob'];
const MONTHS = ['Januar', 'Februar', 'Marec', 'April', 'Maj', 'Junij', 'Julij', 'Avgust', 'September', 'Oktober', 'November', 'December'];

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date: Date, days: number): Date {
  let d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function AccommodationDetailPageContent() {
  const router = useRouter();
  const routeParams = useParams<{
    providerSlug?: string | string[];
    accommodationSlug?: string | string[];
  }>();
  const rawSlug = routeParams?.providerSlug;
  const providerSlug =
    (Array.isArray(rawSlug) ? rawSlug[0] : rawSlug)?.trim() || 'default';
  const storefrontLookupSlug =
    slugifyPropertyLabel(providerSlug.trim()) || providerSlug.trim();
  const rawAccommodation = routeParams?.accommodationSlug;
  const accommodationKeyRaw = (
    Array.isArray(rawAccommodation) ? rawAccommodation[0] : rawAccommodation
  )?.trim();
  let accommodationKey = accommodationKeyRaw || '';
  try {
    accommodationKey = accommodationKey ? decodeURIComponent(accommodationKey) : '';
  } catch {
    /* keep raw */
  }

  const supabase = createClient();
  const [accommodation, setAccommodation] = useState<Accommodation | null>(null);
  const [calendarDays, setCalendarDays] = useState<Record<string, CalendarDay>>({});
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Calendar state
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Booking state
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [step, setStep] = useState<BookingStep>('browse');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    const sendHeight = () => {
      if (typeof window !== 'undefined' && window.parent !== window) {
        window.parent.postMessage({ type: 'resize', height: document.body.scrollHeight }, '*');
      }
    };
    sendHeight();
    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isHydrated || !accommodationKey) return;
    fetchAccommodationData();
  }, [isHydrated, accommodationKey, providerSlug]);

  const fetchAccommodationData = async () => {
    try {
      setLoading(true);

      const { data: ownerProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('slug', storefrontLookupSlug)
        .maybeSingle();
      const ownerId = ownerProfile?.id;

      const { data: propertyById } = await supabase
        .from('properties')
        .select('*')
        .eq('id', accommodationKey)
        .maybeSingle();

      let property = propertyById;

      if (!property) {
        const { data: propertyBySlug } = await supabase
          .from('properties')
          .select('*')
          .eq('slug', accommodationKey)
          .maybeSingle();
        property = propertyBySlug;
      }

      if (!property) {
        setAccommodation(null);
        setLoading(false);
        return;
      }

      if (ownerId && property.owner_id && property.owner_id !== ownerId) {
        setAccommodation(null);
        setLoading(false);
        return;
      }

      setAccommodation({
        id: property.id,
        name: property.name,
        description: property.description || '',
        capacity: property.capacity || 2,
        pricePerNight: parseFloat(property.price_per_night) || 0,
        minStayNights: property.min_stay_nights || 1,
        amenities: property.amenities || [],
        houseRules: property.house_rules || ['Kajenje prepovedano', 'Hišni ljubljenčki prepovedani', 'Nočni mir od 22h do 8h'],
        images: getPropertyImages(property.image_urls, property.image_url, `${property.name} - fotografija nastanitve`),
      });

      // Fetch bookings for this property
      const { data: bookings } = await supabase
        .from('bookings')
        .select('check_in, check_out, status')
        .eq('property_id', property.id)
        .in('status', ['confirmed', 'pending']);

      // Fetch availability overrides
      const { data: availability } = await supabase
        .from('availability')
        .select('date, status')
        .eq('property_id', property.id);

      // Build calendar days map
      const days: Record<string, CalendarDay> = {};
      const startDate = new Date(today);
      const endDate = addDays(today, 180);

      // Mark all as available first
      let d = new Date(startDate);
      while (d <= endDate) {
        const key = formatDate(d);
        days[key] = { date: key, status: 'available', price: parseFloat(property.price_per_night) || 0 };
        d = addDays(d, 1);
      }

      // Mark past dates
      d = new Date(today);
      d.setDate(d.getDate() - 1);
      const pastStart = addDays(today, -30);
      let pd = new Date(pastStart);
      while (pd < today) {
        const key = formatDate(pd);
        days[key] = { date: key, status: 'past' };
        pd = addDays(pd, 1);
      }

      // Mark booked ranges
      (bookings || []).forEach((booking: any) => {
        const start = parseDate(booking.check_in);
        const end = parseDate(booking.check_out);
        let bd = new Date(start);
        while (bd < end) {
          const key = formatDate(bd);
          if (days[key]) days[key] = { ...days[key], status: 'booked' };
          bd = addDays(bd, 1);
        }
      });

      // Apply availability overrides
      (availability || []).forEach((av: any) => {
        if (days[av.date]) {
          days[av.date] = { ...days[av.date], status: av.status === 'unavailable' ? 'blocked' : av.status };
        }
      });

      setCalendarDays(days);
    } catch (err: any) {
      console.error('Error fetching accommodation:', err.message);
      // Set mock data for demo
      setAccommodation({
        id: accommodationKey,
        name: 'Apartma s pogledom na morje',
        description: 'Osupljiv apartma s pogledom na morje z modernimi ugodnostmi, popoln za pare ali manjše družine, ki iščejo razkošni obmorski umik.',
        capacity: 4,
        pricePerNight: 180,
        minStayNights: 2,
        amenities: ['WiFi', 'Klimatska naprava', 'Kuhinja', 'Pogled na morje', 'Parkiranje', 'Dostop do bazena'],
        houseRules: ['Kajenje prepovedano', 'Hišni ljubljenčki prepovedani', 'Nočni mir od 22h do 8h', 'Prijava po 15h'],
        images: [{ url: '', alt: 'Apartma s pogledom na morje - prostorna soba s panoramskim pogledom na morje' }],
      });
      // Build demo calendar
      const days: Record<string, CalendarDay> = {};
      let dd = new Date(today);
      for (let i = 0; i < 180; i++) {
        const key = formatDate(dd);
        days[key] = { date: key, status: i < 0 ? 'past' : 'available', price: 180 };
        dd = addDays(dd, 1);
      }
      setCalendarDays(days);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (dateStr: string) => {
    let day = calendarDays[dateStr];
    if (!day || day.status === 'booked' || day.status === 'blocked' || day.status === 'past') return;

    if (!checkIn || (checkIn && checkOut)) {
      // Start new selection
      setCheckIn(dateStr);
      setCheckOut(null);
    } else {
      // Set checkout
      if (dateStr <= checkIn) {
        setCheckIn(dateStr);
        setCheckOut(null);
        return;
      }
      // Check if any booked/blocked dates in range
      const start = parseDate(checkIn);
      const end = parseDate(dateStr);
      let d = addDays(start, 1);
      let hasConflict = false;
      while (d < end) {
        const key = formatDate(d);
        const dayStatus = calendarDays[key]?.status;
        if (dayStatus === 'booked' || dayStatus === 'blocked') {
          hasConflict = true;
          break;
        }
        d = addDays(d, 1);
      }
      if (hasConflict) {
        setCheckIn(dateStr);
        setCheckOut(null);
        return;
      }
      setCheckOut(dateStr);
    }
  };

  const isInRange = (dateStr: string): boolean => {
    if (!checkIn || !checkOut) return false;
    return dateStr > checkIn && dateStr < checkOut;
  };

  const nights = checkIn && checkOut ? diffDays(parseDate(checkIn), parseDate(checkOut)) : 0;
  const totalPrice = nights * (accommodation?.pricePerNight || 0);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const cells: React.ReactNode[] = [];

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const calDay = calendarDays[dateStr];
      const status = calDay?.status || 'past';
      const isCheckIn = checkIn === dateStr;
      const isCheckOut = checkOut === dateStr;
      const inRange = isInRange(dateStr);
      const isPast = status === 'past' || parseDate(dateStr) < today;

      let cellClass = 'relative flex items-center justify-center h-9 w-9 mx-auto rounded-full text-sm font-caption transition-all duration-150 ';
      let dotClass = '';

      if (isPast) {
        cellClass += 'text-text-secondary/40 cursor-not-allowed';
      } else if (status === 'booked') {
        cellClass += 'text-error/60 cursor-not-allowed';
        dotClass = 'bg-error';
      } else if (status === 'blocked') {
        cellClass += 'text-text-secondary/50 cursor-not-allowed line-through';
      } else if (isCheckIn || isCheckOut) {
        cellClass += 'bg-primary text-primary-foreground font-semibold cursor-pointer shadow-md';
      } else if (inRange) {
        cellClass += 'bg-primary/15 text-primary cursor-pointer rounded-none';
      } else {
        cellClass += 'text-text-primary hover:bg-primary/10 hover:text-primary cursor-pointer';
      }

      cells.push(
        <div key={dateStr} className="relative">
          {inRange && <div className="absolute inset-y-0 inset-x-0 bg-primary/10" />}
          <button
            onClick={() => handleDateClick(dateStr)}
            disabled={isPast || status === 'booked' || status === 'blocked'}
            className={cellClass}
            title={status === 'booked' ? 'Že rezervirano' : status === 'blocked' ? 'Ni na voljo' : `${dateStr} - $${calDay?.price || accommodation?.pricePerNight}/noč`}
          >
            {day}
            {dotClass && (
              <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${dotClass}`} />
            )}
          </button>
        </div>
      );
    }

    return cells;
  };

  const handleSubmitBooking = async () => {
    if (!checkIn || !checkOut || !guestName || !guestEmail) return;
    setSubmitting(true);
    setBookingError('');
    try {
      const { data: bookingData, error } = await supabase.from('bookings').insert({
        property_id: accommodation?.id,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        check_in: checkIn,
        check_out: checkOut,
        total_amount: totalPrice,
        status: 'pending',
        guests: 1,
      }).select('id').single();
      if (error) throw error;

      // Update availability table for each date in range
      const start = parseDate(checkIn);
      const end = parseDate(checkOut);
      const availabilityRows: { property_id: string; date: string; status: string }[] = [];
      let d = new Date(start);
      while (d < end) {
        availabilityRows.push({
          property_id: accommodation!.id,
          date: formatDate(d),
          status: 'booked',
        });
        d = addDays(d, 1);
      }
      if (availabilityRows.length > 0) {
        await supabase.from('availability').upsert(availabilityRows, { onConflict: 'property_id,date' });
      }

      // Send confirmation email (Supabase Edge Function + Resend — see README)
      if (bookingData?.id) {
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          if (supabaseUrl && supabaseAnonKey) {
            await fetch(`${supabaseUrl}/functions/v1/send-booking-confirmation`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${supabaseAnonKey}`,
              },
              body: JSON.stringify({
                guestEmail,
                guestName,
                bookingId: bookingData.id,
                propertyName: accommodation!.name,
                checkIn,
                checkOut,
                guests: 1,
                totalAmount: totalPrice.toString(),
                propertyId: accommodation!.id,
              }),
            });
          }
        } catch (emailErr) {
          console.error('Email send failed (non-blocking):', emailErr);
        }
      }

      setBookingSuccess(true);
    } catch (err: any) {
      setBookingError(err.message || 'Rezervacije ni bilo mogoče poslati. Prosimo, poskusite znova.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-caption text-text-secondary">Nalaganje nastanitve...</p>
        </div>
      </div>
    );
  }

  if (!accommodation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="ExclamationCircleIcon" variant="outline" size={48} className="text-text-secondary mx-auto mb-4" />
          <p className="font-heading text-xl text-text-primary">Nastanitev ni najdena</p>
          <button
            type="button"
            onClick={() =>
              router.push(
                `/providers/${encodeURIComponent(providerSlug)}/accommodations`
              )
            }
            className="mt-4 text-primary font-caption hover:underline"
          >
            Nazaj na seznam
          </button>
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon name="CheckCircleIcon" variant="solid" size={48} className="text-success" />
          </div>
          <h2 className="font-heading font-bold text-2xl text-text-primary mb-2">Rezervacija zahtevana!</h2>
          <p className="font-body text-text-secondary mb-6">
            Vaša zahteva za rezervacijo <strong>{accommodation.name}</strong> od <strong>{checkIn}</strong> do <strong>{checkOut}</strong> je bila oddana. Kmalu boste prejeli potrditveno e-pošto.
          </p>
          <div className="bg-muted rounded-lg p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between font-caption text-sm">
              <span className="text-text-secondary">Prijava</span>
              <span className="text-text-primary font-medium">{checkIn}</span>
            </div>
            <div className="flex justify-between font-caption text-sm">
              <span className="text-text-secondary">Odjava</span>
              <span className="text-text-primary font-medium">{checkOut}</span>
            </div>
            <div className="flex justify-between font-caption text-sm">
              <span className="text-text-secondary">Skupaj</span>
              <span className="text-primary font-semibold">${totalPrice}</span>
            </div>
          </div>
          <button
            onClick={() =>
              router.push(
                `/providers/${encodeURIComponent(providerSlug)}/accommodations`
              )
            }
            className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-caption font-medium hover:bg-primary/90 transition-colors mb-3"
          >
            Nazaj na nastanitve
          </button>
          <button
            onClick={() => router.push('/my-booking')}
            className="w-full border border-border text-text-secondary px-6 py-3 rounded-lg font-caption font-medium hover:bg-muted transition-colors"
          >
            Preveri mojo rezervacijo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back Navigation */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          <button
            onClick={() =>
              router.push(
                `/providers/${encodeURIComponent(providerSlug)}/accommodations`
              )
            }
            className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors font-caption text-sm"
          >
            <Icon name="ArrowLeftIcon" variant="outline" size={18} />
            <span>Nazaj na nastanitve</span>
          </button>
          <span className="text-border">|</span>
          <span className="font-caption text-sm text-text-primary font-medium truncate">{accommodation.name}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Accommodation Details */}
          <div className="lg:col-span-3 space-y-6">
            {/* Image Gallery */}
            <div className="relative h-72 sm:h-80 rounded-2xl overflow-hidden bg-muted group">
              <AppImage
                src={accommodation.images[currentImageIndex]?.url || ''}
                alt={accommodation.images[currentImageIndex]?.alt || accommodation.name}
                className="w-full h-full object-cover"
              />
              {accommodation.images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((p) => (p === 0 ? accommodation.images.length - 1 : p - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-card/90 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icon name="ChevronLeftIcon" variant="outline" size={20} className="text-text-primary" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((p) => (p === accommodation.images.length - 1 ? 0 : p + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-card/90 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icon name="ChevronRightIcon" variant="outline" size={20} className="text-text-primary" />
                  </button>
                </>
              )}
            </div>

            {accommodation.images.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {accommodation.images.map((image, index) => (
                  <button
                    key={`${image.url}-${index}`}
                    type="button"
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative h-16 overflow-hidden rounded-lg border transition-all ${
                      index === currentImageIndex
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/60'
                    }`}
                    aria-label={`Poglej fotografijo nepremičnine ${index + 1}`}
                  >
                    <AppImage
                      src={image.url}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Title & Price */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-heading font-bold text-3xl text-text-primary">{accommodation.name}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <Icon name="UserGroupIcon" variant="outline" size={16} className="text-primary" />
                    <span className="font-caption text-sm">Do {accommodation.capacity} gostov</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <Icon name="MoonIcon" variant="outline" size={16} className="text-primary" />
                    <span className="font-caption text-sm">Najm. {accommodation.minStayNights} {accommodation.minStayNights === 1 ? 'noč' : 'noči'}</span>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-heading font-bold text-2xl text-primary">${accommodation.pricePerNight}</p>
                <p className="font-caption text-xs text-text-secondary">na noč</p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-card rounded-xl p-5 border border-border">
              <h2 className="font-heading font-semibold text-lg text-text-primary mb-3">O tej nastanitvi</h2>
              <p className="font-body text-text-secondary leading-relaxed">{accommodation.description}</p>
            </div>

            {/* Amenities */}
            {accommodation.amenities.length > 0 && (
              <div className="bg-card rounded-xl p-5 border border-border">
                <h2 className="font-heading font-semibold text-lg text-text-primary mb-4">Ugodnosti</h2>
                <div className="grid grid-cols-2 gap-3">
                  {accommodation.amenities.map((amenity, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Icon name="CheckCircleIcon" variant="solid" size={18} className="text-success flex-shrink-0" />
                      <span className="font-caption text-sm text-text-secondary">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* House Rules */}
            {accommodation.houseRules.length > 0 && (
              <div className="bg-card rounded-xl p-5 border border-border">
                <h2 className="font-heading font-semibold text-lg text-text-primary mb-4">Hišni red</h2>
                <div className="space-y-2">
                  {accommodation.houseRules.map((rule, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Icon name="InformationCircleIcon" variant="outline" size={16} className="text-accent flex-shrink-0" />
                      <span className="font-caption text-sm text-text-secondary">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Booking Panel */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl border border-border shadow-lg sticky top-20">
              {step === 'browse' ? (
                <div className="p-5">
                  <h2 className="font-heading font-semibold text-xl text-text-primary mb-1">Izberite datume</h2>
                  <p className="font-caption text-sm text-text-secondary mb-4">Kliknite na datum za nastavitev prijave, nato kliknite še enega za odjavo</p>

                  {/* Calendar Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => {
                        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
                        else setCurrentMonth((m) => m - 1);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                    >
                      <Icon name="ChevronLeftIcon" variant="outline" size={18} className="text-text-primary" />
                    </button>
                    <span className="font-caption font-semibold text-text-primary">
                      {MONTHS[currentMonth]} {currentYear}
                    </span>
                    <button
                      onClick={() => {
                        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
                        else setCurrentMonth((m) => m + 1);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                    >
                      <Icon name="ChevronRightIcon" variant="outline" size={18} className="text-text-primary" />
                    </button>
                  </div>

                  {/* Day Headers */}
                  <div className="grid grid-cols-7 mb-1">
                    {DAYS_OF_WEEK.map((d) => (
                      <div key={d} className="text-center font-caption text-xs text-text-secondary font-medium py-1">{d}</div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-y-1 mb-4">
                    {renderCalendar()}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-border">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="font-caption text-xs text-text-secondary">Izbrano</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-primary/15" />
                      <span className="font-caption text-xs text-text-secondary">V obdobju</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-error/60" />
                      <span className="font-caption text-xs text-text-secondary">Rezervirano</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-muted border border-border" />
                      <span className="font-caption text-xs text-text-secondary">Blokirano</span>
                    </div>
                  </div>

                  {/* Selected Dates Summary */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className={`p-3 rounded-lg border-2 transition-colors ${checkIn ? 'border-primary bg-primary/5' : 'border-border bg-muted'}`}>
                      <p className="font-caption text-xs text-text-secondary mb-1">Prijava</p>
                      <p className={`font-caption text-sm font-semibold ${checkIn ? 'text-primary' : 'text-text-secondary'}`}>
                        {checkIn || 'Izberite datum'}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg border-2 transition-colors ${checkOut ? 'border-primary bg-primary/5' : 'border-border bg-muted'}`}>
                      <p className="font-caption text-xs text-text-secondary mb-1">Odjava</p>
                      <p className={`font-caption text-sm font-semibold ${checkOut ? 'text-primary' : 'text-text-secondary'}`}>
                        {checkOut || 'Izberite datum'}
                      </p>
                    </div>
                  </div>

                  {nights > 0 && (
                    <div className="bg-muted rounded-lg p-3 mb-4">
                      <div className="flex justify-between font-caption text-sm mb-1">
                        <span className="text-text-secondary">${accommodation.pricePerNight} × {nights} noči</span>
                        <span className="text-text-primary font-semibold">${totalPrice}</span>
                      </div>
                      {nights < accommodation.minStayNights && (
                        <p className="text-error text-xs font-caption mt-1">
                          Najkrajše bivanje je {accommodation.minStayNights} noči
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => setStep('confirm')}
                    disabled={!checkIn || !checkOut || nights < accommodation.minStayNights}
                    className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-lg font-caption font-medium shadow hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>Nadaljuj z rezervacijo</span>
                    <Icon name="ArrowRightIcon" variant="outline" size={18} className="text-primary-foreground" />
                  </button>

                  {checkIn && (
                    <button
                      onClick={() => { setCheckIn(null); setCheckOut(null); }}
                      className="w-full mt-2 text-text-secondary hover:text-text-primary font-caption text-sm transition-colors"
                    >
                      Počisti izbiro
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-5">
                  <button
                    onClick={() => setStep('browse')}
                    className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors font-caption text-sm mb-4"
                  >
                    <Icon name="ArrowLeftIcon" variant="outline" size={16} />
                    <span>Nazaj na koledar</span>
                  </button>

                  <h2 className="font-heading font-semibold text-xl text-text-primary mb-4">Zaključi rezervacijo</h2>

                  {/* Booking Summary */}
                  <div className="bg-muted rounded-lg p-4 mb-5 space-y-2">
                    <div className="flex justify-between font-caption text-sm">
                      <span className="text-text-secondary">Prijava</span>
                      <span className="text-text-primary font-medium">{checkIn}</span>
                    </div>
                    <div className="flex justify-between font-caption text-sm">
                      <span className="text-text-secondary">Odjava</span>
                      <span className="text-text-primary font-medium">{checkOut}</span>
                    </div>
                    <div className="flex justify-between font-caption text-sm">
                      <span className="text-text-secondary">{nights} noči × ${accommodation.pricePerNight}</span>
                      <span className="text-primary font-semibold">${totalPrice}</span>
                    </div>
                  </div>

                  {/* Guest Form */}
                  <div className="space-y-3">
                    <div>
                      <label className="block font-caption text-sm font-medium text-text-primary mb-1">
                        Polno ime <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Janez Novak"
                        className="w-full px-3 py-2.5 rounded-lg border border-input bg-background font-caption text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block font-caption text-sm font-medium text-text-primary mb-1">
                        E-pošta <span className="text-error">*</span>
                      </label>
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="janez@primer.si"
                        className="w-full px-3 py-2.5 rounded-lg border border-input bg-background font-caption text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block font-caption text-sm font-medium text-text-primary mb-1">Telefon (neobvezno)</label>
                      <input
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-3 py-2.5 rounded-lg border border-input bg-background font-caption text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  {bookingError && (
                    <div className="mt-3 p-3 bg-error/10 rounded-lg flex items-start gap-2">
                      <Icon name="ExclamationCircleIcon" variant="solid" size={16} className="text-error flex-shrink-0 mt-0.5" />
                      <p className="font-caption text-sm text-error">{bookingError}</p>
                    </div>
                  )}

                  <button
                    onClick={handleSubmitBooking}
                    disabled={!guestName || !guestEmail || submitting}
                    className="w-full mt-5 bg-primary text-primary-foreground px-4 py-3 rounded-lg font-caption font-medium shadow hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        <span>Pošiljanje...</span>
                      </>
                    ) : (
                      <>
                        <Icon name="CheckCircleIcon" variant="solid" size={18} className="text-primary-foreground" />
                        <span>Pošlji zahtevo za rezervacijo</span>
                      </>
                    )}
                  </button>

                  <p className="font-caption text-xs text-text-secondary text-center mt-3">
                    Vašo rezervacijo bo gostitelj potrdil v 24 urah
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccommodationBookingPage() {
  return <AccommodationDetailPageContent />;
}
