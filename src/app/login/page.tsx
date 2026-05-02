import type { Metadata } from 'next';
import LoginInteractive from './components/LoginInteractive';

export const metadata: Metadata = {
  title: 'Admin Login - BookingHub',
  description: 'Login to access the BookingHub admin dashboard',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <LoginInteractive />
    </div>
  );
}