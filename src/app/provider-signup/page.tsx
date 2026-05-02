import type { Metadata } from 'next';
import ProviderSignUpInteractive from './components/ProviderSignUpInteractive';

export const metadata: Metadata = {
  title: 'Provider Sign Up - BookingHub',
  description: 'Create your BookingHub provider account and start managing your accommodations',
};

export default function ProviderSignUpPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <ProviderSignUpInteractive />
    </div>
  );
}
