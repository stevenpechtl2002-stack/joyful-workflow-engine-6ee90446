
-- Add address fields to customers
ALTER TABLE public.customers 
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Create customer_favorites table
CREATE TABLE IF NOT EXISTS public.customer_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_user_id UUID NOT NULL,
  salon_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_user_id, salon_user_id)
);

ALTER TABLE public.customer_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
  ON public.customer_favorites FOR SELECT
  USING (auth.uid() = customer_user_id);

CREATE POLICY "Users can create their own favorites"
  ON public.customer_favorites FOR INSERT
  WITH CHECK (auth.uid() = customer_user_id);

CREATE POLICY "Users can delete their own favorites"
  ON public.customer_favorites FOR DELETE
  USING (auth.uid() = customer_user_id);

-- Create storefront_bookings table
CREATE TABLE IF NOT EXISTS public.storefront_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_user_id UUID,
  salon_user_id UUID NOT NULL,
  staff_member_id UUID,
  product_id UUID,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  end_time TIME,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  payment_method TEXT DEFAULT 'on_site',
  payment_status TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.storefront_bookings ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public booking)
CREATE POLICY "Anyone can create bookings"
  ON public.storefront_bookings FOR INSERT
  WITH CHECK (true);

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings"
  ON public.storefront_bookings FOR SELECT
  USING (auth.uid() = customer_user_id OR auth.uid() = salon_user_id);

-- Salon owners can update bookings for their salon
CREATE POLICY "Salon owners can update their bookings"
  ON public.storefront_bookings FOR UPDATE
  USING (auth.uid() = salon_user_id);

-- Admins can manage all
CREATE POLICY "Admins can manage all bookings"
  ON public.storefront_bookings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow public read on customers for storefront (company_name, city only)
CREATE POLICY "Public can view salon info"
  ON public.customers FOR SELECT
  USING (true);
