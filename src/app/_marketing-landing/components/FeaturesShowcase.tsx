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
    title: 'Poenoteno upravljanje koledarja',
    description:
      'Sinhronizirajte rezervacije med vsemi platformami v realnem času. Preprečite dvojne rezervacije s samodejnimi posodobitvami koledarja iz Airbnb, Booking.com in neposrednih rezervacij.',
  },
  {
    icon: 'ChartBarIcon',
    title: 'Napredna analitika in poročila',
    description:
      'Spremljajte stopnje zasedenosti, trende prihodkov in sezonske vzorce. Sprejemajte odločitve, podprte s podatki, z izčrpnimi poročili in vizualnimi nadzornimi ploščami.',
  },
  {
    icon: 'ChatBubbleLeftRightIcon',
    title: 'Središče za komunikacijo z gosti',
    description:
      'Združite vsa sporočila gostov v enem nabiralniku. Avtomatizirajte potrditve, pošiljajte opomnike in zagotavljajte izjemno storitev za stranke brez napora.',
  },
  {
    icon: 'CurrencyDollarIcon',
    title: 'Orodja za dinamično oblikovanje cen',
    description:
      'Optimizirajte svoj prihodek s pametnimi cenovnimi priporočili glede na povpraševanje, sezonskost in lokalne dogodke. Povečajte število rezervacij in dobiček.',
  },
  {
    icon: 'HomeModernIcon',
    title: 'Upravljanje več nepremičnin',
    description:
      'Upravljajte neomejeno število nepremičnin z ene nadzorne plošče. Popolno za rastoče portfelje z množičnimi operacijami in nastavitvami za posamezne nepremičnine.',
  },
  {
    icon: 'ShieldCheckIcon',
    title: 'Varna obdelava plačil',
    description:
      'Varno sprejemajte plačila z obdelavo v skladu s PCI. Podpora za več načinov plačila in valut s samodejnim usklajevanjem.',
  },
];

export default function FeaturesShowcase() {
  return (
    <section id="features" className="bg-background py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading font-semibold text-3xl sm:text-4xl lg:text-5xl text-text-primary mb-4">
            Vse, kar potrebujete za uspeh
          </h2>
          <p className="font-body text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto text-balance">
            BookingHub zagotavlja vsa orodja, ki jih ponudniki nastanitev
            potrebujejo za poenostavitev poslovanja, povečanje števila
            rezervacij in zagotavljanje izjemnih doživetij za goste.
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