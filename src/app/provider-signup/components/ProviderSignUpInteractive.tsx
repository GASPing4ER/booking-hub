'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Step = 'account' | 'business' | 'review';

interface FormData {
  // Account details
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  // Business details
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

const STEPS: { id: Step; label: string; description: string }[] = [
  { id: 'account', label: 'Račun', description: 'Ustvarite svoje podatke za prijavo' },
  { id: 'business', label: 'Podjetje', description: 'Povejte nam o svoji nepremičnini' },
  { id: 'review', label: 'Pregled', description: 'Potrdite svoje podatke' },
];

export default function ProviderSignUpInteractive() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('account');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    phone: '',
    address: '',
    city: '',
    country: '',
  });

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateAccount = (): string | null => {
    if (!formData.fullName.trim()) return 'Polno ime je obvezno';
    if (!formData.email.trim()) return 'E-pošta je obvezna';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Vnesite veljaven e-poštni naslov';
    if (formData.password.length < 8) return 'Geslo mora vsebovati vsaj 8 znakov';
    if (formData.password !== formData.confirmPassword) return 'Gesli se ne ujemata';
    return null;
  };

  const validateBusiness = (): string | null => {
    if (!formData.businessName.trim()) return 'Ime podjetja je obvezno';
    if (!formData.businessEmail.trim()) return 'Poslovni e-poštni naslov je obvezen';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.businessEmail)) return 'Vnesite veljaven poslovni e-poštni naslov';
    if (!formData.city.trim()) return 'Mesto je obvezno';
    if (!formData.country.trim()) return 'Država je obvezna';
    return null;
  };

  const handleNext = () => {
    setError('');
    if (currentStep === 'account') {
      const err = validateAccount();
      if (err) { setError(err); return; }
      setCurrentStep('business');
    } else if (currentStep === 'business') {
      const err = validateBusiness();
      if (err) { setError(err); return; }
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    setError('');
    if (currentStep === 'business') setCurrentStep('account');
    else if (currentStep === 'review') setCurrentStep('business');
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin-dashboard`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Ustvarjanje računa ni uspelo');

      // Insert business profile data
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: authData.user.id,
          email: formData.email,
          full_name: formData.fullName,
          phone: formData.phone || null,
          business_name: formData.businessName,
          business_email: formData.businessEmail,
          business_phone: formData.businessPhone || null,
          address: formData.address || null,
          city: formData.city,
          country: formData.country,
        });

      if (profileError) throw profileError;

      // Redirect to email verification page
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (err: any) {
      setError(err.message || 'Ustvarjanje računa ni uspelo. Poskusite znova.');
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full max-w-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-primary font-semibold text-xl mb-6">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" />
          </svg>
          BookingHub
        </Link>
        <h1 className="font-heading font-bold text-3xl text-text-primary mb-2">
          Ustvarite svoj račun ponudnika
        </h1>
        <p className="text-text-secondary">
          Pridružite se tisočem ponudnikov nastanitev na BookingHub
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        {STEPS.map((step, idx) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                  idx < stepIndex
                    ? 'bg-primary text-white'
                    : idx === stepIndex
                    ? 'bg-primary text-white ring-4 ring-primary/20' :'bg-gray-200 text-gray-500'
                }`}
              >
                {idx < stepIndex ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span className={`text-xs mt-1 font-medium ${idx === stepIndex ? 'text-primary' : 'text-text-secondary'}`}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 mb-5 ${idx < stepIndex ? 'bg-primary' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-lg p-8" suppressHydrationWarning>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Step 1: Account Details */}
        {currentStep === 'account' && (
          <div>
            <h2 className="font-heading font-semibold text-xl text-text-primary mb-1">Podatki računa</h2>
            <p className="text-text-secondary text-sm mb-6">Nastavite svoje podatke za prijavo</p>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Polno ime *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Janez Novak"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">E-poštni naslov *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="janez@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Telefonska številka</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="+386 (0) 00 000 000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Geslo *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Vsaj 8 znakov"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Potrdi geslo *</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Ponovno vnesite svoje geslo"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Business Details */}
        {currentStep === 'business' && (
          <div>
            <h2 className="font-heading font-semibold text-xl text-text-primary mb-1">Podatki o podjetju</h2>
            <p className="text-text-secondary text-sm mb-6">Povejte nam o svoji nastanitveni dejavnosti</p>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Ime podjetja / nepremičnine *</label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => updateField('businessName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="npr. Letovišče Sončni zaliv"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Poslovni e-poštni naslov *</label>
                <input
                  type="email"
                  value={formData.businessEmail}
                  onChange={(e) => updateField('businessEmail', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="rezervacije@vasanepremicnina.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Poslovni telefon</label>
                <input
                  type="tel"
                  value={formData.businessPhone}
                  onChange={(e) => updateField('businessPhone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="+386 (0) 00 000 000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Naslov</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Glavna ulica 123"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Mesto *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Ljubljana"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Država *</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Slovenija"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 'review' && (
          <div>
            <h2 className="font-heading font-semibold text-xl text-text-primary mb-1">Preverite svoje podatke</h2>
            <p className="text-text-secondary text-sm mb-6">Prosimo, potrdite, da so vsi podatki pravilni, preden jih pošljete</p>
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Podatki računa
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Polno ime</span>
                    <span className="text-text-primary font-medium">{formData.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">E-pošta</span>
                    <span className="text-text-primary font-medium">{formData.email}</span>
                  </div>
                  {formData.phone && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Telefon</span>
                      <span className="text-text-primary font-medium">{formData.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Podatki o podjetju
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Ime podjetja</span>
                    <span className="text-text-primary font-medium">{formData.businessName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Poslovni e-poštni naslov</span>
                    <span className="text-text-primary font-medium">{formData.businessEmail}</span>
                  </div>
                  {formData.businessPhone && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Poslovni telefon</span>
                      <span className="text-text-primary font-medium">{formData.businessPhone}</span>
                    </div>
                  )}
                  {formData.address && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Naslov</span>
                      <span className="text-text-primary font-medium">{formData.address}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Lokacija</span>
                    <span className="text-text-primary font-medium">{formData.city}, {formData.country}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-text-secondary text-center">
                Z ustvarjanjem računa se strinjate z našimi{' '}
                <span className="text-primary cursor-pointer hover:underline">pogoji uporabe</span>{' '}
                in{' '}
                <span className="text-primary cursor-pointer hover:underline">pravilnikom o zasebnosti</span>.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          {currentStep !== 'account' ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 px-5 py-2.5 text-text-secondary hover:text-text-primary border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Nazaj
            </button>
          ) : (
            <Link
              href="/login"
              className="text-sm text-text-secondary hover:text-primary transition-smooth"
            >
              Že imate račun? Prijavite se
            </Link>
          )}

          {currentStep !== 'review' ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all font-semibold text-sm"
            >
              Nadaljuj
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Ustvarjanje računa...
                </>
              ) : (
                <>
                  Ustvari račun
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
