
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS tse_transaction_id text,
  ADD COLUMN IF NOT EXISTS tse_signature text,
  ADD COLUMN IF NOT EXISTS tse_timestamp timestamptz;
