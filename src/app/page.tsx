import React from 'react';
import { Metadata } from 'next';
import BookingHubMarketingInteractive from './_marketing-landing/components/BookingHubMarketingInteractive';

export const metadata: Metadata = {
  title: 'BookingHub - Complete Booking Management for Accommodation Providers',
  description:
    'Streamline your accommodation business with BookingHub. Manage bookings, sync calendars, track analytics, and communicate with guests - all in one powerful platform.',
};

export default function HomePage() {
  return <BookingHubMarketingInteractive />;
}
