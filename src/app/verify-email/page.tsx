import type { Metadata } from 'next';
import { Suspense } from 'react';
import VerifyEmailInteractive from './components/VerifyEmailInteractive';

export const metadata: Metadata = {
  title: 'Verify Your Email - BookingHub',
  description: 'Please verify your email address to complete your BookingHub registration',
};

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Suspense fallback={
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      }>
        <VerifyEmailInteractive />
      </Suspense>
    </div>
  );
}
