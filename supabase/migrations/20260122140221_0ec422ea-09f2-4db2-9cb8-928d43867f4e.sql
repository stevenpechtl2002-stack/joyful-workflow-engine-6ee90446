-- Add product_id to reservations table for linking services/products
ALTER TABLE public.reservations 
ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

-- Add price_paid column to track the actual price at time of booking
ALTER TABLE public.reservations 
ADD COLUMN price_paid numeric DEFAULT NULL;

-- Create index for faster revenue queries
CREATE INDEX idx_reservations_product_id ON public.reservations(product_id);
CREATE INDEX idx_reservations_date_status ON public.reservations(reservation_date, status);