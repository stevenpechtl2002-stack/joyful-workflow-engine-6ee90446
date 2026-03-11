import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "npm:stripe@20.3.1";

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
      customer_user_id,
    } = await req.json();

    if (!salon_user_id || !booking_date || !booking_time || !customer_name) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get salon's Stripe account
    const { data: customer } = await supabase
      .from("customers")
      .select("stripe_account_id, company_name")
      .eq("id", salon_user_id)
      .single();

    if (!customer?.stripe_account_id) {
      // Salon has no Stripe Connect — fall back to on_site booking
      return new Response(
        JSON.stringify({ error: "Dieser Salon akzeptiert noch keine Online-Zahlungen. Bitte wähle 'Vor Ort'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get product details for price
    let productName = "Termin";
    let priceCents = 0;
    let durationMinutes = 30;

    if (product_id) {
      const { data: product } = await supabase
        .from("products")
        .select("name, price, duration_minutes")
        .eq("id", product_id)
        .single();

      if (product) {
        productName = product.name;
        priceCents = Math.round(product.price * 100);
        durationMinutes = product.duration_minutes;
      }
    }

    if (priceCents <= 0) {
      return new Response(
        JSON.stringify({ error: "Kein Preis für diesen Service hinterlegt." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "");

    // 10% platform commission
    const applicationFeeAmount = Math.round(priceCents * 0.10);

    const origin = req.headers.get("origin") || "https://example.com";

    // Store booking data in metadata so we can complete the booking after payment
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: productName,
              description: `${customer.company_name || "Salon"} · ${booking_date} um ${booking_time}`,
            },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: customer.stripe_account_id,
        },
      },
      mode: "payment",
      success_url: `${origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/storefront/${salon_user_id}`,
      metadata: {
        salon_user_id,
        staff_member_id: staff_member_id || "",
        product_id: product_id || "",
        booking_date,
        booking_time,
        end_time: end_time || "",
        customer_name,
        customer_phone: customer_phone || "",
        customer_email: customer_email || "",
        customer_user_id: customer_user_id || "",
      },
    });

    // Create storefront booking with payment_status = pending
    await supabase.from("storefront_bookings").insert({
      salon_user_id,
      staff_member_id: staff_member_id || null,
      product_id: product_id || null,
      booking_date,
      booking_time,
      end_time: end_time || null,
      customer_name,
      customer_phone: customer_phone || null,
      customer_email: customer_email || null,
      customer_user_id: customer_user_id || null,
      payment_method: "online",
      payment_status: "pending",
      status: "pending",
    });

    // Create reservation as pending (confirmed after payment)
    await supabase.from("reservations").insert({
      user_id: salon_user_id,
      customer_name,
      customer_phone: customer_phone || null,
      customer_email: customer_email || null,
      reservation_date: booking_date,
      reservation_time: booking_time,
      end_time: end_time || null,
      staff_member_id: staff_member_id || null,
      product_id: product_id || null,
      source: "storefront",
      status: "pending",
      party_size: 1,
      price_paid: priceCents / 100,
    });

    // Notify salon owner about pending booking
    await supabase.from("notifications").insert({
      user_id: salon_user_id,
      title: "Neue Online-Buchung",
      message: `${customer_name} hat einen Termin am ${booking_date} um ${booking_time} online gebucht (Zahlung ausstehend).`,
      type: "info",
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[create-storefront-checkout] ERROR:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
