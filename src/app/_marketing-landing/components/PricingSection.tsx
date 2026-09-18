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
    name: 'Začetni',
    price: '$29',
    period: 'na mesec',
    description: 'Popolno za posamezne lastnike nepremičnin, ki šele začenjajo',
    features: [
      'Do 3 nepremičnine',
      'Sinhronizacija koledarja',
      'Osnovna analitika',
      'Podpora po e-pošti',
      'Dostop do mobilne aplikacije',
    ],
    highlighted: false,
    cta: 'Začnite brezplačno preizkusno obdobje',
  },
  {
    name: 'Profesionalni',
    price: '$79',
    period: 'na mesec',
    description: 'Idealno za rastoče portfelje in upravnike nepremičnin',
    features: [
      'Do 15 nepremičnin',
      'Napredna sinhronizacija koledarja',
      'Izčrpna analitika',
      'Prednostna podpora',
      'Središče za komunikacijo z gosti',
      'Orodja za dinamično oblikovanje cen',
      'Prilagojena znamka',
    ],
    highlighted: true,
    cta: 'Začnite brezplačno preizkusno obdobje',
  },
  {
    name: 'Poslovni',
    price: 'Po dogovoru',
    period: 'kontaktirajte nas',
    description: 'Za velika podjetja, ki potrebujejo napredne funkcionalnosti',
    features: [
      'Neomejeno število nepremičnin',
      'Vse funkcionalnosti paketa Profesionalni',
      'Osebni skrbnik računa',
      'Telefonska podpora 24/7',
      'Dostop do API',
      'Prilagojene integracije',
      'Možnosti brez znamke (white-label)',
    ],
    highlighted: false,
    cta: 'Stopite v stik s prodajo',
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
            Preprost in pregleden cenik
          </h2>
          <p className="font-body text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto">
            Izberite paket, ki ustreza vašemu poslovanju. Vsi paketi vključujejo
            14-dnevno brezplačno preizkusno obdobje brez potrebe po kreditni
            kartici.
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
                  Najbolj priljubljen
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
            Vsi paketi vključujejo SSL varnost, samodejne varnostne kopije in
            redne posodobitve. Brez skritih stroškov.
          </p>
        </div>
      </div>
    </section>
  );
}