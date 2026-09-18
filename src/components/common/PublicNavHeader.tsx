'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLink {
  href: string;
  label: string;
}

const navLinks: NavLink[] = [
  { href: '/', label: 'Domov' },
  { href: '/provider-landing-page', label: 'Rezervirajte nastanitev' },
  { href: '/my-booking', label: 'Moja rezervacija' },
];

export default function PublicNavHeader() {
  const pathname = usePathname();

  return (
    <header className="w-full bg-card border-b border-border shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-heading font-bold text-lg text-text-primary group-hover:text-primary transition-colors">
              BookingHub
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg font-caption text-sm font-medium transition-smooth ${
                    isActive
                      ? 'bg-primary/10 text-primary' :'text-text-secondary hover:text-text-primary hover:bg-muted'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/provider-login"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-caption font-medium text-text-secondary hover:text-primary transition-smooth"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Prijava ponudnika
            </Link>
            <Link
              href="/provider-landing-page"
              className="px-4 py-2 bg-primary text-white text-sm font-caption font-semibold rounded-lg hover:bg-primary-dark transition-smooth"
            >
              Rezerviraj zdaj
            </Link>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg font-caption text-xs font-medium transition-smooth ${
                  isActive
                    ? 'bg-primary/10 text-primary' :'text-text-secondary hover:text-text-primary hover:bg-muted'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
