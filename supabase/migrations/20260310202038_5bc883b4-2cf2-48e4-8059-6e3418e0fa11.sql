
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS tse_transaction_id text,
  ADD COLUMN IF NOT EXISTS tse_signature text,
  ADD COLUMN IF NOT EXISTS tse_timestamp timestamptz;
