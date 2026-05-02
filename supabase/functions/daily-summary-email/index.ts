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
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all providers (users who own at least one property)
    const { data: providers, error: providerError } = await adminClient
      .from("user_profiles")
      .select("id, full_name, email");

    if (providerError) throw providerError;

    const results: { email: string; status: string }[] = [];

    for (const provider of providers || []) {
      // Get provider's properties
      const { data: properties } = await adminClient
        .from("properties")
        .select("id, name")
        .eq("owner_id", provider.id);

      if (!properties || properties.length === 0) continue;

      const propertyIds = properties.map((p: any) => p.id);
      const propertyMap: Record<string, string> = {};
      properties.forEach((p: any) => { propertyMap[p.id] = p.name; });

      // Pending bookings
      const { data: pendingBookings } = await adminClient
        .from("bookings")
        .select("id, guest_name, check_in, check_out, guests, total_amount, property_id")
        .in("property_id", propertyIds)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      // Today's check-ins
      const { data: checkIns } = await adminClient
        .from("bookings")
        .select("id, guest_name, guests, property_id")
        .in("property_id", propertyIds)
        .eq("check_in", todayStr)
        .in("status", ["confirmed", "pending"]);

      // Occupancy: confirmed bookings in last 30 days
      const { data: confirmedBookings } = await adminClient
        .from("bookings")
        .select("check_in, check_out, property_id")
        .in("property_id", propertyIds)
        .eq("status", "confirmed")
        .gte("check_in", thirtyDaysAgo.toISOString().split("T")[0]);

      const totalBookedDays = (confirmedBookings || []).reduce((sum: number, b: any) => {
        const ci = new Date(b.check_in);
        const co = new Date(b.check_out);
        return sum + Math.max(0, Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24)));
      }, 0);
      const occupancyRate = Math.min(100, (totalBookedDays / (properties.length * 30)) * 100);

      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + "T00:00:00");
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      };

      const pendingRows = (pendingBookings || []).map((b: any) => `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 12px;font-size:13px;color:#111827;">${b.guest_name}</td>
          <td style="padding:10px 12px;font-size:13px;color:#374151;">${propertyMap[b.property_id] || "—"}</td>
          <td style="padding:10px 12px;font-size:13px;color:#374151;">${formatDate(b.check_in)}</td>
          <td style="padding:10px 12px;font-size:13px;color:#374151;">${formatDate(b.check_out)}</td>
          <td style="padding:10px 12px;font-size:13px;color:#1e3a8a;font-weight:600;">$${parseFloat(b.total_amount).toFixed(2)}</td>
        </tr>`).join("");

      const checkInRows = (checkIns || []).map((b: any) => `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 12px;font-size:13px;color:#111827;">${b.guest_name}</td>
          <td style="padding:10px 12px;font-size:13px;color:#374151;">${propertyMap[b.property_id] || "—"}</td>
          <td style="padding:10px 12px;font-size:13px;color:#374151;">${b.guests} guest${b.guests !== 1 ? "s" : ""}</td>
        </tr>`).join("");

      const providerEmail = provider.email;
      if (!providerEmail) continue;

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Daily Booking Summary</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:640px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
    <!-- Header -->
    <div style="background:#1e3a8a;padding:28px 40px;">
      <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">📋 Daily Booking Summary</h1>
      <p style="color:#93c5fd;margin:6px 0 0;font-size:14px;">${today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
    </div>

    <div style="padding:32px 40px;">
      <p style="color:#374151;font-size:15px;margin:0 0 28px;">
        Hi <strong>${provider.full_name || "Provider"}</strong>, here's your daily snapshot for ${properties.length} propert${properties.length !== 1 ? "ies" : "y"}.
      </p>

      <!-- Metrics Row -->
      <div style="display:flex;gap:16px;margin-bottom:32px;">
        <div style="flex:1;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;text-align:center;">
          <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px;">Pending</p>
          <p style="color:#1e3a8a;font-size:28px;font-weight:700;margin:0;">${(pendingBookings || []).length}</p>
          <p style="color:#6b7280;font-size:11px;margin:4px 0 0;">need action</p>
        </div>
        <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center;">
          <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px;">Check-ins Today</p>
          <p style="color:#166534;font-size:28px;font-weight:700;margin:0;">${(checkIns || []).length}</p>
          <p style="color:#6b7280;font-size:11px;margin:4px 0 0;">arriving today</p>
        </div>
        <div style="flex:1;background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:16px;text-align:center;">
          <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px;">Occupancy (30d)</p>
          <p style="color:#92400e;font-size:28px;font-weight:700;margin:0;">${occupancyRate.toFixed(0)}%</p>
          <p style="color:#6b7280;font-size:11px;margin:4px 0 0;">confirmed stays</p>
        </div>
      </div>

      <!-- Pending Bookings -->
      <h2 style="color:#111827;font-size:16px;font-weight:700;margin:0 0 12px;">⏳ Pending Bookings (${(pendingBookings || []).length})</h2>
      ${(pendingBookings || []).length === 0
        ? `<p style="color:#6b7280;font-size:14px;margin:0 0 28px;">No pending bookings — you're all caught up!</p>`
        : `<table style="width:100%;border-collapse:collapse;margin-bottom:28px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Guest</th>
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Property</th>
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Check-in</th>
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Check-out</th>
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Total</th>
              </tr>
            </thead>
            <tbody>${pendingRows}</tbody>
          </table>`
      }

      <!-- Today's Check-ins -->
      <h2 style="color:#111827;font-size:16px;font-weight:700;margin:0 0 12px;">🏨 Today's Check-ins (${(checkIns || []).length})</h2>
      ${(checkIns || []).length === 0
        ? `<p style="color:#6b7280;font-size:14px;margin:0 0 28px;">No check-ins scheduled for today.</p>`
        : `<table style="width:100%;border-collapse:collapse;margin-bottom:28px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Guest</th>
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Property</th>
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Party Size</th>
              </tr>
            </thead>
            <tbody>${checkInRows}</tbody>
          </table>`
      }

      <!-- CTA -->
      <div style="text-align:center;margin-top:8px;">
        <a href="https://bookinghub8265.builtwithrocket.new/admin-dashboard"
           style="display:inline-block;background:#1e3a8a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
          Open Dashboard →
        </a>
      </div>
    </div>

    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">BookingHub Daily Digest · Sent every morning at 8:00 AM</p>
    </div>
  </div>
</body>
</html>`;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: [providerEmail],
          subject: `Daily Summary: ${(pendingBookings || []).length} pending, ${(checkIns || []).length} check-in${(checkIns || []).length !== 1 ? "s" : ""} today`,
          html: emailHtml,
        }),
      });

      const resData = await res.json();
      results.push({ email: providerEmail, status: res.ok ? "sent" : resData.message });
    }

    return new Response(JSON.stringify({ success: true, results }), {
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
