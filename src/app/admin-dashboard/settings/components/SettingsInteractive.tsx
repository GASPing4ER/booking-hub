'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { slugifyPropertyLabel } from '@/lib/propertySlug';
import { allocateUniqueBusinessSlug, isStorefrontSlugAvailable } from '@/lib/providerProfileSlug';

interface SettingsInteractiveProps {
  adminName: string;
  adminEmail: string;
  providerName: string;
}

interface ProfileSettings {
  fullName: string;
  email: string;
  phone: string;
  bio: string;
}

interface BusinessSettings {
  businessName: string;
  businessSlug: string;
  businessEmail: string;
  businessPhone: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  currency: string;
}

interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type TabId = 'profile' | 'business' | 'security';

const getPasswordStrength = (password: string): { label: string; color: string; width: string } => {
  if (!password) return { label: '', color: '', width: '0%' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: 'Weak', color: 'bg-error', width: '25%' };
  if (score <= 2) return { label: 'Fair', color: 'bg-warning', width: '50%' };
  if (score <= 3) return { label: 'Good', color: 'bg-primary/70', width: '75%' };
  return { label: 'Strong', color: 'bg-success', width: '100%' };
};

const SettingsInteractive = ({
  adminName,
  adminEmail,
  providerName,
}: SettingsInteractiveProps) => {
  const { user } = useAuth();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Show/hide password toggles
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
    fullName: adminName,
    email: adminEmail,
    phone: '',
    bio: '',
  });

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    businessName: providerName,
    businessSlug: '',
    businessEmail: '',
    businessPhone: '',
    address: '',
    city: '',
    country: '',
    timezone: 'America/New_York',
    currency: 'USD',
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [suggestBusinessSlugBusy, setSuggestBusinessSlugBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfileSettings({
          fullName: data.full_name || adminName,
          email: data.email || adminEmail,
          phone: data.phone || '',
          bio: data.bio || '',
        });

        setBusinessSettings({
          businessName: data.business_name || providerName,
          businessSlug: typeof data.slug === 'string' && data.slug.trim() ? data.slug.trim() : '',
          businessEmail: data.business_email || '',
          businessPhone: data.business_phone || '',
          address: data.address || '',
          city: data.city || '',
          country: data.country || '',
          timezone: data.timezone || 'America/New_York',
          currency: data.currency || 'USD',
        });

        const derivedSlug =
          typeof data.slug === 'string' && data.slug.trim() ? data.slug.trim() : '';

        if (
          user?.id &&
          !derivedSlug &&
          ((data.business_name || '').trim() || providerName.trim())
        ) {
          try {
            const generated = await allocateUniqueBusinessSlug(
              supabase,
              (data.business_name || '').trim() || providerName.trim(),
              user.id,
            );
            const { error: slugErr } = await supabase
              .from('user_profiles')
              .update({ slug: generated, updated_at: new Date().toISOString() })
              .eq('id', user.id);

            if (!slugErr) {
              setBusinessSettings((prev) => ({ ...prev, businessSlug: generated }));
            }
          } catch (e: unknown) {
            console.error(
              'Error assigning storefront slug:',
              e instanceof Error ? e.message : e,
            );
          }
        }
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setSaveMessage({ type, text });
    setTimeout(() => setSaveMessage(null), 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user?.id,
          full_name: profileSettings.fullName,
          phone: profileSettings.phone,
          bio: profileSettings.bio,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      showFeedback('success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Error saving profile:', error.message);
      showFeedback('error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessSettings.businessName.trim()) {
      showFeedback('error', 'Business name is required');
      return;
    }
    setSaving(true);
    try {
      const rawPreference =
        businessSettings.businessSlug.trim() || businessSettings.businessName.trim();

      if (!rawPreference) {
        showFeedback(
          'error',
          'Enter a storefront URL slug, or clear it and rely on your business name to generate one.',
        );
        setSaving(false);
        return;
      }

      const resolvedSlug = slugifyPropertyLabel(rawPreference);

      const available = await isStorefrontSlugAvailable(supabase, resolvedSlug, user?.id);
      if (!available) {
        showFeedback(
          'error',
          'That storefront URL slug is already taken by another provider. Change it or click “Suggest from business name” for an available option.',
        );
        setSaving(false);
        return;
      }

      const { error } = await supabase.from('user_profiles').upsert({
        id: user?.id,
        business_name: businessSettings.businessName,
        business_email: businessSettings.businessEmail,
        business_phone: businessSettings.businessPhone,
        address: businessSettings.address,
        city: businessSettings.city,
        country: businessSettings.country,
        timezone: businessSettings.timezone,
        currency: businessSettings.currency,
        slug: resolvedSlug,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        const errCode = typeof error === 'object' && error && 'code' in error ? String((error as any).code) : '';
        const msg = String((error as any)?.message || '');
        const isDup = errCode === '23505' || msg.includes('duplicate') || msg.includes('unique');
        throw new Error(
          isDup
            ? 'That storefront URL slug is already in use. Pick another or use “Suggest from business name”.'
            : msg || 'Save failed',
        );
      }

      setBusinessSettings((prev) => ({ ...prev, businessSlug: resolvedSlug! }));
      showFeedback('success', 'Business details updated successfully');
    } catch (error: unknown) {
      console.error('Error saving business settings:', error);
      showFeedback(
        'error',
        error instanceof Error && error.message
          ? error.message
          : 'Failed to save business details. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!securitySettings.newPassword) {
      showFeedback('error', 'Please enter a new password');
      return;
    }
    if (securitySettings.newPassword.length < 8) {
      showFeedback('error', 'New password must be at least 8 characters');
      return;
    }
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      showFeedback('error', 'New passwords do not match');
      return;
    }

    setSaving(true);
    try {
      // Re-authenticate with current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: securitySettings.currentPassword,
      });

      if (signInError) {
        showFeedback('error', 'Current password is incorrect');
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: securitySettings.newPassword,
      });

      if (updateError) throw updateError;

      setSecuritySettings({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showFeedback('success', 'Password changed successfully');
    } catch (error: any) {
      console.error('Error changing password:', error.message);
      showFeedback('error', 'Failed to change password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex items-center gap-3 text-text-secondary">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="font-caption">Loading settings...</span>
        </div>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'profile', label: 'Provider Profile', icon: 'UserIcon' },
    { id: 'business', label: 'Business Details', icon: 'BuildingOfficeIcon' },
    { id: 'security', label: 'Account Security', icon: 'ShieldCheckIcon' },
  ];

  const passwordStrength = getPasswordStrength(securitySettings.newPassword);
  const storefrontPathPreview = slugifyPropertyLabel(
    businessSettings.businessSlug.trim() ||
      businessSettings.businessName.trim() ||
      'your-shop',
  );

  return (
    <div className="space-y-6">
      {/* Feedback Message */}
      {saveMessage && (
        <div
          className={`rounded-lg p-4 flex items-center gap-3 ${
            saveMessage.type === 'success' ?'bg-success/10 border border-success' :'bg-error/10 border border-error'
          }`}
        >
          <Icon
            name={saveMessage.type === 'success' ? 'CheckCircleIcon' : 'ExclamationCircleIcon'}
            variant="solid"
            size={20}
            className={saveMessage.type === 'success' ? 'text-success' : 'text-error'}
          />
          <span
            className={`font-caption font-medium ${
              saveMessage.type === 'success' ? 'text-success' : 'text-error'
            }`}
          >
            {saveMessage.text}
          </span>
        </div>
      )}

      {/* Tabs + Content Card */}
      <div className="bg-card rounded-lg border border-border shadow-hospitality-sm overflow-hidden">
        {/* Tab Bar */}
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-caption font-medium transition-smooth whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary bg-primary/5' :'text-text-secondary hover:text-text-primary hover:bg-muted'
              }`}
            >
              <Icon name={tab.icon as any} variant="outline" size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Provider Profile Tab ── */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
            <div>
              <h3 className="font-heading font-semibold text-xl text-text-primary mb-1">
                Provider Profile
              </h3>
              <p className="text-sm text-text-secondary mb-6">
                Update your personal information visible to guests and on your provider profile.
              </p>

              {/* Avatar placeholder */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-muted/50 rounded-lg border border-border">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-heading font-bold text-2xl text-primary-foreground">
                    {profileSettings.fullName.charAt(0).toUpperCase() || 'P'}
                  </span>
                </div>
                <div>
                  <p className="font-caption font-medium text-text-primary">{profileSettings.fullName || 'Provider'}</p>
                  <p className="text-sm text-text-secondary">{profileSettings.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                    Full Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profileSettings.fullName}
                    onChange={(e) => setProfileSettings((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="Your full name"
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                  />
                </div>
                <div>
                  <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileSettings.email}
                    disabled
                    className="w-full px-4 py-2.5 bg-muted border border-input rounded-md text-text-secondary cursor-not-allowed"
                  />
                  <p className="text-xs text-text-secondary mt-1">Email cannot be changed here</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileSettings.phone}
                    onChange={(e) => setProfileSettings((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                    Bio / About
                  </label>
                  <textarea
                    rows={3}
                    value={profileSettings.bio}
                    onChange={(e) => setProfileSettings((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="Tell guests a little about yourself..."
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-ring transition-smooth resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-smooth font-caption font-medium"
              >
                {saving && <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />}
                Save Profile
              </button>
            </div>
          </form>
        )}

        {/* ── Business Details Tab ── */}
        {activeTab === 'business' && (
          <form onSubmit={handleSaveBusiness} className="p-6 space-y-6">
            <div>
              <h3 className="font-heading font-semibold text-xl text-text-primary mb-1">
                Business Details
              </h3>
              <p className="text-sm text-text-secondary mb-6">
                Update your business information, public storefront URL, and details used for bookings and guest
                communications.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-4">
                  <div>
                    <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                      Business Name <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={businessSettings.businessName}
                      onChange={(e) =>
                        setBusinessSettings((p) => ({ ...p, businessName: e.target.value }))
                      }
                      placeholder="Your business or property name"
                      className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <label className="block text-sm font-caption font-medium text-text-secondary">
                        Storefront URL slug *
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          const name = businessSettings.businessName.trim();
                          if (!user?.id || !name) return;
                          setSuggestBusinessSlugBusy(true);
                          try {
                            const slug = await allocateUniqueBusinessSlug(supabase, name, user.id);
                            setBusinessSettings((prev) => ({ ...prev, businessSlug: slug }));
                          } catch (err) {
                            console.error(err);
                            showFeedback('error', 'Could not pick an available storefront slug. Try again.');
                          } finally {
                            setSuggestBusinessSlugBusy(false);
                          }
                        }}
                        disabled={
                          !businessSettings.businessName.trim() || suggestBusinessSlugBusy || !user?.id
                        }
                        className="text-xs font-caption text-primary hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Icon name="ArrowPathIcon" variant="outline" size={14} aria-hidden />
                        Suggest from business name
                      </button>
                    </div>
                    <input
                      type="text"
                      value={businessSettings.businessSlug}
                      onChange={(e) =>
                        setBusinessSettings((p) => ({ ...p, businessSlug: e.target.value }))
                      }
                      placeholder="seaside-retreat"
                      autoCapitalize="off"
                      spellCheck={false}
                      aria-describedby="business-slug-help"
                      className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary font-mono text-sm placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                    />
                    <p id="business-slug-help" className="text-xs text-text-secondary font-caption mt-2">
                      Public path for your shop: lowercase letters, numbers, hyphens only. Must be unique across all
                      providers. Saved value is validated before save — use “Suggest from business name” if yours is
                      taken. If left empty when you save, it is derived from your business name and checked the same way.
                    </p>
                    <p className="text-xs font-mono text-text-secondary font-caption mt-2 break-all">
                      /providers/{storefrontPathPreview}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                    Business Email
                  </label>
                  <input
                    type="email"
                    value={businessSettings.businessEmail}
                    onChange={(e) => setBusinessSettings((p) => ({ ...p, businessEmail: e.target.value }))}
                    placeholder="contact@yourbusiness.com"
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                  />
                </div>
                <div>
                  <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                    Business Phone
                  </label>
                  <input
                    type="tel"
                    value={businessSettings.businessPhone}
                    onChange={(e) => setBusinessSettings((p) => ({ ...p, businessPhone: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={businessSettings.address}
                    onChange={(e) => setBusinessSettings((p) => ({ ...p, address: e.target.value }))}
                    placeholder="123 Main Street"
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                  />
                </div>
                <div>
                  <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={businessSettings.city}
                    onChange={(e) => setBusinessSettings((p) => ({ ...p, city: e.target.value }))}
                    placeholder="City"
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                  />
                </div>
                <div>
                  <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={businessSettings.country}
                    onChange={(e) => setBusinessSettings((p) => ({ ...p, country: e.target.value }))}
                    placeholder="Country"
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                  />
                </div>
                <div>
                  <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                    Timezone
                  </label>
                  <select
                    value={businessSettings.timezone}
                    onChange={(e) => setBusinessSettings((p) => ({ ...p, timezone: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Australia/Sydney">Sydney (AEST)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                    Currency
                  </label>
                  <select
                    value={businessSettings.currency}
                    onChange={(e) => setBusinessSettings((p) => ({ ...p, currency: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                  >
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="CAD">CAD — Canadian Dollar</option>
                    <option value="AUD">AUD — Australian Dollar</option>
                    <option value="JPY">JPY — Japanese Yen</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-smooth font-caption font-medium"
              >
                {saving && <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />}
                Save Business Details
              </button>
            </div>
          </form>
        )}

        {/* ── Account Security Tab ── */}
        {activeTab === 'security' && (
          <div className="p-6 space-y-8">
            {/* Change Password Section */}
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <h3 className="font-heading font-semibold text-xl text-text-primary mb-1">
                  Change Password
                </h3>
                <p className="text-sm text-text-secondary mb-6">
                  Choose a strong password to keep your account secure. You must enter your current password to make changes.
                </p>

                <div className="space-y-4 max-w-md">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                      Current Password <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPw ? 'text' : 'password'}
                        required
                        value={securitySettings.currentPassword}
                        onChange={(e) => setSecuritySettings((p) => ({ ...p, currentPassword: e.target.value }))}
                        placeholder="Enter current password"
                        className="w-full px-4 py-2.5 pr-12 bg-background border border-input rounded-md text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-smooth"
                        aria-label={showCurrentPw ? 'Hide password' : 'Show password'}
                      >
                        <Icon name={showCurrentPw ? 'EyeSlashIcon' : 'EyeIcon'} variant="outline" size={20} />
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                      New Password <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        required
                        value={securitySettings.newPassword}
                        onChange={(e) => setSecuritySettings((p) => ({ ...p, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                        className="w-full px-4 py-2.5 pr-12 bg-background border border-input rounded-md text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-smooth"
                        aria-label={showNewPw ? 'Hide password' : 'Show password'}
                      >
                        <Icon name={showNewPw ? 'EyeSlashIcon' : 'EyeIcon'} variant="outline" size={20} />
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {securitySettings.newPassword && (
                      <div className="mt-2 space-y-1">
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: passwordStrength.width }}
                          />
                        </div>
                        <p className="text-xs text-text-secondary">
                          Strength: <span className="font-medium text-text-primary">{passwordStrength.label}</span>
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-text-secondary mt-1">Minimum 8 characters</p>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                      Confirm New Password <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPw ? 'text' : 'password'}
                        required
                        value={securitySettings.confirmPassword}
                        onChange={(e) => setSecuritySettings((p) => ({ ...p, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                        className={`w-full px-4 py-2.5 pr-12 bg-background border rounded-md text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-ring transition-smooth ${
                          securitySettings.confirmPassword && securitySettings.confirmPassword !== securitySettings.newPassword
                            ? 'border-error' :'border-input'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-smooth"
                        aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                      >
                        <Icon name={showConfirmPw ? 'EyeSlashIcon' : 'EyeIcon'} variant="outline" size={20} />
                      </button>
                    </div>
                    {securitySettings.confirmPassword && securitySettings.confirmPassword !== securitySettings.newPassword && (
                      <p className="text-xs text-error mt-1">Passwords do not match</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-start pt-4 border-t border-border">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-smooth font-caption font-medium"
                >
                  {saving && <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />}
                  <Icon name="LockClosedIcon" variant="outline" size={18} />
                  Update Password
                </button>
              </div>
            </form>

            {/* Security Info Section */}
            <div className="pt-6 border-t border-border">
              <h3 className="font-heading font-semibold text-xl text-text-primary mb-4">
                Account Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Icon name="EnvelopeIcon" variant="outline" size={20} className="text-primary" />
                    <div>
                      <p className="font-caption font-medium text-text-primary text-sm">Email Address</p>
                      <p className="text-sm text-text-secondary">{adminEmail}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-caption font-medium text-success bg-success/10 px-2.5 py-1 rounded-full">
                    <Icon name="CheckCircleIcon" variant="solid" size={14} className="text-success" />
                    Verified
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Icon name="ShieldCheckIcon" variant="outline" size={20} className="text-primary" />
                    <div>
                      <p className="font-caption font-medium text-text-primary text-sm">Two-Factor Authentication</p>
                      <p className="text-sm text-text-secondary">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <span className="text-xs font-caption font-medium text-text-secondary bg-muted px-2.5 py-1 rounded-full">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsInteractive;