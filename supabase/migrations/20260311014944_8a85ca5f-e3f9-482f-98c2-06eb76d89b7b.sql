ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS fiskaly_tss_id text DEFAULT NULL;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS fiskaly_client_id text DEFAULT NULL;