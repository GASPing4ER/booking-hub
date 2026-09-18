'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function LoginInteractive() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      router.push('/admin-dashboard');
    } catch (err: any) {
      setError(err.message || 'Prijava ni uspela. Preverite svoje podatke.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-3xl text-text-primary mb-2">
            Prijava skrbnika
          </h1>
          <p className="text-text-secondary">
            Prijavite se za dostop do nadzorne plošče
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              E-poštni naslov
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              Geslo
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="Vnesite svoje geslo"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-semibold py-3 px-6 rounded-lg hover:bg-primary-dark transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Prijavljanje...' : 'Prijavite se'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <Link
            href="/forgot-password"
            className="block text-sm text-primary hover:text-primary-dark transition-smooth font-medium"
          >
            Ste pozabili geslo?
          </Link>
          <Link
            href="/"
            className="block text-sm text-primary hover:text-primary-dark transition-smooth"
          >
            ← Nazaj na začetno stran
          </Link>
        </div>
      </div>
    </div>
  );
}