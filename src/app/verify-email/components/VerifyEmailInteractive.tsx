'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function VerifyEmailInteractive() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (!email || countdown > 0) return;
    setResending(true);
    setResendError('');
    setResendSuccess(false);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin-dashboard`,
        },
      });
      if (error) throw error;
      setResendSuccess(true);
      setCountdown(60);
    } catch (err: any) {
      setResendError(err.message || 'Ponovno pošiljanje e-pošte ni uspelo. Poskusite znova.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h1 className="font-heading font-bold text-2xl text-text-primary mb-3">
          Preverite svojo e-pošto
        </h1>
        <p className="text-text-secondary mb-2">
          Povezavo za potrditev smo poslali na:
        </p>
        {email && (
          <p className="font-semibold text-text-primary mb-4 break-all">{email}</p>
        )}
        <p className="text-text-secondary text-sm mb-8">
          Kliknite povezavo v e-pošti, da potrdite svoj račun in začnete uporabljati BookingHub. Povezava bo potekla čez 24 ur.
        </p>

        {/* Steps */}
        <div className="bg-gray-50 rounded-lg p-4 mb-8 text-left space-y-3">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Kaj storiti naprej</p>
          {[
            'Odprite e-pošto podjetja BookingHub',
            'Kliknite gumb "Potrdi e-pošto"',
            'Preusmerjeni boste na svojo nadzorno ploščo',
          ].map((step, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <p className="text-sm text-text-secondary">{step}</p>
            </div>
          ))}
        </div>

        {/* Resend */}
        {resendSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">Potrditvena e-pošta je bila uspešno ponovno poslana!</p>
          </div>
        )}
        {resendError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{resendError}</p>
          </div>
        )}

        <p className="text-sm text-text-secondary mb-3">Niste prejeli e-pošte?</p>
        <button
          onClick={handleResend}
          disabled={resending || countdown > 0 || !email}
          className="w-full py-3 px-4 border border-primary text-primary rounded-lg font-semibold text-sm hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {resending
            ? 'Pošiljanje...'
            : countdown > 0
            ? `Ponovno pošlji čez ${countdown} s`
            : 'Ponovno pošlji potrditveno e-pošto'}
        </button>

        <div className="flex items-center justify-center gap-4 text-sm">
          <Link href="/provider-signup" className="text-text-secondary hover:text-primary transition-smooth">
            ← Nazaj na registracijo
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/login" className="text-text-secondary hover:text-primary transition-smooth">
            Prijavite se
          </Link>
        </div>
      </div>
    </div>
  );
}
