import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// CORS headers for browser-based calls
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[LIST-CONNECT-PRODUCTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Step 1: Create Supabase client with service role
    // This is a public endpoint — no JWT required
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Step 2: Query all active products
    const { data: products, error: productsError } = await supabaseClient
      .from('connect_products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (productsError) throw new Error(`Failed to fetch products: ${productsError.message}`);

    // Step 3: Get unique user IDs to fetch salon info
    const userIds = [...new Set((products || []).map(p => p.user_id))];

    // Step 4: Fetch salon names from the customers table
    let salons: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: customers } = await supabaseClient
        .from('customers')
        .select('id, company_name, email')
        .in('id', userIds);

      if (customers) {
        for (const c of customers) {
          salons[c.id] = c.company_name || c.email;
        }
      }
    }

    // Step 5: Combine products with salon info
    const enrichedProducts = (products || []).map(p => ({
      ...p,
      salon_name: salons[p.user_id] || 'Unknown Salon',
    }));

    logStep("Products listed", { count: enrichedProducts.length });

    // Step 6: Return the enriched product list
    return new Response(JSON.stringify(enrichedProducts), {
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
