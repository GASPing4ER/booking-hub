import type { Metadata } from 'next';
import MyBookingInteractive from './components/MyBookingInteractive';

export const metadata: Metadata = {
  title: 'Moja rezervacija | BookingHub',
  description: 'Poiščite podrobnosti svoje rezervacije s pomočjo e-poštnega naslova in ID-ja rezervacije.',
};

export default function MyBookingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MyBookingInteractive />
    </div>
  );
}
