'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

export default function MarketingFooter() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date()?.getFullYear());
  }, []);

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center">
                <Icon
                  name="CalendarIcon"
                  variant="solid"
                  size={24}
                  className="text-primary-foreground"
                />
              </div>
              <span className="font-heading font-semibold text-xl text-text-primary">
                BookingHub
              </span>
            </div>
            <p className="font-body text-text-secondary mb-4 max-w-md">
              Celovita platforma za upravljanje rezervacij za ponudnike
              nastanitev. Poenostavite poslovanje, povečajte prihodek in
              zagotovite izjemna doživetja za goste.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-heading font-semibold text-lg text-text-primary mb-4">
              Izdelek
            </h3>
            <ul className="space-y-2">
              <li>
                <button className="font-body text-text-secondary hover:text-primary transition-smooth">
                  Funkcionalnosti
                </button>
              </li>
              <li>
                <button className="font-body text-text-secondary hover:text-primary transition-smooth">
                  Cenik
                </button>
              </li>
              <li>
                <button className="font-body text-text-secondary hover:text-primary transition-smooth">
                  Integracije
                </button>
              </li>
              <li>
                <Link
                  href="/login"
                  className="font-body text-text-secondary hover:text-primary transition-smooth"
                >
                  Prijava
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-heading font-semibold text-lg text-text-primary mb-4">
              Podjetje
            </h3>
            <ul className="space-y-2">
              <li>
                <button className="font-body text-text-secondary hover:text-primary transition-smooth">
                  O nas
                </button>
              </li>
              <li>
                <button className="font-body text-text-secondary hover:text-primary transition-smooth">
                  Kontakt
                </button>
              </li>
              <li>
                <button className="font-body text-text-secondary hover:text-primary transition-smooth">
                  Pravilnik o zasebnosti
                </button>
              </li>
              <li>
                <button className="font-body text-text-secondary hover:text-primary transition-smooth">
                  Pogoji uporabe
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-caption text-sm text-text-secondary text-center sm:text-left">
            {currentYear !== null
              ? `© ${currentYear} BookingHub. Vse pravice pridržane.`
              : `© BookingHub. Vse pravice pridržane.`}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-success/10 rounded-md">
              <Icon
                name="ShieldCheckIcon"
                variant="solid"
                size={20}
                className="text-success"
              />
              <span className="font-caption text-sm text-success font-medium">
                Skladno s PCI
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}