import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booking_id } = await req.json();

    if (!booking_id) {
      return new Response(JSON.stringify({ error: "booking_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the booking
    const { data: booking, error: bookingError } = await supabase
      .from("storefront_bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: "Buchung nicht gefunden" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (booking.status === "cancelled") {
      return new Response(JSON.stringify({ error: "Buchung wurde bereits storniert" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get salon's cancellation_hours
    const { data: salon } = await supabase
      .from("customers")
      .select("cancellation_hours, company_name")
      .eq("id", booking.salon_user_id)
      .single();

    const cancellationHours = salon?.cancellation_hours || 24;

    // Check if cancellation is still allowed
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
    const now = new Date();
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilBooking < cancellationHours) {
      return new Response(
        JSON.stringify({
          error: `Stornierung nicht mehr möglich. Termine müssen mindestens ${cancellationHours} Stunden vorher storniert werden.`,
          hours_remaining: Math.max(0, Math.floor(hoursUntilBooking)),
          cancellation_hours: cancellationHours,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cancel the storefront booking
    const { error: updateError } = await supabase
      .from("storefront_bookings")
      .update({ status: "cancelled" })
      .eq("id", booking_id);

    if (updateError) throw updateError;

    // Cancel matching reservation
    await supabase
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("user_id", booking.salon_user_id)
      .eq("reservation_date", booking.booking_date)
      .eq("reservation_time", booking.booking_time)
      .eq("customer_name", booking.customer_name)
      .eq("source", "storefront");

    // Enqueue cancellation confirmation email to customer
    if (booking.customer_email) {
      try {
        await supabase.rpc("enqueue_email", {
          queue_name: "transactional_emails",
          payload: {
            template: "booking-cancellation",
            to: booking.customer_email,
            data: {
              customer_name: booking.customer_name,
              salon_name: salon?.company_name || "Salon",
              booking_date: booking.booking_date,
              booking_time: booking.booking_time,
            },
          },
        });
      } catch (e) {
        console.error("Failed to enqueue cancellation email:", e);
      }
    }

    // Notify salon owner
    await supabase.from("notifications").insert({
      user_id: booking.salon_user_id,
      title: "Stornierung",
      message: `${booking.customer_name} hat den Termin am ${booking.booking_date} um ${booking.booking_time} storniert.`,
      type: "warning",
    });

    return new Response(
      JSON.stringify({ success: true, message: "Buchung erfolgreich storniert" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[storefront-cancel] ERROR:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
