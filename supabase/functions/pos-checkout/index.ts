import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function signWithTSE(paymentMethod: string, amount: number) {
  const fiskalyApiKey = Deno.env.get("FISKALY_API_KEY");
  const fiskalyApiSecret = Deno.env.get("FISKALY_API_SECRET");

  if (!fiskalyApiKey || !fiskalyApiSecret) {
    console.log("Fiskaly keys not configured - skipping TSE signing");
    return { tseTransactionId: null, tseSignature: null, tseTimestamp: null };
  }

  try {
    const authRes = await fetch("https://kassensichv2.fiskaly.com/api/v2/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: fiskalyApiKey, api_secret: fiskalyApiSecret }),
    });

    if (!authRes.ok) return { tseTransactionId: null, tseSignature: null, tseTimestamp: null };

    const { access_token } = await authRes.json();
    const txId = crypto.randomUUID();
    const amountCents = Math.round(amount * 100);
    const tssId = Deno.env.get("FISKALY_TSS_ID") || "default";
    const clientId = Deno.env.get("FISKALY_CLIENT_ID") || "default";

    const startRes = await fetch(
      `https://kassensichv2.fiskaly.com/api/v2/tss/${tssId}/tx/${txId}?tx_revision=1`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ state: "ACTIVE", client_id: clientId }),
      }
    );

    if (!startRes.ok) return { tseTransactionId: null, tseSignature: null, tseTimestamp: null };

    const finishRes = await fetch(
      `https://kassensichv2.fiskaly.com/api/v2/tss/${tssId}/tx/${txId}?tx_revision=2`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          state: "FINISHED",
          client_id: clientId,
          schema: {
            standard_v1: {
              receipt: {
                receipt_type: "RECEIPT",
                amounts_per_vat_rate: [{ vat_rate: "NORMAL", amount: amountCents.toString() }],
                amounts_per_payment_type: [{
                  payment_type: paymentMethod === "cash" || paymentMethod === "bar" ? "CASH" : "NON_CASH",
                  amount: amountCents.toString(),
                }],
              },
            },
          },
        }),
      }
    );

    if (finishRes.ok) {
      const txData = await finishRes.json();
      return {
        tseTransactionId: txId,
        tseSignature: txData.signature?.value || txData.log?.operation || "signed",
        tseTimestamp: new Date().toISOString(),
      };
    }
  } catch (tseErr) {
    console.error("TSE signing failed (non-blocking):", tseErr);
  }

  return { tseTransactionId: null, tseSignature: null, tseTimestamp: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const body = await req.json();
    const { reservation_id, transaction_id, payment_method } = body;

    // MODE 1: Transaction checkout (from Kassenbuch)
    if (transaction_id) {
      const { data: transaction, error: fetchError } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", transaction_id)
        .single();

      if (fetchError || !transaction) {
        return new Response(JSON.stringify({ error: "Transaction not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (transaction.user_id !== userId) {
        return new Response(JSON.stringify({ error: "Not authorized" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (transaction.status === "completed") {
        return new Response(JSON.stringify({ error: "Transaction already completed" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tse = await signWithTSE(transaction.payment_method, Number(transaction.amount));

      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          status: "completed",
          tse_transaction_id: tse.tseTransactionId,
          tse_signature: tse.tseSignature,
          tse_timestamp: tse.tseTimestamp,
        })
        .eq("id", transaction_id);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({
        success: true,
        tse_transaction_id: tse.tseTransactionId,
        tse_signature: tse.tseSignature,
        tse_timestamp: tse.tseTimestamp,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // MODE 2: Reservation checkout (original flow)
    if (!reservation_id || !payment_method) {
      return new Response(
        JSON.stringify({ error: "reservation_id or transaction_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["online", "card", "cash"].includes(payment_method)) {
      return new Response(
        JSON.stringify({ error: "Invalid payment_method" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", reservation_id)
      .single();

    if (fetchError || !reservation) {
      return new Response(JSON.stringify({ error: "Reservation not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (reservation.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (reservation.status === "completed") {
      return new Response(JSON.stringify({ error: "Already completed" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tse = await signWithTSE(payment_method, Number(reservation.price_paid) || 0);

    const { error: updateError } = await supabase
      .from("reservations")
      .update({
        status: "completed",
        payment_method,
        payment_status: "paid",
        tse_transaction_id: tse.tseTransactionId,
        tse_signature: tse.tseSignature,
        tse_timestamp: tse.tseTimestamp,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservation_id);

    if (updateError) throw updateError;

    const serviceAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const paymentMethodMap: Record<string, string> = { online: "online", card: "karte_ec", cash: "bar" };
    await serviceAdmin.from("transactions").insert({
      user_id: userId,
      reservation_id,
      customer_name: reservation.customer_name,
      amount: Number(reservation.price_paid) || 0,
      payment_amount: Number(reservation.price_paid) || 0,
      payment_method: paymentMethodMap[payment_method] || "bar",
      transaction_number: `POS-${Date.now()}`,
      transaction_type: "sale",
      status: "completed",
      tse_transaction_id: tse.tseTransactionId,
      tse_signature: tse.tseSignature,
      tse_timestamp: tse.tseTimestamp,
      notes: tse.tseSignature ? `TSE: ${tse.tseSignature.substring(0, 20)}...` : "POS Abschluss (ohne TSE)",
    });

    return new Response(JSON.stringify({
      success: true,
      tse_transaction_id: tse.tseTransactionId,
      tse_signature: tse.tseSignature,
      tse_timestamp: tse.tseTimestamp,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("pos-checkout error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
