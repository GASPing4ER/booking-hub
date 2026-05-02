'use client';

import React from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface ProviderBrandingHeaderProps {
  providerSlug: string;
  providerName: string;
  providerLogo?: string;
  showBackButton?: boolean;
  backButtonPath?: string;
}

const ProviderBrandingHeader = ({
  providerSlug,
  providerName,
  providerLogo,
  showBackButton = false,
  backButtonPath,
}: ProviderBrandingHeaderProps) => {
  return (
    <header className="w-full bg-card shadow-hospitality">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between py-4 pr-4 sm:pr-6 lg:pr-8">
          {/* Left Section - Back Button (if shown) */}
          {showBackButton && backButtonPath && (
            <Link
              href={backButtonPath}
              className="flex items-center gap-2 px-4 sm:px-6 lg:px-8 text-text-secondary hover:text-primary transition-smooth group"
            >
              <Icon
                name="ChevronLeftIcon"
                variant="outline"
                size={20}
                className="text-text-secondary group-hover:text-primary transition-smooth"
              />
              <span className="hidden sm:inline font-caption font-medium">
                Back
              </span>
            </Link>
          )}

          {/* Center/Left Section - Provider Branding */}
          <Link
            href={`/providers/${providerSlug}`}
            className={`flex items-center gap-3 group transition-smooth hover:opacity-80 ${
              showBackButton ? '' : 'pl-0'
            }`}
          >
            {providerLogo ? (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                <AppImage
                  src={providerLogo}
                  alt={`${providerName} logo`}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-md flex items-center justify-center flex-shrink-0">
                <Icon
                  name="HomeIcon"
                  variant="solid"
                  size={24}
                  className="text-primary-foreground"
                />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-heading font-semibold text-lg sm:text-xl text-text-primary">
                {providerName}
              </span>
              <span className="font-caption text-xs text-text-secondary hidden sm:block">
                Accommodation Booking
              </span>
            </div>
          </Link>

          {/* Right Section - Help/Support */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              className="w-10 h-10 rounded-md flex items-center justify-center text-text-secondary hover:bg-muted hover:text-primary transition-smooth"
              aria-label="Help"
            >
              <Icon
                name="QuestionMarkCircleIcon"
                variant="outline"
                size={24}
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ProviderBrandingHeader;