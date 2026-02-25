import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@20.4.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// CORS headers for browser-based calls
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CONNECT-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Step 1: Validate STRIPE_SECRET_KEY
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Step 2: Create Supabase client for DB lookups
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Step 3: Parse the request body — we need the product ID
    const { product_id } = await req.json();
    if (!product_id) throw new Error("product_id is required");

    // Step 4: Look up the product in our connect_products table
    const { data: product, error: productError } = await supabaseClient
      .from('connect_products')
      .select('*')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      throw new Error("Product not found");
    }
    logStep("Product found", { name: product.name, price_cents: product.price_cents });

    // Step 5: Get the connected account ID for this product's owner
    const { data: customer } = await supabaseClient
      .from('customers')
      .select('stripe_account_id')
      .eq('id', product.user_id)
      .single();

    if (!customer?.stripe_account_id) {
      throw new Error("The salon owner has not connected their Stripe account yet");
    }
    logStep("Connected account found", { accountId: customer.stripe_account_id });

    // Step 6: Create Stripe client — no apiVersion needed
    const stripeClient = new Stripe(stripeKey);

    // Step 7: Calculate the application fee (platform commission)
    // 10% of the total price goes to the platform as commission
    const applicationFeeAmount = Math.round(product.price_cents * 0.10);
    logStep("Application fee calculated", {
      total: product.price_cents,
      fee: applicationFeeAmount,
      toSalon: product.price_cents - applicationFeeAmount,
    });

    // Step 8: Get the origin URL for success/cancel redirects
    const origin = req.headers.get("origin") || "https://example.com";

    // Step 9: Create a Checkout Session using Destination Charges
    // This is the recommended approach for platforms:
    // - The payment is processed on the platform's Stripe account
    // - The application_fee_amount is kept by the platform
    // - The rest is automatically transferred to the connected account
    const session = await stripeClient.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: product.currency,
            product_data: {
              name: product.name,
              description: product.description || undefined,
            },
            unit_amount: product.price_cents,
          },
          quantity: 1,
        },
      ],
      // Destination charge: the payment intent automatically transfers funds
      payment_intent_data: {
        // The platform keeps this amount as commission
        application_fee_amount: applicationFeeAmount,
        // The rest goes to the connected account (salon)
        transfer_data: {
          destination: customer.stripe_account_id,
        },
      },
      mode: 'payment',
      // Redirect URLs after checkout
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/storefront`,
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Step 10: Return the checkout URL
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
