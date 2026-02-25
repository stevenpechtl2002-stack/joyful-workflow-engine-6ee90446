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

    // Fetch salon info
    const { data: salon } = await supabase
      .from("customers")
      .select("id, company_name, email, city, address, postal_code")
      .eq("id", salon_id)
      .single();

    if (!salon) {
      return new Response(JSON.stringify({ error: "Salon not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch products, staff members
    const [{ data: products }, { data: staff }] = await Promise.all([
      supabase.from("products").select("*").eq("user_id", salon_id).eq("is_active", true).order("sort_order"),
      supabase.from("staff_members").select("*").eq("user_id", salon_id).eq("is_active", true).order("sort_order"),
    ]);

    // If date provided, fetch available slots
    let available_slots: string[] | null = null;
    if (date) {
      const durationMinutes = duration || 30;
      
      // Get reservations for this date
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

      // Get shift exceptions
      let excQuery = supabase
        .from("shift_exceptions")
        .select("staff_member_id, start_time, end_time")
        .eq("user_id", salon_id)
        .eq("exception_date", date);

      if (staff_member_id) {
        excQuery = excQuery.eq("staff_member_id", staff_member_id);
      }

      const { data: exceptions } = await excQuery;

      // Get shifts for the day of week
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

      // Calculate available slots (09:00 - 20:00 in 30-min intervals)
      available_slots = [];
      for (let hour = 9; hour < 20; hour++) {
        for (const minute of [0, 30]) {
          const slotTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const slotStart = new Date(`${date}T${slotTime}:00`);
          const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

          // Check reservation conflicts
          const hasConflict = (reservations || []).some(res => {
            const resStart = new Date(`${date}T${res.reservation_time}`);
            const resEnd = res.end_time 
              ? new Date(`${date}T${res.end_time}`)
              : new Date(resStart.getTime() + durationMinutes * 60000);
            return slotStart < resEnd && slotEnd > resStart;
          });

          // Check exception conflicts
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
      },
      products: products || [],
      staff: (staff || []).map(s => ({ id: s.id, name: s.name, color: s.color })),
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
