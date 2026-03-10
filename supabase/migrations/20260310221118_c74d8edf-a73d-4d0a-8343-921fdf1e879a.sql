ALTER TABLE public.customers 
  ADD COLUMN IF NOT EXISTS cancellation_hours integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS buffer_minutes integer NOT NULL DEFAULT 0;