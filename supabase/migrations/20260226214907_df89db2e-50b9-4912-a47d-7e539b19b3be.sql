
-- Salon reviews table
CREATE TABLE public.salon_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_user_id uuid NOT NULL,
  reviewer_name text NOT NULL,
  reviewer_user_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.salon_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.salon_reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON public.salon_reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can delete their own reviews" ON public.salon_reviews FOR DELETE USING (auth.uid() = reviewer_user_id);

-- Salon images table
CREATE TABLE public.salon_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_user_id uuid NOT NULL,
  image_url text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.salon_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view salon images" ON public.salon_images FOR SELECT USING (true);
CREATE POLICY "Salon owners can manage their images" ON public.salon_images FOR INSERT WITH CHECK (auth.uid() = salon_user_id);
CREATE POLICY "Salon owners can update their images" ON public.salon_images FOR UPDATE USING (auth.uid() = salon_user_id);
CREATE POLICY "Salon owners can delete their images" ON public.salon_images FOR DELETE USING (auth.uid() = salon_user_id);

-- Salon description column on customers table
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS description text;

-- Storage bucket for salon images
INSERT INTO storage.buckets (id, name, public) VALUES ('salon-images', 'salon-images', true) ON CONFLICT DO NOTHING;

-- Storage policies for salon-images bucket
CREATE POLICY "Anyone can view salon images" ON storage.objects FOR SELECT USING (bucket_id = 'salon-images');
CREATE POLICY "Authenticated users can upload salon images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'salon-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete their own salon images" ON storage.objects FOR DELETE USING (bucket_id = 'salon-images' AND auth.uid()::text = (storage.foldername(name))[1]);
