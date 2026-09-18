import React from 'react';
import { Metadata } from 'next';
import BookingHubMarketingInteractive from './_marketing-landing/components/BookingHubMarketingInteractive';

export const metadata: Metadata = {
  title: 'BookingHub - Celovito upravljanje rezervacij za ponudnike nastanitev',
  description:
    'Poenostavite svoje nastanitveno poslovanje z BookingHub. Upravljajte rezervacije, sinhronizirajte koledarje, spremljajte analitiko in komunicirajte z gosti - vse na eni zmogljivi platformi.',
};

export default function HomePage() {
  return <BookingHubMarketingInteractive />;
}
