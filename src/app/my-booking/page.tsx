import type { Metadata } from 'next';
import MyBookingInteractive from './components/MyBookingInteractive';

export const metadata: Metadata = {
  title: 'My Booking | BookingHub',
  description: 'Look up your booking details using your email address and booking ID.',
};

export default function MyBookingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MyBookingInteractive />
    </div>
  );
}
