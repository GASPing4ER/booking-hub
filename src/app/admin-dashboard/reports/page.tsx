'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/common/AdminSidebar';
import AdminContextBar from '@/components/common/AdminContextBar';
import ReportsDashboardInteractive from './components/ReportsDashboardInteractive';
import { useAuth } from '@/contexts/AuthContext';

export default function ReportsPage() {
  const { user, loading, signOut, getUserProfile } = useAuth();
  const router = useRouter();
  const [providerName, setProviderName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const providerSlug = 'admin-dashboard';

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/provider-login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const profile = await getUserProfile();
        const fullName =
          profile?.full_name ||
          user?.user_metadata?.full_name ||
          user?.email ||
          'Ponudnik';
        const businessName =
          profile?.business_name || profile?.company_name || fullName;
        setProviderName(businessName);
        setAdminName(fullName);
        setAdminEmail(user.email || '');
      } catch {
        setAdminName(user?.user_metadata?.full_name || user?.email || 'Ponudnik');
        setAdminEmail(user?.email || '');
        setProviderName(user?.user_metadata?.full_name || 'Moje podjetje');
      }
    };

    loadProfile();
  }, [user, getUserProfile]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/provider-login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading || (!user && !loading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-secondary">Nalaganje...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <AdminContextBar
          providerSlug={providerSlug}
          providerName={providerName || 'Moje podjetje'}
          adminName={adminName || 'Ponudnik'}
          adminEmail={adminEmail}
          onLogout={handleLogout}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="mb-8">
            <h1 className="font-heading font-bold text-3xl sm:text-4xl text-text-primary mb-2">
              Poročila
            </h1>
            <p className="text-text-secondary">
              Prihodek, zasedenost in trendi rezervacij po vaših nepremičninah
            </p>
          </div>

          <ReportsDashboardInteractive />
        </main>
      </div>
    </div>
  );
}
