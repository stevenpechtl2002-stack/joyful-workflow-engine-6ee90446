import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch all salons with company_name
    const { data: salons, error } = await supabase
      .from("customers")
      .select("id, company_name, email, city, address, postal_code, published, created_at")
      .not("company_name", "is", null)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // For each salon, get their products count and staff count
    const enriched = await Promise.all((salons || []).map(async (salon) => {
      const [{ count: productCount }, { count: staffCount }] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }).eq("user_id", salon.id).eq("is_active", true),
        supabase.from("staff_members").select("*", { count: "exact", head: true }).eq("user_id", salon.id).eq("is_active", true),
      ]);

      return {
        id: salon.id,
        name: salon.company_name || salon.email,
        city: salon.city || null,
        address: salon.address || null,
        postal_code: salon.postal_code || null,
        published: salon.published,
        product_count: productCount || 0,
        staff_count: staffCount || 0,
      };
    }));

    return new Response(JSON.stringify(enriched), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
