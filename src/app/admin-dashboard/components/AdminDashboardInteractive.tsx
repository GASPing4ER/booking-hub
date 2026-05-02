'use client';

import React, { useState, useEffect, useCallback } from 'react';
import BookingMetricsCards from './BookingMetricsCards';
import BookingFilters from './BookingFilters';
import BookingTable from './BookingTable';
import BulkActionsBar from './BulkActionsBar';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  sendBookingConfirmedEmail,
  bookingRowToConfirmedEmailPayload,
  BOOKING_SELECT_FOR_CONFIRM_EMAIL,
  type BookingConfirmedEmailInput,
} from '@/lib/sendBookingConfirmedEmail';

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

interface MetricCard {
  id: string;
  label: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
}

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface Toast {
  id: string;
  guestName: string;
  propertyName: string;
}

const AdminDashboardInteractive = () => {
  const { user } = useAuth();
  const supabase = createClient();
  const [isHydrated, setIsHydrated] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [accommodationFilter, setAccommodationFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [propertyIds, setPropertyIds] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id, name')
        .eq('owner_id', user?.id);

      if (propError) throw propError;

      const ids = properties?.map((p) => p.id) || [];
      setPropertyIds(ids);

      if (ids.length === 0) {
        setBookings([]);
        setFilteredBookings([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          guest_name,
          guest_email,
          check_in,
          check_out,
          guests,
          status,
          total_amount,
          special_requests,
          created_at,
          properties (name)
        `)
        .in('property_id', ids)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedBookings: Booking[] = (data || []).map((booking: any) => ({
        id: booking.id,
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        accommodation: booking.properties?.name || 'Unknown',
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        status: booking.status,
        guests: booking.guests,
        totalAmount: `$${parseFloat(booking.total_amount).toFixed(2)}`,
        bookingDate: new Date(booking.created_at).toISOString().split('T')[0],
        specialRequests: booking.special_requests,
      }));

      setBookings(formattedBookings);
      setFilteredBookings(formattedBookings);
    } catch (error: any) {
      console.error('Error fetching bookings:', error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isHydrated || !user) return;
    fetchBookings();
  }, [isHydrated, user, fetchBookings]);

  // Supabase Realtime — new booking toast + auto-refresh
  useEffect(() => {
    if (propertyIds.length === 0) return;

    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        async (payload) => {
          const booking = payload.new as any;
          if (!propertyIds.includes(booking.property_id)) return;

          // Fetch property name for toast
          const { data: prop } = await supabase
            .from('properties')
            .select('name')
            .eq('id', booking.property_id)
            .single();

          const toast: Toast = {
            id: booking.id,
            guestName: booking.guest_name,
            propertyName: prop?.name || 'your property',
          };

          setToasts((prev) => [toast, ...prev].slice(0, 3));
          setTimeout(() => dismissToast(booking.id), 6000);

          // Refresh bookings list
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [propertyIds, fetchBookings]);

  useEffect(() => {
    if (!isHydrated) return;

    let filtered = [...bookings];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((booking) => booking.status === statusFilter);
    }

    if (accommodationFilter !== 'all') {
      filtered = filtered.filter(
        (booking) => booking.accommodation === accommodationFilter
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          booking.guestName.toLowerCase().includes(query) ||
          booking.guestEmail.toLowerCase().includes(query)
      );
    }

    if (dateFrom) {
      filtered = filtered.filter(
        (booking) => new Date(booking.checkIn) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      filtered = filtered.filter(
        (booking) => new Date(booking.checkOut) <= new Date(dateTo)
      );
    }

    setFilteredBookings(filtered);
  }, [
    statusFilter,
    accommodationFilter,
    searchQuery,
    dateFrom,
    dateTo,
    bookings,
    isHydrated,
  ]);

  const metrics: MetricCard[] = [
    {
      id: 'total',
      label: 'Total Bookings',
      value: bookings.length.toString(),
      change: (() => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date(now);
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const currentPeriod = bookings.filter(b => new Date(b.bookingDate) >= thirtyDaysAgo).length;
        const prevPeriod = bookings.filter(b => new Date(b.bookingDate) >= sixtyDaysAgo && new Date(b.bookingDate) < thirtyDaysAgo).length;
        if (prevPeriod === 0) return currentPeriod > 0 ? `+${currentPeriod}` : '0';
        const pct = ((currentPeriod - prevPeriod) / prevPeriod) * 100;
        return pct >= 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`;
      })(),
      changeType: (() => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date(now);
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const currentPeriod = bookings.filter(b => new Date(b.bookingDate) >= thirtyDaysAgo).length;
        const prevPeriod = bookings.filter(b => new Date(b.bookingDate) >= sixtyDaysAgo && new Date(b.bookingDate) < thirtyDaysAgo).length;
        if (prevPeriod === 0) return currentPeriod > 0 ? 'positive' : 'neutral';
        return currentPeriod >= prevPeriod ? 'positive' : 'negative';
      })() as 'positive' | 'negative' | 'neutral',
      icon: 'CalendarIcon',
    },
    {
      id: 'occupancy',
      label: 'Occupancy Rate',
      value: (() => {
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
        const totalBookedDays = confirmedBookings.reduce((sum, b) => {
          const checkIn = new Date(b.checkIn);
          const checkOut = new Date(b.checkOut);
          return sum + Math.max(0, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
        }, 0);
        const uniqueProperties = new Set(bookings.map(b => b.accommodation)).size || 1;
        const rate = Math.min(100, (totalBookedDays / (uniqueProperties * 30)) * 100);
        return `${rate.toFixed(1)}%`;
      })(),
      change: '0%',
      changeType: 'neutral',
      icon: 'HomeIcon',
    },
    {
      id: 'revenue',
      label: 'Monthly Revenue',
      value: (() => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const monthlyRevenue = bookings
          .filter(b => new Date(b.bookingDate) >= thirtyDaysAgo)
          .reduce((sum, b) => sum + parseFloat(b.totalAmount.replace('$', '')), 0);
        return `${monthlyRevenue.toFixed(0)}`;
      })(),
      change: '0%',
      changeType: 'neutral',
      icon: 'CurrencyDollarIcon',
    },
    {
      id: 'pending',
      label: 'Pending Requests',
      value: bookings.filter((b) => b.status === 'pending').length.toString(),
      change: (() => {
        const pendingCount = bookings.filter(b => b.status === 'pending').length;
        return pendingCount > 0 ? `${pendingCount} awaiting` : 'None';
      })(),
      changeType: bookings.filter(b => b.status === 'pending').length > 0 ? 'neutral' : 'positive',
      icon: 'ClockIcon',
    },
  ];

  const statusOptions: FilterOption[] = [
    { value: 'all', label: 'All Status', count: bookings.length },
    { value: 'pending', label: 'Pending', count: bookings.filter((b) => b.status === 'pending').length },
    { value: 'confirmed', label: 'Confirmed', count: bookings.filter((b) => b.status === 'confirmed').length },
    { value: 'cancelled', label: 'Cancelled', count: bookings.filter((b) => b.status === 'cancelled').length },
  ];

  const accommodationOptions: FilterOption[] = [
    { value: 'all', label: 'All Accommodations' },
    ...Array.from(new Set(bookings.map((b) => b.accommodation))).map((acc) => ({
      value: acc,
      label: acc,
    })),
  ];

  const handleSelectBooking = (bookingId: string) => {
    setSelectedBookings((prev) =>
      prev.includes(bookingId) ? prev.filter((id) => id !== bookingId) : [...prev, bookingId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBookings.length === filteredBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filteredBookings.map((b) => b.id));
    }
  };

  const handleStatusChange = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    let confirmPayload: BookingConfirmedEmailInput | null = null;

    if (status === 'confirmed') {
      const { data: row, error: fetchError } = await supabase
        .from('bookings')
        .select(BOOKING_SELECT_FOR_CONFIRM_EMAIL)
        .eq('id', bookingId)
        .single();
      if (!fetchError && row) {
        confirmPayload = bookingRowToConfirmedEmailPayload(row);
      }
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status, status_updated_at: new Date().toISOString() })
        .eq('id', bookingId);
      if (error) throw error;

      if (confirmPayload) {
        await sendBookingConfirmedEmail(confirmPayload);
      }

      await fetchBookings();
    } catch (error: any) {
      console.error('Error updating booking status:', error.message);
    }
  };

  const handleBulkConfirm = async () => handleBulkStatusUpdate('confirmed');
  const handleBulkCancel = async () => handleBulkStatusUpdate('cancelled');

  const handleBulkStatusUpdate = async (status: 'confirmed' | 'cancelled') => {
    if (selectedBookings.length === 0) return;

    let confirmEmailPayloads: BookingConfirmedEmailInput[] = [];

    if (status === 'confirmed') {
      const { data: rows, error: fetchError } = await supabase
        .from('bookings')
        .select(BOOKING_SELECT_FOR_CONFIRM_EMAIL)
        .in('id', selectedBookings);
      if (!fetchError && rows?.length) {
        confirmEmailPayloads = rows
          .map((r) => bookingRowToConfirmedEmailPayload(r))
          .filter((p): p is NonNullable<typeof p> => p != null);
      }
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status, status_updated_at: new Date().toISOString() })
        .in('id', selectedBookings);
      if (error) throw error;

      for (const payload of confirmEmailPayloads) {
        await sendBookingConfirmedEmail(payload);
      }

      await fetchBookings();
      setSelectedBookings([]);
    } catch (error: any) {
      console.error('Error updating bookings:', error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBookings.length === 0) return;
    if (!confirm(`Delete ${selectedBookings.length} bookings?`)) return;
    try {
      const { error } = await supabase.from('bookings').delete().in('id', selectedBookings);
      if (error) throw error;
      await fetchBookings();
      setSelectedBookings([]);
    } catch (error: any) {
      console.error('Error deleting bookings:', error.message);
    }
  };

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 bg-card border border-border rounded-lg shadow-hospitality-md px-4 py-3 w-80 animate-fade-in"
          >
            <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon name="CalendarIcon" variant="outline" size={16} className="text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-caption font-semibold text-text-primary">New booking received!</p>
              <p className="text-xs text-text-secondary font-caption truncate">
                {toast.guestName} booked {toast.propertyName}
              </p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-text-secondary hover:text-text-primary transition-smooth flex-shrink-0"
              aria-label="Dismiss"
            >
              <Icon name="XMarkIcon" variant="outline" size={16} />
            </button>
          </div>
        ))}
      </div>

      <BookingMetricsCards metrics={metrics} />

      <BookingFilters
        statusFilter={statusFilter}
        accommodationFilter={accommodationFilter}
        searchQuery={searchQuery}
        dateFrom={dateFrom}
        dateTo={dateTo}
        statusOptions={statusOptions}
        accommodationOptions={accommodationOptions}
        onStatusChange={setStatusFilter}
        onAccommodationChange={setAccommodationFilter}
        onSearchChange={setSearchQuery}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onClearFilters={() => {
          setStatusFilter('all');
          setAccommodationFilter('all');
          setSearchQuery('');
          setDateFrom('');
          setDateTo('');
        }}
      />

      <BookingTable
        bookings={filteredBookings}
        selectedBookings={selectedBookings}
        onSelectBooking={handleSelectBooking}
        onSelectAll={handleSelectAll}
        onStatusChange={handleStatusChange}
        onEdit={(bookingId: string) => {}}
        onDelete={async (bookingId: string) => {
          if (!confirm('Delete this booking?')) return;
          try {
            const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
            if (error) throw error;
            await fetchBookings();
          } catch (error: any) {
            console.error('Error deleting booking:', error.message);
          }
        }}
      />

      <BulkActionsBar
        selectedCount={selectedBookings.length}
        onConfirmSelected={handleBulkConfirm}
        onCancelSelected={handleBulkCancel}
        onClearSelection={() => setSelectedBookings([])}
      />
    </div>
  );
};

export default AdminDashboardInteractive;