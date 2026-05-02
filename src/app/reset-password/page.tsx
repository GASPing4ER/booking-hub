import type { Metadata } from 'next';
import ResetPasswordInteractive from './components/ResetPasswordInteractive';

export const metadata: Metadata = {
  title: 'Reset Password | BookingHub',
  description: 'Set a new password for your BookingHub account.',
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <ResetPasswordInteractive />
    </div>
  );
}
