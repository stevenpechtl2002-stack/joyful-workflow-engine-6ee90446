
-- Add new columns to customers table
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS instagram_url text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS facebook_url text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS logo_url text;

-- Create salon-logos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('salon-logos', 'salon-logos', true) ON CONFLICT (id) DO NOTHING;

-- RLS policies for salon-logos bucket
CREATE POLICY "Anyone can view salon logos" ON storage.objects FOR SELECT USING (bucket_id = 'salon-logos');
CREATE POLICY "Authenticated users can upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'salon-logos' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own logos" ON storage.objects FOR UPDATE USING (bucket_id = 'salon-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete their own logos" ON storage.objects FOR DELETE USING (bucket_id = 'salon-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
