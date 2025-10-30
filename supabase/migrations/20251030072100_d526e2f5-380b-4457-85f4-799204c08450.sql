-- Create a public storage bucket for brand logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-logos', 'brand-logos', true);

-- Allow anyone to view the logos
CREATE POLICY "Anyone can view brand logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'brand-logos');

-- Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload brand logos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'brand-logos' AND auth.role() = 'authenticated');

-- Allow authenticated users to update logos
CREATE POLICY "Authenticated users can update brand logos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'brand-logos' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete logos
CREATE POLICY "Authenticated users can delete brand logos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'brand-logos' AND auth.role() = 'authenticated');