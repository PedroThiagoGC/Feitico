
-- Add unique constraint for availability upsert
ALTER TABLE public.availability ADD CONSTRAINT availability_salon_date_unique UNIQUE (salon_id, date);

-- Create storage bucket for salon images
INSERT INTO storage.buckets (id, name, public) VALUES ('salon-images', 'salon-images', true);

-- Allow public read access to salon images
CREATE POLICY "Public can read salon images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'salon-images');

-- Allow authenticated users to upload/delete images
CREATE POLICY "Authenticated can upload salon images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'salon-images');
CREATE POLICY "Authenticated can update salon images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'salon-images');
CREATE POLICY "Authenticated can delete salon images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'salon-images');
