import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      salon_user_id,
      staff_member_id,
      product_id,
      booking_date,
      booking_time,
      end_time,
      customer_name,
      customer_phone,
      customer_email,
      payment_method,
      customer_user_id,
    } = body;

    if (!salon_user_id || !booking_date || !booking_time || !customer_name) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Create storefront booking
    const { data: booking, error: bookingError } = await supabase
      .from("storefront_bookings")
      .insert({
        customer_user_id: customer_user_id || null,
        salon_user_id,
        staff_member_id: staff_member_id || null,
        product_id: product_id || null,
        booking_date,
        booking_time,
        end_time: end_time || null,
        customer_name,
        customer_phone: customer_phone || null,
        customer_email: customer_email || null,
        payment_method: payment_method || 'on_site',
        payment_status: payment_method === 'online' ? 'pending' : 'not_required',
        status: 'confirmed',
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Also create a reservation in the salon's reservation system
    const { error: resError } = await supabase
      .from("reservations")
      .insert({
        user_id: salon_user_id,
        customer_name,
        customer_phone: customer_phone || null,
        customer_email: customer_email || null,
        reservation_date: booking_date,
        reservation_time: booking_time,
        end_time: end_time || null,
        staff_member_id: staff_member_id || null,
        product_id: product_id || null,
        source: 'storefront',
        status: 'confirmed',
        party_size: 1,
      });

    if (resError) {
      console.error("Error creating reservation:", resError);
    }

    return new Response(JSON.stringify({ success: true, booking }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
