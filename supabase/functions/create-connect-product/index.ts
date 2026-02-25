import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@20.3.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// CORS headers for browser-based calls
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CONNECT-PRODUCT] ${step}${detailsStr}`);
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

    // Step 2: Create Supabase client for DB operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Step 3: Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Step 4: Get the user's stripe_account_id (connected account)
    const { data: customer } = await supabaseClient
      .from('customers')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single();

    if (!customer?.stripe_account_id) {
      throw new Error("You must connect your Stripe account before creating products. Complete the onboarding first.");
    }

    // Step 5: Parse the product details from the request body
    const { name, description, price_cents, currency = 'eur' } = await req.json();

    if (!name || !price_cents) {
      throw new Error("Product name and price_cents are required");
    }

    // Step 6: Create Stripe client — no apiVersion needed
    const stripeClient = new Stripe(stripeKey);

    // Step 7: Create a Stripe product at the PLATFORM level (not on the connected account)
    // The product is owned by the platform. We store the connected account ID in metadata
    // so we know which salon this product belongs to for destination charges.
    const product = await stripeClient.products.create({
      name: name,
      description: description || undefined,
      // default_price_data creates both a product and a price in one call
      default_price_data: {
        unit_amount: price_cents,
        currency: currency,
      },
      // Store the connected account ID in metadata for later lookup
      metadata: {
        connected_account_id: customer.stripe_account_id,
        user_id: user.id,
      },
    });

    logStep("Stripe product created", {
      productId: product.id,
      priceId: product.default_price,
    });

    // Step 8: Store the product mapping in our connect_products table
    // This links the Stripe product to the salon owner for the storefront
    const { data: savedProduct, error: insertError } = await supabaseClient
      .from('connect_products')
      .insert({
        user_id: user.id,
        stripe_product_id: product.id,
        stripe_price_id: typeof product.default_price === 'string'
          ? product.default_price
          : (product.default_price as any)?.id || '',
        name: name,
        description: description || null,
        price_cents: price_cents,
        currency: currency,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      logStep("ERROR saving product to DB", { error: insertError.message });
      throw new Error("Product created in Stripe but failed to save to database");
    }

    logStep("Product saved to database", { id: savedProduct.id });

    // Step 9: Return the created product
    return new Response(JSON.stringify(savedProduct), {
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
