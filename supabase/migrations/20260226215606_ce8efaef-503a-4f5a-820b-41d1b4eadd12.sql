
-- Transactions table (Kassenbuch)
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  transaction_number text NOT NULL,
  transaction_type text NOT NULL DEFAULT 'sale',
  customer_name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'bar',
  payment_amount numeric NOT NULL DEFAULT 0,
  staff_member_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL,
  notes text,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  transaction_time time NOT NULL DEFAULT CURRENT_TIME,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all transactions" ON public.transactions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Daily closings table (Z-Bon)
CREATE TABLE public.daily_closings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  closing_date date NOT NULL,
  gross_revenue_services numeric NOT NULL DEFAULT 0,
  gross_revenue_products numeric NOT NULL DEFAULT 0,
  net_revenue numeric NOT NULL DEFAULT 0,
  vat_amount numeric NOT NULL DEFAULT 0,
  vat_rate numeric NOT NULL DEFAULT 19,
  payment_cash numeric NOT NULL DEFAULT 0,
  payment_card numeric NOT NULL DEFAULT 0,
  payment_online numeric NOT NULL DEFAULT 0,
  payment_other numeric NOT NULL DEFAULT 0,
  cash_drawer_start numeric NOT NULL DEFAULT 0,
  cash_drawer_end numeric NOT NULL DEFAULT 0,
  cash_deposits numeric NOT NULL DEFAULT 0,
  cash_withdrawals numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, closing_date)
);

ALTER TABLE public.daily_closings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own closings" ON public.daily_closings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own closings" ON public.daily_closings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own closings" ON public.daily_closings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own closings" ON public.daily_closings FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all closings" ON public.daily_closings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
