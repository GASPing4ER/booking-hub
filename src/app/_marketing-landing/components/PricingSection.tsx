import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  cta: string;
}

const plans: PricingPlan[] = [
  {
    name: 'Starter',
    price: '$29',
    period: 'per month',
    description: 'Perfect for individual property owners getting started',
    features: [
      'Up to 3 properties',
      'Calendar synchronization',
      'Basic analytics',
      'Email support',
      'Mobile app access',
    ],
    highlighted: false,
    cta: 'Start Free Trial',
  },
  {
    name: 'Professional',
    price: '$79',
    period: 'per month',
    description: 'Ideal for growing portfolios and property managers',
    features: [
      'Up to 15 properties',
      'Advanced calendar sync',
      'Comprehensive analytics',
      'Priority support',
      'Guest communication hub',
      'Dynamic pricing tools',
      'Custom branding',
    ],
    highlighted: true,
    cta: 'Start Free Trial',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    description: 'For large operations requiring advanced features',
    features: [
      'Unlimited properties',
      'All Professional features',
      'Dedicated account manager',
      '24/7 phone support',
      'API access',
      'Custom integrations',
      'White-label options',
    ],
    highlighted: false,
    cta: 'Contact Sales',
  },
];

interface PricingSectionProps {
  onSelectPlan: () => void;
}

export default function PricingSection({ onSelectPlan }: PricingSectionProps) {
  return (
    <section className="bg-background py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading font-semibold text-3xl sm:text-4xl lg:text-5xl text-text-primary mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="font-body text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto">
            Choose the plan that fits your business. All plans include a 14-day
            free trial with no credit card required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-md p-8 ${
                plan.highlighted
                  ? 'bg-primary text-primary-foreground shadow-hospitality-lg ring-4 ring-accent scale-105'
                  : 'bg-card shadow-hospitality'
              }`}
            >
              {plan.highlighted && (
                <div className="inline-block bg-accent text-accent-foreground px-3 py-1 rounded-md font-caption text-sm font-medium mb-4">
                  Most Popular
                </div>
              )}
              <h3
                className={`font-heading font-semibold text-2xl mb-2 ${
                  plan.highlighted ? 'text-primary-foreground' : 'text-text-primary'
                }`}
              >
                {plan.name}
              </h3>
              <div className="mb-4">
                <span
                  className={`font-heading font-bold text-4xl ${
                    plan.highlighted ? 'text-accent' : 'text-primary'
                  }`}
                >
                  {plan.price}
                </span>
                <span
                  className={`font-caption text-sm ml-2 ${
                    plan.highlighted
                      ? 'text-primary-foreground/80'
                      : 'text-text-secondary'
                  }`}
                >
                  {plan.period}
                </span>
              </div>
              <p
                className={`font-body mb-6 ${
                  plan.highlighted
                    ? 'text-primary-foreground/90'
                    : 'text-text-secondary'
                }`}
              >
                {plan.description}
              </p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Icon
                      name="CheckCircleIcon"
                      variant="solid"
                      size={20}
                      className={`flex-shrink-0 mt-0.5 ${
                        plan.highlighted ? 'text-accent' : 'text-success'
                      }`}
                    />
                    <span
                      className={`font-body text-sm ${
                        plan.highlighted
                          ? 'text-primary-foreground'
                          : 'text-text-primary'
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                onClick={onSelectPlan}
                className={`w-full py-3 rounded-md font-caption font-medium transition-smooth ${
                  plan.highlighted
                    ? 'bg-accent text-accent-foreground hover:shadow-hospitality-lg hover:scale-105'
                    : 'bg-primary text-primary-foreground hover:shadow-hospitality-md hover:scale-105'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="font-caption text-text-secondary">
            All plans include SSL security, automatic backups, and regular
            updates. No hidden fees.
          </p>
        </div>
      </div>
    </section>
  );
}