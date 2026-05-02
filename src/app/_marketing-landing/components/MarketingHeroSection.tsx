import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface MarketingHeroSectionProps {
  onGetStarted: () => void;
}

export default function MarketingHeroSection({
  onGetStarted,
}: MarketingHeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground py-20 sm:py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 bg-primary-foreground/10 rounded-full mb-8">
            <Icon
              name="CalendarIcon"
              variant="solid"
              size={56}
              className="text-primary-foreground"
            />
          </div>
          <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl mb-6 text-balance">
            Complete Booking Management
            <br />
            <span className="text-accent">For Accommodation Providers</span>
          </h1>
          <p className="font-body text-lg sm:text-xl lg:text-2xl mb-10 text-primary-foreground/90 max-w-3xl mx-auto text-balance">
            Streamline your operations with BookingHub. Manage reservations,
            sync calendars across platforms, track analytics, and delight your
            guests - all from one powerful dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-3 bg-accent text-accent-foreground px-8 py-4 rounded-md font-caption font-medium text-lg shadow-hospitality-md hover:shadow-hospitality-lg transition-smooth hover:scale-105"
            >
              <span>Start Free Trial</span>
              <Icon
                name="ArrowRightIcon"
                variant="outline"
                size={24}
                className="text-accent-foreground"
              />
            </button>
            <button
              onClick={() => {
                document
                  .getElementById('features')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-3 bg-primary-foreground/10 text-primary-foreground px-8 py-4 rounded-md font-caption font-medium text-lg border-2 border-primary-foreground/20 hover:bg-primary-foreground/20 transition-smooth"
            >
              <span>Learn More</span>
            </button>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-md p-4">
              <div className="font-heading font-bold text-3xl text-accent mb-1">
                10,000+
              </div>
              <div className="font-caption text-sm text-primary-foreground/80">
                Active Properties
              </div>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-md p-4">
              <div className="font-heading font-bold text-3xl text-accent mb-1">
                98%
              </div>
              <div className="font-caption text-sm text-primary-foreground/80">
                Customer Satisfaction
              </div>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-md p-4">
              <div className="font-heading font-bold text-3xl text-accent mb-1">
                24/7
              </div>
              <div className="font-caption text-sm text-primary-foreground/80">
                Support Available
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}