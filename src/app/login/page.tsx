import type { Metadata } from 'next';
import LoginInteractive from './components/LoginInteractive';

export const metadata: Metadata = {
  title: 'Prijava skrbnika - BookingHub',
  description: 'Prijavite se za dostop do skrbniške nadzorne plošče BookingHub',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <LoginInteractive />
    </div>
  );
}