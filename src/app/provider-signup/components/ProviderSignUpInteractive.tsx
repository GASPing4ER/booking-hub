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
  { id: 'account', label: 'Account', description: 'Create your login credentials' },
  { id: 'business', label: 'Business', description: 'Tell us about your property' },
  { id: 'review', label: 'Review', description: 'Confirm your details' },
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
    if (!formData.fullName.trim()) return 'Full name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Please enter a valid email';
    if (formData.password.length < 8) return 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    return null;
  };

  const validateBusiness = (): string | null => {
    if (!formData.businessName.trim()) return 'Business name is required';
    if (!formData.businessEmail.trim()) return 'Business email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.businessEmail)) return 'Please enter a valid business email';
    if (!formData.city.trim()) return 'City is required';
    if (!formData.country.trim()) return 'Country is required';
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
      if (!authData.user) throw new Error('Failed to create account');

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
      setError(err.message || 'Failed to create account. Please try again.');
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
          Create Your Provider Account
        </h1>
        <p className="text-text-secondary">
          Join thousands of accommodation providers on BookingHub
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
            <h2 className="font-heading font-semibold text-xl text-text-primary mb-1">Account Details</h2>
            <p className="text-text-secondary text-sm mb-6">Set up your login credentials</p>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Confirm Password *</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Re-enter your password"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Business Details */}
        {currentStep === 'business' && (
          <div>
            <h2 className="font-heading font-semibold text-xl text-text-primary mb-1">Business Details</h2>
            <p className="text-text-secondary text-sm mb-6">Tell us about your accommodation business</p>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Business / Property Name *</label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => updateField('businessName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="e.g. Sunset Beach Resort"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Business Email *</label>
                <input
                  type="email"
                  value={formData.businessEmail}
                  onChange={(e) => updateField('businessEmail', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="bookings@yourproperty.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Business Phone</label>
                <input
                  type="tel"
                  value={formData.businessPhone}
                  onChange={(e) => updateField('businessPhone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="123 Main Street"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Miami"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Country *</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="United States"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 'review' && (
          <div>
            <h2 className="font-heading font-semibold text-xl text-text-primary mb-1">Review Your Details</h2>
            <p className="text-text-secondary text-sm mb-6">Please confirm everything looks correct before submitting</p>
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Account Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Full Name</span>
                    <span className="text-text-primary font-medium">{formData.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Email</span>
                    <span className="text-text-primary font-medium">{formData.email}</span>
                  </div>
                  {formData.phone && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Phone</span>
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
                  Business Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Business Name</span>
                    <span className="text-text-primary font-medium">{formData.businessName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Business Email</span>
                    <span className="text-text-primary font-medium">{formData.businessEmail}</span>
                  </div>
                  {formData.businessPhone && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Business Phone</span>
                      <span className="text-text-primary font-medium">{formData.businessPhone}</span>
                    </div>
                  )}
                  {formData.address && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Address</span>
                      <span className="text-text-primary font-medium">{formData.address}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Location</span>
                    <span className="text-text-primary font-medium">{formData.city}, {formData.country}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-text-secondary text-center">
                By creating an account, you agree to our{' '}
                <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>{' '}
                and{' '}
                <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>.
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
              Back
            </button>
          ) : (
            <Link
              href="/login"
              className="text-sm text-text-secondary hover:text-primary transition-smooth"
            >
              Already have an account? Sign in
            </Link>
          )}

          {currentStep !== 'review' ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all font-semibold text-sm"
            >
              Continue
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
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
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
