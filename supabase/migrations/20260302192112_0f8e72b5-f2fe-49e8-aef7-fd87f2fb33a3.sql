CREATE TABLE public.discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  applies_to text NOT NULL DEFAULT 'all',
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  category text,
  valid_from date NOT NULL,
  valid_until date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own discounts" ON public.discounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view active discounts" ON public.discounts FOR SELECT USING (is_active = true AND valid_until >= CURRENT_DATE);

CREATE POLICY "Admins can manage all discounts" ON public.discounts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));