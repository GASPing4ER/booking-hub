import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: 'CalendarDaysIcon',
    title: 'Unified Calendar Management',
    description:
      'Sync bookings across all platforms in real-time. Prevent double bookings with automatic calendar updates from Airbnb, Booking.com, and direct reservations.',
  },
  {
    icon: 'ChartBarIcon',
    title: 'Advanced Analytics & Reports',
    description:
      'Track occupancy rates, revenue trends, and seasonal patterns. Make data-driven decisions with comprehensive reporting and visual dashboards.',
  },
  {
    icon: 'ChatBubbleLeftRightIcon',
    title: 'Guest Communication Hub',
    description:
      'Centralize all guest messages in one inbox. Automate confirmations, send reminders, and provide exceptional customer service effortlessly.',
  },
  {
    icon: 'CurrencyDollarIcon',
    title: 'Dynamic Pricing Tools',
    description:
      'Optimize your revenue with smart pricing recommendations based on demand, seasonality, and local events. Maximize bookings and profits.',
  },
  {
    icon: 'HomeModernIcon',
    title: 'Multi-Property Management',
    description:
      'Manage unlimited properties from a single dashboard. Perfect for growing portfolios with bulk operations and property-specific settings.',
  },
  {
    icon: 'ShieldCheckIcon',
    title: 'Secure Payment Processing',
    description:
      'Accept payments safely with PCI-compliant processing. Support multiple payment methods and currencies with automatic reconciliation.',
  },
];

export default function FeaturesShowcase() {
  return (
    <section id="features" className="bg-background py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading font-semibold text-3xl sm:text-4xl lg:text-5xl text-text-primary mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="font-body text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto text-balance">
            BookingHub provides all the tools accommodation providers need to
            streamline operations, increase bookings, and deliver exceptional
            guest experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card p-8 rounded-md shadow-hospitality hover:shadow-hospitality-md transition-smooth group"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-md flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-smooth">
                <Icon
                  name={feature.icon as any}
                  variant="outline"
                  size={32}
                  className="text-primary"
                />
              </div>
              <h3 className="font-heading font-semibold text-xl text-text-primary mb-3">
                {feature.title}
              </h3>
              <p className="font-body text-text-secondary leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}