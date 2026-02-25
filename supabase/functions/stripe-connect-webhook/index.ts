import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

// No CORS needed for webhooks — Stripe calls this endpoint server-to-server
// No JWT verification — webhooks are authenticated via signature

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-CONNECT-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");

    // Step 1: Validate STRIPE_SECRET_KEY
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Step 2: Validate webhook secret
    // PLACEHOLDER: After deploying, set STRIPE_CONNECT_WEBHOOK_SECRET in your Supabase secrets.
    // To get this secret:
    //   1. Go to Stripe Dashboard > Developers > Webhooks
    //   2. Click "+ Add destination"
    //   3. In "Events from", select "Connected accounts"
    //   4. Click "Show advanced options" → Payload style: "Thin"
    //   5. Select events: v2.core.account[requirements].updated
    //      and v2.core.account[.recipient].capability_status_updated
    //   6. Set the endpoint URL to this function's deployed URL
    //   7. Copy the signing secret and add it as STRIPE_CONNECT_WEBHOOK_SECRET
    //
    // For local testing with Stripe CLI:
    //   stripe listen --thin-events 'v2.core.account[requirements].updated,v2.core.account[.recipient].capability_status_updated' --forward-thin-to <YOUR_LOCAL_ENDPOINT>
    const webhookSecret = Deno.env.get("STRIPE_CONNECT_WEBHOOK_SECRET");
    if (!webhookSecret) {
      logStep("ERROR: STRIPE_CONNECT_WEBHOOK_SECRET is not set. " +
        "Please add it to your Supabase secrets. See function comments for setup instructions.");
      return new Response(
        JSON.stringify({
          error: "Webhook secret not configured. Please set STRIPE_CONNECT_WEBHOOK_SECRET.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 3: Create Stripe client — no apiVersion needed
    const stripeClient = new Stripe(stripeKey);

    // Step 4: Read the raw request body and signature header
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      logStep("ERROR: Missing stripe-signature header");
      return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 5: Parse the thin event using Stripe's built-in verification
    // Thin events contain minimal data — you must fetch the full event separately
    // This also verifies the webhook signature to prevent spoofing
    let thinEvent: Stripe.ThinEvent;
    try {
      thinEvent = stripeClient.parseThinEvent(body, sig, webhookSecret);
    } catch (err) {
      logStep("ERROR: Webhook signature verification failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      return new Response(JSON.stringify({ error: "Webhook signature verification failed" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    logStep("Thin event parsed", { eventId: thinEvent.id, type: thinEvent.type });

    // Step 6: Fetch the full event data from Stripe
    // Thin events only contain the event ID and type — we need the full payload
    const event = await stripeClient.v2.core.events.retrieve(thinEvent.id);
    logStep("Full event retrieved", { type: event.type });

    // Step 7: Handle specific event types
    switch (event.type) {
      case 'v2.core.account[requirements].updated': {
        // Account requirements have changed — this happens when regulators
        // or card networks update compliance requirements
        logStep("Account requirements updated", {
          eventData: JSON.stringify((event as any).data || {}),
        });
        // TODO: You could update a status field in your database,
        // send a notification to the salon owner, or trigger re-onboarding
        break;
      }

      case 'v2.core.account[.recipient].capability_status_updated': {
        // A capability status has changed on the connected account
        // This fires when stripe_transfers goes active, pending, or inactive
        logStep("Capability status updated", {
          eventData: JSON.stringify((event as any).data || {}),
        });
        // TODO: Update the salon's payment readiness status in your database
        break;
      }

      default: {
        logStep("Unhandled event type", { type: event.type });
      }
    }

    // Step 8: Always return 200 to acknowledge receipt
    // Stripe will retry events that don't get a 2xx response
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    // Return 500 so Stripe retries the event
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
