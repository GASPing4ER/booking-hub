import type { Metadata } from 'next';
import ProviderSignUpInteractive from './components/ProviderSignUpInteractive';

export const metadata: Metadata = {
  title: 'Registracija ponudnika - BookingHub',
  description: 'Ustvarite svoj račun ponudnika BookingHub in začnite upravljati svoje nastanitve',
};

export default function ProviderSignUpPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <ProviderSignUpInteractive />
    </div>
  );
}
