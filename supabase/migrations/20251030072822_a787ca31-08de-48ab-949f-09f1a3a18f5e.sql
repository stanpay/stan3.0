-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete brand logos" ON storage.objects;

-- Recreate policies with correct auth check
CREATE POLICY "Authenticated users can upload brand logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'brand-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update brand logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'brand-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete brand logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'brand-logos' AND auth.uid() IS NOT NULL);