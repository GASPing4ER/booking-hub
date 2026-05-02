import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  try {
    const { guestEmail, guestName, bookingId, propertyName, checkIn, checkOut, guests, totalAmount, propertyId } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr + "T00:00:00");
      return date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    };

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    // ── Guest confirmation email HTML ──────────────────────────────────────────
    const guestEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
    <div style="background:#1e3a8a;padding:32px 40px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Booking Confirmed!</h1>
      <p style="color:#93c5fd;margin:8px 0 0;font-size:14px;">Your reservation has been received</p>
    </div>
    <div style="padding:40px;">
      <p style="color:#374151;font-size:16px;margin:0 0 24px;">
        Hi <strong>${guestName}</strong>,<br><br>
        Thank you for your booking! We've received your reservation request and will confirm it shortly.
      </p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px;">Booking Reference</p>
        <p style="color:#1e3a8a;font-size:20px;font-weight:700;margin:0;letter-spacing:0.05em;">#${bookingId.slice(0, 8).toUpperCase()}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:12px 0;color:#6b7280;font-size:14px;">Property</td>
          <td style="padding:12px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${propertyName}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:12px 0;color:#6b7280;font-size:14px;">Check-in</td>
          <td style="padding:12px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${formatDate(checkIn)}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:12px 0;color:#6b7280;font-size:14px;">Check-out</td>
          <td style="padding:12px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${formatDate(checkOut)}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:12px 0;color:#6b7280;font-size:14px;">Duration</td>
          <td style="padding:12px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${nights} night${nights !== 1 ? "s" : ""}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:12px 0;color:#6b7280;font-size:14px;">Guests</td>
          <td style="padding:12px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${guests}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;color:#6b7280;font-size:14px;font-weight:700;">Total Amount</td>
          <td style="padding:12px 0;color:#1e3a8a;font-size:18px;font-weight:700;text-align:right;">$${parseFloat(totalAmount).toFixed(2)}</td>
        </tr>
      </table>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="color:#166534;font-size:14px;margin:0;">
          <strong>What's next?</strong> Your booking is currently pending confirmation. The host will review and confirm your reservation within 24 hours. You'll receive another email once confirmed.
        </p>
      </div>
      <p style="color:#6b7280;font-size:13px;margin:0;">
        If you have any questions, please reply to this email or contact us directly.<br><br>
        Best regards,<br>
        <strong>The BookingHub Team</strong>
      </p>
    </div>
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">This is an automated confirmation email. Please do not reply directly to this message.</p>
    </div>
  </div>
</body>
</html>`;

    // ── Send guest confirmation email ──────────────────────────────────────────
    const guestRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: [guestEmail],
        subject: `Booking Confirmation - ${propertyName} (#${bookingId.slice(0, 8).toUpperCase()})`,
        html: guestEmailHtml,
      }),
    });

    const guestData = await guestRes.json();
    if (!guestRes.ok) {
      throw new Error(guestData.message || "Failed to send guest email");
    }

    // ── Lookup provider email ──────────────────────────────────────────────────
    let providerEmail: string | null = null;
    let providerName = "Provider";

    if (propertyId) {
      try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
          const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

          const { data: property } = await adminClient
            .from("properties")
            .select("owner_id")
            .eq("id", propertyId)
            .single();

          if (property?.owner_id) {
            const { data: profile } = await adminClient
              .from("user_profiles")
              .select("full_name, email")
              .eq("id", property.owner_id)
              .single();

            if (profile?.email) {
              providerEmail = profile.email;
              providerName = profile.full_name || "Provider";
            } else {
              // Fallback: get email from auth.users via admin API
              const { data: authUser } = await adminClient.auth.admin.getUserById(property.owner_id);
              providerEmail = authUser?.user?.email || null;
            }
          }
        }
      } catch (e) {
        console.error("Could not fetch provider email:", e);
      }
    }

    // ── Send provider alert email ──────────────────────────────────────────────
    if (providerEmail) {
      const providerEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Booking Alert</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
    <div style="background:#1e3a8a;padding:28px 40px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">🔔 New Booking Received</h1>
      <p style="color:#93c5fd;margin:8px 0 0;font-size:14px;">Action required — review and confirm</p>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#374151;font-size:15px;margin:0 0 20px;">
        Hi <strong>${providerName}</strong>,<br><br>
        A new booking has just been submitted for <strong>${propertyName}</strong>. Please log in to your dashboard to review and confirm.
      </p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px;">Booking Reference</p>
        <p style="color:#1e3a8a;font-size:18px;font-weight:700;margin:0;">#${bookingId.slice(0, 8).toUpperCase()}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 0;color:#6b7280;font-size:14px;">Guest</td>
          <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${guestName}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 0;color:#6b7280;font-size:14px;">Guest Email</td>
          <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${guestEmail}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 0;color:#6b7280;font-size:14px;">Property</td>
          <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${propertyName}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 0;color:#6b7280;font-size:14px;">Check-in</td>
          <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${formatDate(checkIn)}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 0;color:#6b7280;font-size:14px;">Check-out</td>
          <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${formatDate(checkOut)}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 0;color:#6b7280;font-size:14px;">Guests</td>
          <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${guests}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#6b7280;font-size:14px;font-weight:700;">Total</td>
          <td style="padding:10px 0;color:#1e3a8a;font-size:16px;font-weight:700;text-align:right;">$${parseFloat(totalAmount).toFixed(2)}</td>
        </tr>
      </table>
      <div style="text-align:center;margin-top:8px;">
        <a href="https://bookinghub8265.builtwithrocket.new/admin-dashboard/bookings"
           style="display:inline-block;background:#1e3a8a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
          Review Booking →
        </a>
      </div>
    </div>
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">BookingHub Admin Alert · Automated notification</p>
    </div>
  </div>
</body>
</html>`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: [providerEmail],
          subject: `New Booking: ${guestName} → ${propertyName} (#${bookingId.slice(0, 8).toUpperCase()})`,
          html: providerEmailHtml,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true, id: guestData.id }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
