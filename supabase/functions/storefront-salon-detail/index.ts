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
    const { salon_id, date, staff_member_id, duration } = await req.json();
    
    if (!salon_id) {
      return new Response(JSON.stringify({ error: "salon_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch salon info (including description and category)
    const { data: salon } = await supabase
      .from("customers")
      .select("id, company_name, email, city, address, postal_code, category, description")
      .eq("id", salon_id)
      .single();

    if (!salon) {
      return new Response(JSON.stringify({ error: "Salon not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch products, staff, reviews, images, and all shifts (for opening hours) in parallel
    const [
      { data: products },
      { data: staff },
      { data: reviews },
      { data: images },
      { data: allShifts },
    ] = await Promise.all([
      supabase.from("products").select("*").eq("user_id", salon_id).eq("is_active", true).order("sort_order"),
      supabase.from("staff_members").select("*").eq("user_id", salon_id).eq("is_active", true).order("sort_order"),
      supabase.from("salon_reviews").select("*").eq("salon_user_id", salon_id).order("created_at", { ascending: false }),
      supabase.from("salon_images").select("*").eq("salon_user_id", salon_id).order("sort_order"),
      supabase.from("staff_shifts").select("day_of_week, start_time, end_time, is_working").eq("user_id", salon_id),
    ]);

    // Derive opening hours from staff shifts (earliest start, latest end per day)
    const openingHours: Record<number, { open: string; close: string } | null> = {};
    for (let d = 0; d < 7; d++) {
      const dayShifts = (allShifts || []).filter(s => s.day_of_week === d && s.is_working);
      if (dayShifts.length === 0) {
        openingHours[d] = null; // closed
      } else {
        const earliest = dayShifts.reduce((min, s) => s.start_time < min ? s.start_time : min, dayShifts[0].start_time);
        const latest = dayShifts.reduce((max, s) => s.end_time > max ? s.end_time : max, dayShifts[0].end_time);
        openingHours[d] = { open: earliest.substring(0, 5), close: latest.substring(0, 5) };
      }
    }

    // Calculate average rating
    const reviewList = reviews || [];
    const avgRating = reviewList.length > 0
      ? reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length
      : 0;

    // If date provided, fetch available slots
    let available_slots: string[] | null = null;
    if (date) {
      const durationMinutes = duration || 30;
      
      let resQuery = supabase
        .from("reservations")
        .select("reservation_time, end_time, staff_member_id")
        .eq("user_id", salon_id)
        .eq("reservation_date", date)
        .neq("status", "cancelled");
      
      if (staff_member_id) {
        resQuery = resQuery.eq("staff_member_id", staff_member_id);
      }

      const { data: reservations } = await resQuery;

      let excQuery = supabase
        .from("shift_exceptions")
        .select("staff_member_id, start_time, end_time")
        .eq("user_id", salon_id)
        .eq("exception_date", date);

      if (staff_member_id) {
        excQuery = excQuery.eq("staff_member_id", staff_member_id);
      }

      const { data: exceptions } = await excQuery;

      const dayOfWeek = new Date(date).getDay();
      let shiftQuery = supabase
        .from("staff_shifts")
        .select("staff_member_id, start_time, end_time, is_working")
        .eq("user_id", salon_id)
        .eq("day_of_week", dayOfWeek);

      if (staff_member_id) {
        shiftQuery = shiftQuery.eq("staff_member_id", staff_member_id);
      }

      const { data: shifts } = await shiftQuery;

      available_slots = [];
      for (let hour = 9; hour < 20; hour++) {
        for (const minute of [0, 30]) {
          const slotTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const slotStart = new Date(`${date}T${slotTime}:00`);
          const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

          const hasConflict = (reservations || []).some(res => {
            const resStart = new Date(`${date}T${res.reservation_time}`);
            const resEnd = res.end_time 
              ? new Date(`${date}T${res.end_time}`)
              : new Date(resStart.getTime() + durationMinutes * 60000);
            return slotStart < resEnd && slotEnd > resStart;
          });

          const hasException = (exceptions || []).some(exc => {
            const excStart = new Date(`${date}T${exc.start_time}`);
            const excEnd = new Date(`${date}T${exc.end_time}`);
            return slotStart < excEnd && slotEnd > excStart;
          });

          if (!hasConflict && !hasException) {
            available_slots.push(slotTime);
          }
        }
      }
    }

    return new Response(JSON.stringify({
      salon: {
        id: salon.id,
        name: salon.company_name || salon.email,
        city: salon.city,
        address: salon.address,
        postal_code: salon.postal_code,
        category: salon.category,
        description: salon.description,
      },
      products: products || [],
      staff: (staff || []).map(s => ({ id: s.id, name: s.name, color: s.color })),
      reviews: reviewList.map(r => ({
        id: r.id,
        reviewer_name: r.reviewer_name,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
      })),
      images: (images || []).map(i => ({
        id: i.id,
        image_url: i.image_url,
        caption: i.caption,
      })),
      opening_hours: openingHours,
      avg_rating: Math.round(avgRating * 10) / 10,
      review_count: reviewList.length,
      available_slots,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});