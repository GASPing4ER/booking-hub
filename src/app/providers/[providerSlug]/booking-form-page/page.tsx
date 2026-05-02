import type { Metadata } from 'next';
import BookingProgressIndicator from '@/components/common/BookingProgressIndicator';
import ProviderBrandingHeader from '@/components/common/ProviderBrandingHeader';
import BookingFormInteractive from './components/BookingFormInteractive';

export const metadata: Metadata = {
  title: 'Book Your Stay - BookingHub',
  description:
    'Complete your accommodation booking request by selecting dates, providing guest information, and submitting your reservation for review.',
};

type Props = {
  params: Promise<{ providerSlug: string }>;
  searchParams: Promise<{ accommodation?: string }>;
};

export default async function BookingFormPage({ params, searchParams }: Props) {
  const { providerSlug } = await params;
  const { accommodation: accommodationPreset } = await searchParams;
  const listingsPath = `/providers/${providerSlug}/accommodations`;

  return (
    <div className="min-h-screen bg-background">
      <ProviderBrandingHeader
        providerSlug={providerSlug}
        providerName="BookingHub"
        providerLogo="/images/bookinghub-logo.png"
        showBackButton={true}
        backButtonPath={listingsPath}
      />

      <BookingProgressIndicator
        currentStep={2}
        providerSlug={providerSlug}
        providerName="BookingHub"
      />

      <BookingFormInteractive
        providerSlug={providerSlug}
        initialAccommodationId={accommodationPreset?.trim() || null}
      />
    </div>
  );
}
