import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface Testimonial {
  name: string;
  business: string;
  location: string;
  rating: number;
  quote: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Sarah Mitchell',
    business: 'Coastal Villas',
    location: 'Miami, FL',
    rating: 5,
    quote:
      'BookingHub je preoblikoval način, kako upravljamo naših 12 nepremičnin. Samo sinhronizacija koledarja nam je prihranila več kot 10 ur na teden, analitika pa nam je pomagala povečati prihodek za 35 % v samo 6 mesecih.',
  },
  {
    name: 'James Chen',
    business: 'Mountain Retreat Cabins',
    location: 'Aspen, CO',
    rating: 5,
    quote:
      'Integracija med platformami je brezhibna. Od žongliranja s 3 različnimi sistemi smo prešli na eno poenoteno nadzorno ploščo. Napake pri rezervacijah so padle na nič, ocene zadovoljstva gostov pa so se izjemno izboljšale.',
  },
  {
    name: 'Maria Rodriguez',
    business: 'Downtown Suites',
    location: 'Austin, TX',
    rating: 5,
    quote:
      'Kot samostojni upravitelj 5 nepremičnin mi je BookingHub vrnil življenje. Funkcionalnosti za avtomatizacijo prevzamejo rutinska opravila, medtem ko se jaz osredotočam na zagotavljanje izjemnih doživetij za goste. Najboljša naložba doslej.',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="bg-muted py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading font-semibold text-3xl sm:text-4xl lg:text-5xl text-text-primary mb-4">
            Zaupajo nam ponudniki po vsem svetu
          </h2>
          <p className="font-body text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto">
            Pridružite se tisočem ponudnikov nastanitev, ki so z BookingHub
            preoblikovali svoje poslovanje
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card p-8 rounded-md shadow-hospitality"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Icon
                    key={i}
                    name="StarIcon"
                    variant="solid"
                    size={20}
                    className="text-accent"
                  />
                ))}
              </div>
              <p className="font-body text-text-primary mb-6 leading-relaxed italic">
                "{testimonial.quote}"
              </p>
              <div className="border-t border-border pt-4">
                <div className="font-heading font-semibold text-text-primary">
                  {testimonial.name}
                </div>
                <div className="font-caption text-sm text-text-secondary">
                  {testimonial.business}
                </div>
                <div className="font-caption text-xs text-text-secondary mt-1">
                  {testimonial.location}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}