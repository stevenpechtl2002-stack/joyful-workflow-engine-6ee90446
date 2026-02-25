import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@20.3.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CONNECT-ACCOUNT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // V1 Stripe client
    const stripeClient = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { data: customer } = await supabaseClient
      .from('customers')
      .select('stripe_account_id, company_name')
      .eq('id', user.id)
      .single();

    let accountId = customer?.stripe_account_id;

    if (!accountId) {
      // V1 Express Account creation
      const account = await stripeClient.accounts.create({
        type: 'express',
        country: 'de',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: customer?.company_name || undefined,
        },
      });

      accountId = account.id;
      logStep("V1 Express Account created", { accountId });

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

    let returnUrl = `${req.headers.get("origin")}/portal/subscriptions?connect=complete`;
    let refreshUrl = `${req.headers.get("origin")}/portal/subscriptions?connect=refresh`;

    try {
      const body = await req.json();
      if (body.return_url) returnUrl = body.return_url;
      if (body.refresh_url) refreshUrl = body.refresh_url;
    } catch { /* no body is fine */ }

    // V1 Account Link
    const accountLink = await stripeClient.accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      refresh_url: refreshUrl,
      return_url: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}accountId=${accountId}`,
    });

    logStep("V1 Account Link created", { url: accountLink.url });

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
