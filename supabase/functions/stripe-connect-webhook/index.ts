import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@20.3.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-CONNECT-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const webhookSecret = Deno.env.get("STRIPE_CONNECT_WEBHOOK_SECRET");
    if (!webhookSecret) {
      logStep("ERROR: STRIPE_CONNECT_WEBHOOK_SECRET is not set");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const stripeClient = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    // V1 standard webhook verification
    let event: Stripe.Event;
    try {
      event = stripeClient.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      logStep("ERROR: Webhook signature verification failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      return new Response(JSON.stringify({ error: "Webhook signature verification failed" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    logStep("Event verified", { eventId: event.id, type: event.type });

    // Handle V1 Connect events
    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        logStep("Account updated", {
          accountId: account.id,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
        });

        // Optionally update DB status
        if (account.id) {
          const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            { auth: { persistSession: false } }
          );
          // Could update a status column if needed
          logStep("Account status logged for", { accountId: account.id });
        }
        break;
      }

      default: {
        logStep("Unhandled event type", { type: event.type });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});
