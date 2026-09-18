export type BookingConfirmedEmailInput = {
  guestEmail: string;
  guestName: string;
  bookingId: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  /** Numeric string, e.g. "1196.00" (no currency symbol) */
  totalAmount: string;
};

/** Row shape from `bookings` + `properties (name)` — use before updating status so email data matches the database. */
export type BookingRowForConfirmEmail = {
  id: string;
  guest_name: string | null;
  guest_email: string | null;
  check_in: string;
  check_out: string;
  guests: number | null;
  total_amount: string | number | null;
  status: string | null;
  properties: { name?: string } | null;
};

/** Build guest email payload only when the booking is not already confirmed (handles pending/cancelled + casing). */
export function bookingRowToConfirmedEmailPayload(
  row: BookingRowForConfirmEmail
): BookingConfirmedEmailInput | null {
  const email = row.guest_email?.trim();
  if (!email) return null;
  const prior = String(row.status ?? '').toLowerCase().trim();
  if (prior === 'confirmed') return null;

  return {
    guestEmail: email,
    guestName: row.guest_name?.trim() || 'Gost',
    bookingId: row.id,
    propertyName: row.properties?.name ?? 'Vaša nastanitev',
    checkIn: row.check_in,
    checkOut: row.check_out,
    guests: row.guests ?? 1,
    totalAmount: parseFloat(String(row.total_amount ?? 0)).toFixed(2),
  };
}

/** Calls Supabase Edge Function + Resend; swallows errors so admin UI is not blocked. */
export async function sendBookingConfirmedEmail(input: BookingConfirmedEmailInput): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey || !input.guestEmail?.trim()) return;

  try {
    await fetch(`${supabaseUrl}/functions/v1/send-booking-confirmed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        guestEmail: input.guestEmail.trim(),
        guestName: input.guestName,
        bookingId: input.bookingId,
        propertyName: input.propertyName,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        guests: input.guests,
        totalAmount: input.totalAmount,
      }),
    });
  } catch {
    // optional: host already saved confirmation; email failure should not block UX
  }
}

export function bookingTotalAmountToNumericString(totalAmountDisplay: string): string {
  const n = parseFloat(totalAmountDisplay.replace(/[$,]/g, ''));
  if (Number.isNaN(n)) return '0';
  return n.toFixed(2);
}

export const BOOKING_SELECT_FOR_CONFIRM_EMAIL =
  'id, guest_name, guest_email, check_in, check_out, guests, total_amount, status, properties (name)' as const;