-- Add geolocation columns to customers table for distance-based search
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS longitude double precision;

-- Create index for geo queries
CREATE INDEX IF NOT EXISTS idx_customers_geo ON public.customers (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;