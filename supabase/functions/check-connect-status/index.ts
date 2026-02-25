import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@20.4.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// CORS headers for browser-based calls
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-CONNECT-STATUS] ${step}${detailsStr}`);
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

    // Step 2: Create Supabase client with service role for DB access
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
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id });

    // Step 4: Get the stored stripe_account_id from the database
    const { data: customer } = await supabaseClient
      .from('customers')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single();

    // If no account exists yet, return a "not connected" response
    if (!customer?.stripe_account_id) {
      logStep("No Stripe Connect account found");
      return new Response(JSON.stringify({
        connected: false,
        ready_to_receive_payments: false,
        onboarding_complete: false,
        account_id: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Step 5: Create Stripe client — no apiVersion needed, SDK uses latest
    const stripeClient = new Stripe(stripeKey);

    // Step 6: Retrieve the V2 account with expanded configuration and requirements
    // The `include` parameter fetches nested objects we need to check status
    const account = await stripeClient.v2.core.accounts.retrieve(
      customer.stripe_account_id,
      {
        include: ["configuration.recipient", "requirements"],
      }
    );

    // Step 7: Check if the account is ready to receive payments
    // The stripe_transfers capability must be "active" for destination charges to work
    const readyToReceivePayments =
      (account as any)?.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status === "active";

    // Step 8: Check onboarding completeness via requirements
    // If minimum_deadline.status is "currently_due" or "past_due", onboarding is incomplete
    const requirementsStatus =
      (account as any)?.requirements?.summary?.minimum_deadline?.status;
    const onboardingComplete =
      requirementsStatus !== "currently_due" && requirementsStatus !== "past_due";

    logStep("Account status retrieved", {
      accountId: account.id,
      readyToReceivePayments,
      onboardingComplete,
      requirementsStatus,
    });

    // Step 9: Return structured status to the frontend
    return new Response(JSON.stringify({
      connected: true,
      ready_to_receive_payments: readyToReceivePayments,
      onboarding_complete: onboardingComplete,
      requirements_status: requirementsStatus || null,
      account_id: account.id,
      // Legacy fields for backward compatibility with existing UI
      charges_enabled: readyToReceivePayments,
      payouts_enabled: readyToReceivePayments,
    }), {
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
