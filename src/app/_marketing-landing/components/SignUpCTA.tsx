import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface SignUpCTAProps {
  onGetStarted: () => void;
}

export default function SignUpCTA({ onGetStarted }: SignUpCTAProps) {
  return (
    <section className="bg-gradient-to-br from-primary via-secondary to-primary text-primary-foreground py-16 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl mb-6">
          Ste pripravljeni preoblikovati svoje upravljanje rezervacij?
        </h2>
        <p className="font-body text-lg sm:text-xl mb-10 text-primary-foreground/90 max-w-2xl mx-auto">
          Pridružite se tisočem ponudnikov nastanitev, ki zaupajo BookingHub pri
          poenostavljanju poslovanja in rasti svojega podjetja.
        </p>
        <button
          onClick={onGetStarted}
          className="inline-flex items-center gap-3 bg-accent text-accent-foreground px-10 py-5 rounded-md font-caption font-medium text-lg shadow-hospitality-lg hover:shadow-hospitality-lg hover:scale-105 transition-smooth"
        >
          <span>Začnite brezplačno 14-dnevno preizkusno obdobje</span>
          <Icon
            name="ArrowRightIcon"
            variant="outline"
            size={24}
            className="text-accent-foreground"
          />
        </button>
        <p className="font-caption text-sm text-primary-foreground/80 mt-6">
          Brez potrebe po kreditni kartici • Prekličete lahko kadar koli • Nastavitev v nekaj minutah
        </p>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-center justify-center gap-3">
            <Icon
              name="ShieldCheckIcon"
              variant="solid"
              size={24}
              className="text-accent"
            />
            <span className="font-caption text-sm text-primary-foreground">
              Varnost na bančni ravni
            </span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Icon
              name="ClockIcon"
              variant="solid"
              size={24}
              className="text-accent"
            />
            <span className="font-caption text-sm text-primary-foreground">
              Podpora 24/7
            </span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Icon
              name="CheckBadgeIcon"
              variant="solid"
              size={24}
              className="text-accent"
            />
            <span className="font-caption text-sm text-primary-foreground">
              99,9 % razpoložljivost
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}