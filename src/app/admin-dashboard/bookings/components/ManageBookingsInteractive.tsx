'use client';

import React, { useState, useEffect } from 'react';
import BookingMetricsCards from '@/app/admin-dashboard/components/BookingMetricsCards';
import BookingFilters from '@/app/admin-dashboard/components/BookingFilters';
import BookingTable from '@/app/admin-dashboard/components/BookingTable';
import BulkActionsBar from '@/app/admin-dashboard/components/BulkActionsBar';
import BookingEditModal from './BookingEditModal';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  sendBookingConfirmedEmail,
  bookingRowToConfirmedEmailPayload,
  bookingTotalAmountToNumericString,
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
  statusUpdatedAt?: string;
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

const PAGE_SIZE = 10;

const ManageBookingsInteractive = () => {
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
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [metrics, setMetrics] = useState<MetricCard[]>([]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || !user) return;
    fetchBookings();
  }, [isHydrated, user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id, name')
        .eq('owner_id', user?.id);

      if (propError) throw propError;

      const propertyIds = properties?.map((p) => p.id) || [];

      if (propertyIds.length === 0) {
        setBookings([]);
        setFilteredBookings([]);
        setMetrics(buildMetrics([], []));
        setLoading(false);
        return;
      }

      // Fetch current period bookings (all time for display)
      const { data, error } = await supabase
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
          status_updated_at,
          property_id,
          properties (name)
        `)
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch previous 30-day period for comparison
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date(now);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const { data: prevData } = await supabase
        .from('bookings')
        .select('id, status, created_at')
        .in('property_id', propertyIds)
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString());

      const { data: currData } = await supabase
        .from('bookings')
        .select('id, status, created_at')
        .in('property_id', propertyIds)
        .gte('created_at', thirtyDaysAgo.toISOString());

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
        statusUpdatedAt: booking.status_updated_at || undefined,
      }));

      setBookings(formattedBookings);
      setFilteredBookings(formattedBookings);
      setMetrics(buildMetrics(currData || [], prevData || []));
    } catch (error: any) {
      console.error('Error fetching bookings:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const buildMetrics = (curr: any[], prev: any[]): MetricCard[] => {
    const calcChange = (currVal: number, prevVal: number): { change: string; changeType: 'positive' | 'negative' | 'neutral' } => {
      if (prevVal === 0) {
        if (currVal === 0) return { change: '0', changeType: 'neutral' };
        return { change: `+${currVal}`, changeType: 'positive' };
      }
      const diff = currVal - prevVal;
      const pct = Math.round((diff / prevVal) * 100);
      if (pct > 0) return { change: `+${pct}%`, changeType: 'positive' };
      if (pct < 0) return { change: `${pct}%`, changeType: 'negative' };
      return { change: '0%', changeType: 'neutral' };
    };

    const currTotal = curr.length;
    const prevTotal = prev.length;
    const currPending = curr.filter((b) => b.status === 'pending').length;
    const prevPending = prev.filter((b) => b.status === 'pending').length;
    const currConfirmed = curr.filter((b) => b.status === 'confirmed').length;
    const prevConfirmed = prev.filter((b) => b.status === 'confirmed').length;
    const currCancelled = curr.filter((b) => b.status === 'cancelled').length;
    const prevCancelled = prev.filter((b) => b.status === 'cancelled').length;

    const totalChange = calcChange(currTotal, prevTotal);
    const pendingChange = calcChange(currPending, prevPending);
    const confirmedChange = calcChange(currConfirmed, prevConfirmed);
    const cancelledChange = calcChange(currCancelled, prevCancelled);

    return [
      {
        id: 'total',
        label: 'Total Bookings (30d)',
        value: currTotal.toString(),
        change: totalChange.change,
        changeType: totalChange.changeType,
        icon: 'CalendarIcon',
      },
      {
        id: 'pending',
        label: 'Pending (30d)',
        value: currPending.toString(),
        change: pendingChange.change,
        changeType: pendingChange.changeType,
        icon: 'ClockIcon',
      },
      {
        id: 'confirmed',
        label: 'Confirmed (30d)',
        value: currConfirmed.toString(),
        change: confirmedChange.change,
        changeType: confirmedChange.changeType,
        icon: 'CheckCircleIcon',
      },
      {
        id: 'cancelled',
        label: 'Cancelled (30d)',
        value: currCancelled.toString(),
        change: cancelledChange.change,
        changeType: cancelledChange.changeType === 'positive' ? 'negative' : cancelledChange.changeType === 'negative' ? 'positive' : 'neutral',
        icon: 'XCircleIcon',
      },
    ];
  };

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
    setCurrentPage(1);
  }, [
    statusFilter,
    accommodationFilter,
    searchQuery,
    dateFrom,
    dateTo,
    bookings,
    isHydrated,
  ]);

  const statusOptions: FilterOption[] = [
    { value: 'all', label: 'All Status', count: bookings.length },
    {
      value: 'pending',
      label: 'Pending',
      count: bookings.filter((b) => b.status === 'pending').length,
    },
    {
      value: 'confirmed',
      label: 'Confirmed',
      count: bookings.filter((b) => b.status === 'confirmed').length,
    },
    {
      value: 'cancelled',
      label: 'Cancelled',
      count: bookings.filter((b) => b.status === 'cancelled').length,
    },
  ];

  const accommodationOptions: FilterOption[] = [
    { value: 'all', label: 'All Accommodations' },
    ...Array.from(new Set(bookings.map((b) => b.accommodation))).map(
      (acc) => ({
        value: acc,
        label: acc,
      })
    ),
  ];

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setIsModalOpen(true);
  };

  const handleSaveBooking = async (updatedBooking: Booking) => {
    const wasConfirmed = editingBooking?.status === 'confirmed';
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          guest_name: updatedBooking.guestName,
          guest_email: updatedBooking.guestEmail,
          check_in: updatedBooking.checkIn,
          check_out: updatedBooking.checkOut,
          guests: updatedBooking.guests,
          status: updatedBooking.status,
          total_amount: parseFloat(updatedBooking.totalAmount.replace('$', '')),
          special_requests: updatedBooking.specialRequests,
        })
        .eq('id', updatedBooking.id);

      if (error) throw error;

      if (!wasConfirmed && updatedBooking.status === 'confirmed') {
        const email = updatedBooking.guestEmail?.trim();
        if (email) {
          await sendBookingConfirmedEmail({
            guestEmail: email,
            guestName: updatedBooking.guestName,
            bookingId: updatedBooking.id,
            propertyName: updatedBooking.accommodation,
            checkIn: updatedBooking.checkIn,
            checkOut: updatedBooking.checkOut,
            guests: updatedBooking.guests,
            totalAmount: bookingTotalAmountToNumericString(updatedBooking.totalAmount),
          });
        }
      }

      await fetchBookings();
      setIsModalOpen(false);
      setEditingBooking(null);
    } catch (error: any) {
      console.error('Error updating booking:', error.message);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      await fetchBookings();
    } catch (error: any) {
      console.error('Error deleting booking:', error.message);
    }
  };

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
      const { error } = await supabase
        .from('bookings')
        .delete()
        .in('id', selectedBookings);

      if (error) throw error;

      await fetchBookings();
      setSelectedBookings([]);
    } catch (error: any) {
      console.error('Error deleting bookings:', error.message);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: 'pending' | 'confirmed' | 'cancelled') => {
    let confirmPayload: BookingConfirmedEmailInput | null = null;

    if (newStatus === 'confirmed') {
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
        .update({
          status: newStatus,
          status_updated_at: new Date().toISOString(),
        })
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

  const handleSelectBooking = (bookingId: string) => {
    setSelectedBookings((prev) =>
      prev.includes(bookingId)
        ? prev.filter((id) => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBookings.length === filteredBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filteredBookings.map((b) => b.id));
    }
  };

  const handleConfirmSelected = async () => {
    await handleBulkStatusUpdate('confirmed');
  };

  const handleCancelSelected = async () => {
    await handleBulkStatusUpdate('cancelled');
  };

  const handleClearSelection = () => {
    setSelectedBookings([]);
  };

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      <div className="flex items-center justify-between">
        <p className="text-text-secondary font-caption">
          Showing {filteredBookings.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredBookings.length)} of {filteredBookings.length} bookings
        </p>
      </div>

      <BookingTable
        bookings={paginatedBookings}
        selectedBookings={selectedBookings}
        onSelectBooking={handleSelectBooking}
        onSelectAll={handleSelectAll}
        onStatusChange={handleStatusChange}
        onEdit={handleEditBooking}
        onDelete={handleDeleteBooking}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-card rounded-lg border border-border px-4 py-3">
          <p className="text-sm text-text-secondary font-caption">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md text-text-secondary hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-smooth"
              aria-label="First page"
            >
              <Icon name="ChevronDoubleLeftIcon" variant="outline" size={16} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-md text-text-secondary hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-smooth"
              aria-label="Previous page"
            >
              <Icon name="ChevronLeftIcon" variant="outline" size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-text-secondary text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    className={`w-8 h-8 rounded-md text-sm font-caption transition-smooth ${
                      currentPage === p
                        ? 'bg-primary text-primary-foreground'
                        : 'text-text-secondary hover:bg-muted'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md text-text-secondary hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-smooth"
              aria-label="Next page"
            >
              <Icon name="ChevronRightIcon" variant="outline" size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md text-text-secondary hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-smooth"
              aria-label="Last page"
            >
              <Icon name="ChevronDoubleRightIcon" variant="outline" size={16} />
            </button>
          </div>
        </div>
      )}

      <BulkActionsBar
        selectedCount={selectedBookings.length}
        onConfirmSelected={handleConfirmSelected}
        onCancelSelected={handleCancelSelected}
        onClearSelection={handleClearSelection}
      />

      {isModalOpen && editingBooking && (
        <BookingEditModal
          booking={editingBooking}
          onSave={handleSaveBooking}
          onClose={() => {
            setIsModalOpen(false);
            setEditingBooking(null);
          }}
        />
      )}
    </div>
  );
};

export default ManageBookingsInteractive;