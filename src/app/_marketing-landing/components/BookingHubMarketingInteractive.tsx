'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MarketingHeroSection from './MarketingHeroSection';
import FeaturesShowcase from './FeaturesShowcase';
import TestimonialsSection from './TestimonialsSection';
import PricingSection from './PricingSection';
import SignUpCTA from './SignUpCTA';
import MarketingFooter from './MarketingFooter';

export default function BookingHubMarketingInteractive() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleGetStarted = () => {
    if (!isHydrated) return;
    router?.push('/provider-signup');
  };

  const handleCloseModal = () => {
    setShowSignUpModal(false);
  };

  const handleSignUpSuccess = () => {
    setShowSignUpModal(false);
    router?.push('/login');
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Nalaganje...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeroSection onGetStarted={handleGetStarted} />
      <FeaturesShowcase />
      <TestimonialsSection />
      <PricingSection onSelectPlan={handleGetStarted} />
      <SignUpCTA onGetStarted={handleGetStarted} />
      <MarketingFooter />
    </div>
  );
}