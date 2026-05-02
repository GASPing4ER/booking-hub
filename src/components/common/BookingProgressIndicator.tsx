'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface ProgressStep {
  label: string;
  path: string;
  step: number;
}

interface BookingProgressIndicatorProps {
  currentStep: number;
  providerSlug: string;
  providerName?: string;
}

const BookingProgressIndicator = ({
  currentStep,
  providerSlug,
  providerName = 'Provider',
}: BookingProgressIndicatorProps) => {
  const steps: ProgressStep[] = [
    { label: 'Browse', path: `/providers/${providerSlug}/accommodations`, step: 1 },
    { label: 'Book', path: `/providers/${providerSlug}/booking-form-page`, step: 2 },
    {
      label: 'Confirm',
      path: `/providers/${providerSlug}/booking-confirmation`,
      step: 3,
    },
  ];

  return (
    <div className="w-full bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 sm:py-6">
          {/* Provider Branding */}
          <div className="mb-4 sm:mb-6">
            <Link
              href={`/providers/${providerSlug}/accommodations`}
              className="inline-flex items-center gap-2 group transition-smooth hover:opacity-80"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-md flex items-center justify-center">
                <Icon
                  name="HomeIcon"
                  variant="solid"
                  size={20}
                  className="text-primary-foreground"
                />
              </div>
              <span className="font-heading font-semibold text-lg sm:text-xl text-text-primary">
                {providerName}
              </span>
            </Link>
          </div>

          {/* Progress Steps - Desktop */}
          <div className="hidden sm:flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = currentStep === step.step;
              const isCompleted = currentStep > step.step;
              const isClickable = currentStep >= step.step;

              return (
                <React.Fragment key={step.step}>
                  <div className="flex items-center gap-3 flex-1">
                    <Link
                      href={isClickable ? step.path : '#'}
                      className={`flex items-center gap-3 transition-smooth ${
                        isClickable
                          ? 'cursor-pointer hover:opacity-80' :'cursor-not-allowed opacity-50'
                      }`}
                      onClick={(e) => !isClickable && e.preventDefault()}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-caption font-medium transition-smooth ${
                          isCompleted
                            ? 'bg-success text-success-foreground'
                            : isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isCompleted ? (
                          <Icon
                            name="CheckIcon"
                            variant="solid"
                            size={20}
                            className="text-success-foreground"
                          />
                        ) : (
                          step.step
                        )}
                      </div>
                      <span
                        className={`font-caption font-medium transition-smooth ${
                          isActive
                            ? 'text-primary'
                            : isCompleted
                            ? 'text-success' :'text-muted-foreground'
                        }`}
                      >
                        {step.label}
                      </span>
                    </Link>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 mx-4 bg-muted relative">
                      <div
                        className={`absolute inset-0 transition-smooth ${
                          currentStep > step.step
                            ? 'bg-success' :'bg-transparent'
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Progress Steps - Mobile (Vertical) */}
          <div className="flex sm:hidden flex-col gap-3">
            {steps.map((step) => {
              const isActive = currentStep === step.step;
              const isCompleted = currentStep > step.step;
              const isClickable = currentStep >= step.step;

              return (
                <Link
                  key={step.step}
                  href={isClickable ? step.path : '#'}
                  className={`flex items-center gap-3 transition-smooth ${
                    isClickable
                      ? 'cursor-pointer hover:opacity-80' :'cursor-not-allowed opacity-50'
                  }`}
                  onClick={(e) => !isClickable && e.preventDefault()}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-caption font-medium transition-smooth ${
                      isCompleted
                        ? 'bg-success text-success-foreground'
                        : isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <Icon
                        name="CheckIcon"
                        variant="solid"
                        size={16}
                        className="text-success-foreground"
                      />
                    ) : (
                      step.step
                    )}
                  </div>
                  <span
                    className={`font-caption font-medium transition-smooth ${
                      isActive
                        ? 'text-primary'
                        : isCompleted
                        ? 'text-success' :'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingProgressIndicator;