import type { Metadata } from 'next';
import ForgotPasswordInteractive from './components/ForgotPasswordInteractive';

export const metadata: Metadata = {
  title: 'Forgot Password | BookingHub',
  description: 'Reset your BookingHub account password.',
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <ForgotPasswordInteractive />
    </div>
  );
}
