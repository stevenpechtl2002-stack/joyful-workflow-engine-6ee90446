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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { reservation_id, payment_method } = await req.json();

    if (!reservation_id || !payment_method) {
      return new Response(
        JSON.stringify({ error: "reservation_id and payment_method required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["online", "card", "cash"].includes(payment_method)) {
      return new Response(
        JSON.stringify({ error: "Invalid payment_method. Must be online, card, or cash" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the reservation
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", reservation_id)
      .single();

    if (fetchError || !reservation) {
      return new Response(
        JSON.stringify({ error: "Reservation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (reservation.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: "Not authorized for this reservation" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (reservation.status === "completed") {
      return new Response(
        JSON.stringify({ error: "Reservation already completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // TSE signing via fiskaly (if keys are configured)
    let tseTransactionId: string | null = null;
    let tseSignature: string | null = null;
    let tseTimestamp: string | null = null;

    const fiskalyApiKey = Deno.env.get("FISKALY_API_KEY");
    const fiskalyApiSecret = Deno.env.get("FISKALY_API_SECRET");

    if (fiskalyApiKey && fiskalyApiSecret) {
      try {
        // Authenticate with fiskaly
        const authRes = await fetch("https://kassensichv2.fiskaly.com/api/v2/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: fiskalyApiKey,
            api_secret: fiskalyApiSecret,
          }),
        });

        if (authRes.ok) {
          const { access_token } = await authRes.json();
          
          // Create a TSE transaction
          const txId = crypto.randomUUID();
          const amount = reservation.price_paid
            ? Math.round(Number(reservation.price_paid) * 100)
            : 0;

          // Start transaction
          const startRes = await fetch(
            `https://kassensichv2.fiskaly.com/api/v2/tss/${Deno.env.get("FISKALY_TSS_ID") || "default"}/tx/${txId}?tx_revision=1`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${access_token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                state: "ACTIVE",
                client_id: Deno.env.get("FISKALY_CLIENT_ID") || "default",
              }),
            }
          );

          if (startRes.ok) {
            // Finish transaction
            const finishRes = await fetch(
              `https://kassensichv2.fiskaly.com/api/v2/tss/${Deno.env.get("FISKALY_TSS_ID") || "default"}/tx/${txId}?tx_revision=2`,
              {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${access_token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  state: "FINISHED",
                  client_id: Deno.env.get("FISKALY_CLIENT_ID") || "default",
                  schema: {
                    standard_v1: {
                      receipt: {
                        receipt_type: "RECEIPT",
                        amounts_per_vat_rate: [
                          {
                            vat_rate: "NORMAL",
                            amount: amount.toString(),
                          },
                        ],
                        amounts_per_payment_type: [
                          {
                            payment_type: payment_method === "cash" ? "CASH" : "NON_CASH",
                            amount: amount.toString(),
                          },
                        ],
                      },
                    },
                  },
                }),
              }
            );

            if (finishRes.ok) {
              const txData = await finishRes.json();
              tseTransactionId = txId;
              tseSignature = txData.signature?.value || txData.log?.operation || "signed";
              tseTimestamp = new Date().toISOString();
            }
          }
        }
      } catch (tseErr) {
        console.error("TSE signing failed (non-blocking):", tseErr);
        // Continue without TSE - salon can still complete the checkout
      }
    } else {
      console.log("Fiskaly keys not configured - skipping TSE signing");
    }

    const now = new Date().toISOString();

    // Update reservation
    const { error: updateError } = await supabase
      .from("reservations")
      .update({
        status: "completed",
        payment_method,
        payment_status: "paid",
        tse_transaction_id: tseTransactionId,
        tse_signature: tseSignature,
        tse_timestamp: tseTimestamp,
        updated_at: now,
      })
      .eq("id", reservation_id);

    if (updateError) {
      throw updateError;
    }

    // Create transaction entry for Kassenbuch
    const serviceAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const txNumber = `POS-${Date.now()}`;
    const paymentMethodMap: Record<string, string> = {
      online: "online",
      card: "karte",
      cash: "bar",
    };

    await serviceAdmin.from("transactions").insert({
      user_id: userId,
      reservation_id: reservation_id,
      customer_name: reservation.customer_name,
      amount: Number(reservation.price_paid) || 0,
      payment_amount: Number(reservation.price_paid) || 0,
      payment_method: paymentMethodMap[payment_method] || "bar",
      transaction_number: txNumber,
      transaction_type: "sale",
      notes: tseSignature
        ? `TSE: ${tseSignature.substring(0, 20)}...`
        : "POS Abschluss (ohne TSE)",
    });

    return new Response(
      JSON.stringify({
        success: true,
        tse_transaction_id: tseTransactionId,
        tse_signature: tseSignature,
        tse_timestamp: tseTimestamp,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("pos-checkout error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
