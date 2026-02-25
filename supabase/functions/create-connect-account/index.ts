import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@20.4.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// CORS headers required for browser-based calls
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CONNECT-ACCOUNT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Step 1: Validate that the STRIPE_SECRET_KEY is present
    // PLACEHOLDER: Set STRIPE_SECRET_KEY in your Supabase secrets
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error(
        "STRIPE_SECRET_KEY is not set. Please add it to your Supabase secrets. " +
        "You can find your secret key at https://dashboard.stripe.com/apikeys"
      );
    }

    // Step 2: Create a Supabase client with service role key for DB writes
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Step 3: Authenticate the calling user via their JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Step 4: Create a Stripe client instance — no apiVersion needed, SDK uses latest
    const stripeClient = new Stripe(stripeKey);

    // Step 5: Check if this user already has a stripe_account_id stored in the DB
    const { data: customer } = await supabaseClient
      .from('customers')
      .select('stripe_account_id, company_name')
      .eq('id', user.id)
      .single();

    let accountId = customer?.stripe_account_id;

    if (!accountId) {
      // Step 6: Create a new Connected Account using the V2 Accounts API
      // Important: Do NOT use top-level `type: 'express'` — use `dashboard: 'express'` instead
      // The platform is responsible for fee collection and loss handling
      const account = await stripeClient.v2.core.accounts.create({
        // Display name shown in the Express dashboard
        display_name: customer?.company_name || user.email,
        // Contact email for the connected account
        contact_email: user.email,
        // Country where the connected account is based
        identity: {
          country: 'de', // Germany — change to your target country
        },
        // Use the Express dashboard for simplified onboarding
        dashboard: 'express',
        // Platform collects fees and is responsible for losses
        defaults: {
          responsibilities: {
            fees_collector: 'application',
            losses_collector: 'application',
          },
        },
        // Request the stripe_transfers capability so the platform can
        // send funds to this connected account via destination charges
        configuration: {
          recipient: {
            capabilities: {
              stripe_balance: {
                stripe_transfers: {
                  requested: true,
                },
              },
            },
          },
        },
      });

      accountId = account.id;
      logStep("V2 Connected Account created", { accountId });

      // Step 7: Save the new account ID in the customers table
      const { error: updateError } = await supabaseClient
        .from('customers')
        .update({ stripe_account_id: accountId })
        .eq('id', user.id);

      if (updateError) {
        logStep("ERROR saving stripe_account_id", { error: updateError.message });
        throw new Error("Failed to save Stripe account ID to database");
      }
      logStep("stripe_account_id saved to database");
    } else {
      logStep("Existing Connected Account found", { accountId });
    }

    // Step 8: Parse the request body for return/refresh URLs
    let returnUrl = `${req.headers.get("origin")}/portal/subscriptions?connect=complete`;
    let refreshUrl = `${req.headers.get("origin")}/portal/subscriptions?connect=refresh`;

    try {
      const body = await req.json();
      if (body.return_url) returnUrl = body.return_url;
      if (body.refresh_url) refreshUrl = body.refresh_url;
    } catch { /* no body is fine, use defaults */ }

    // Step 9: Create an Account Link using the V2 Account Links API
    // This generates a URL where the connected account holder can complete onboarding
    const accountLink = await stripeClient.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: 'account_onboarding',
        account_onboarding: {
          // 'recipient' matches the configuration we set up above
          configurations: ['recipient'],
          // Where to redirect if the link expires or user needs to restart
          refresh_url: refreshUrl,
          // Where to redirect after successful onboarding
          return_url: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}accountId=${accountId}`,
        },
      },
    });

    logStep("V2 Account Link created", { url: accountLink.url });

    // Step 10: Return the onboarding URL to the frontend
    return new Response(JSON.stringify({ url: accountLink.url, account_id: accountId }), {
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
