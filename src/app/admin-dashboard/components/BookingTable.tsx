'use client';

import React from 'react';
import BookingTableRow from './BookingTableRow';

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

interface BookingTableProps {
  bookings: Booking[];
  selectedBookings: string[];
  onSelectBooking: (id: string) => void;
  onSelectAll: () => void;
  onStatusChange: (id: string, status: 'confirmed' | 'cancelled') => void;
  onEdit?: (booking: Booking) => void;
  onDelete?: (id: string) => void;
}

const BookingTable = ({
  bookings,
  selectedBookings,
  onSelectBooking,
  onSelectAll,
  onStatusChange,
  onEdit,
  onDelete,
}: BookingTableProps) => {
  const allSelected =
    bookings.length > 0 && selectedBookings.length === bookings.length;

  return (
    <div className="bg-card rounded-lg border border-border shadow-hospitality-sm overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-4 py-4 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-ring cursor-pointer"
                  aria-label="Select all bookings"
                />
              </th>
              <th className="px-4 py-4 text-left text-sm font-caption font-semibold text-text-primary">
                Guest
              </th>
              <th className="px-4 py-4 text-left text-sm font-caption font-semibold text-text-primary">
                Accommodation
              </th>
              <th className="px-4 py-4 text-left text-sm font-caption font-semibold text-text-primary">
                Check-in
              </th>
              <th className="px-4 py-4 text-left text-sm font-caption font-semibold text-text-primary">
                Check-out
              </th>
              <th className="px-4 py-4 text-left text-sm font-caption font-semibold text-text-primary">
                Status
              </th>
              <th className="px-4 py-4 text-left text-sm font-caption font-semibold text-text-primary">
                Amount
              </th>
              <th className="px-4 py-4 text-left text-sm font-caption font-semibold text-text-primary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <BookingTableRow
                key={booking.id}
                booking={booking}
                isSelected={selectedBookings.includes(booking.id)}
                onSelect={onSelectBooking}
                onStatusChange={onStatusChange}
                onEdit={onEdit}
                onDelete={onDelete}
                isMobileView={false}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden">
        {bookings.map((booking) => (
          <BookingTableRow
            key={booking.id}
            booking={booking}
            isSelected={selectedBookings.includes(booking.id)}
            onSelect={onSelectBooking}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
            onDelete={onDelete}
            isMobileView={true}
          />
        ))}
      </div>

      {bookings.length === 0 && (
        <div className="p-12 text-center">
          <p className="text-text-secondary font-caption">
            No bookings found matching your filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default BookingTable;