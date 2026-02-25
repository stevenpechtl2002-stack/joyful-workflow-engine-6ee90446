
-- Create connect_products table for platform-level Stripe products mapped to connected accounts
CREATE TABLE public.connect_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  stripe_product_id text NOT NULL,
  stripe_price_id text NOT NULL,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'eur',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.connect_products ENABLE ROW LEVEL SECURITY;

-- Users can read their own products
CREATE POLICY "Users can view their own connect products"
  ON public.connect_products FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own products
CREATE POLICY "Users can create their own connect products"
  ON public.connect_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own products
CREATE POLICY "Users can update their own connect products"
  ON public.connect_products FOR UPDATE
  USING (auth.uid() = user_id);

-- Public read for active products (storefront)
CREATE POLICY "Anyone can view active connect products"
  ON public.connect_products FOR SELECT
  USING (is_active = true);

-- Admins can manage all
CREATE POLICY "Admins can manage all connect products"
  ON public.connect_products FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
