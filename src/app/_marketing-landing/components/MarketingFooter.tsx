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
              The complete booking management platform for accommodation
              providers. Streamline operations, increase revenue, and deliver
              exceptional guest experiences.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-heading font-semibold text-lg text-text-primary mb-4">
              Product
            </h3>
            <ul className="space-y-2">
              <li>
                <button className="font-body text-text-secondary hover:text-primary transition-smooth">
                  Features
                </button>
              </li>
              <li>
                <button className="font-body text-text-secondary hover:text-primary transition-smooth">
                  Pricing
                </button>
              </li>
              <li>
                <button className="font-body text-text-secondary hover:text-primary transition-smooth">
                  Integrations
                </button>
              </li>
              <li>
                <Link
                  href="/login"
                  className="font-body text-text-secondary hover:text-primary transition-smooth"
                >
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-heading font-semibold text-lg text-text-primary mb-4">
              Company
            </h3>
            <ul className="space-y-2">
              <li>
                <button className="font-body text-text-secondary hover:text-primary transition-smooth">
                  About Us
                </button>
              </li>
              <li>
                <button className="font-body text-text-secondary hover:text-primary transition-smooth">
                  Contact
                </button>
              </li>
              <li>
                <button className="font-body text-text-secondary hover:text-primary transition-smooth">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button className="font-body text-text-secondary hover:text-primary transition-smooth">
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-caption text-sm text-text-secondary text-center sm:text-left">
            {currentYear !== null
              ? `© ${currentYear} BookingHub. All rights reserved.`
              : `© BookingHub. All rights reserved.`}
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
                PCI Compliant
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}