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

    const { data: salons, error } = await supabase
      .from("customers")
      .select("id, company_name, email, city, address, postal_code, published, created_at, category, description, cover_image_url, logo_url")
      .not("company_name", "is", null)
      .neq("company_name", "")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const enriched = await Promise.all((salons || []).map(async (salon) => {
      const [{ count: productCount }, { count: staffCount }, { data: reviews }, { data: imgs }] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }).eq("user_id", salon.id).eq("is_active", true),
        supabase.from("staff_members").select("*", { count: "exact", head: true }).eq("user_id", salon.id).eq("is_active", true),
        supabase.from("salon_reviews").select("rating").eq("salon_user_id", salon.id),
        supabase.from("salon_images").select("image_url").eq("salon_user_id", salon.id).order("sort_order").limit(1),
      ]);

      const reviewList = reviews || [];
      const avgRating = reviewList.length > 0
        ? Math.round((reviewList.reduce((s, r) => s + r.rating, 0) / reviewList.length) * 10) / 10
        : 0;

      // Use cover_image_url from profile, fallback to first gallery image
      const coverImage = salon.cover_image_url || (imgs && imgs.length > 0 ? imgs[0].image_url : null);

      return {
        id: salon.id,
        name: salon.company_name,
        city: salon.city || null,
        address: salon.address || null,
        postal_code: salon.postal_code || null,
        category: salon.category || 'Friseur',
        description: salon.description || null,
        logo_url: salon.logo_url || null,
        published: salon.published,
        product_count: productCount || 0,
        staff_count: staffCount || 0,
        avg_rating: avgRating,
        review_count: reviewList.length,
        cover_image: coverImage,
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