import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

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
    const { guestEmail, guestName, bookingId, propertyName, checkIn, checkOut, guests, totalAmount } = await req.json();

    if (!guestEmail || !bookingId || !propertyName || !checkIn || !checkOut) {
      throw new Error("Missing required fields");
    }

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

    const ref = String(bookingId);
    const shortRef = ref.length >= 8 ? ref.slice(0, 8).toUpperCase() : ref.toUpperCase();

    const amountNum = parseFloat(String(totalAmount ?? "0"));
    const guestsLabel = guests != null ? String(guests) : "—";

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
    <div style="background:#166534;padding:32px 40px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">You're all set!</h1>
      <p style="color:#bbf7d0;margin:8px 0 0;font-size:14px;">Your booking is confirmed</p>
    </div>
    <div style="padding:40px;">
      <p style="color:#374151;font-size:16px;margin:0 0 24px;">
        Hi <strong>${guestName}</strong>,<br><br>
        Good news — your host has confirmed your reservation. Details are below.
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="color:#15803d;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px;">Booking reference</p>
        <p style="color:#166534;font-size:20px;font-weight:700;margin:0;letter-spacing:0.05em;">#${shortRef}</p>
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
          <td style="padding:12px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${guestsLabel}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;color:#6b7280;font-size:14px;font-weight:700;">Total</td>
          <td style="padding:12px 0;color:#166534;font-size:18px;font-weight:700;text-align:right;">$${amountNum.toFixed(2)}</td>
        </tr>
      </table>
      <p style="color:#6b7280;font-size:13px;margin:0;">
        See you soon.<br><br>
        <strong>The BookingHub Team</strong>
      </p>
    </div>
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">Automated message — please contact the property for changes.</p>
    </div>
  </div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: [guestEmail],
        subject: `Confirmed: ${propertyName} (#${shortRef})`,
        html: emailHtml,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to send email");

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
