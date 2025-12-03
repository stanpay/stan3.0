-- Fix verification_codes table creation
-- Drop existing table if it exists (for clean migration)
DROP TABLE IF EXISTS public.verification_codes CASCADE;

-- Create verification_codes table for email verification
CREATE TABLE public.verification_codes (
  email TEXT NOT NULL PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX idx_verification_codes_email ON public.verification_codes(email);
CREATE INDEX idx_verification_codes_expires_at ON public.verification_codes(expires_at);

-- Enable RLS on verification_codes
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can insert verification codes" ON public.verification_codes;
DROP POLICY IF EXISTS "Anyone can read verification codes" ON public.verification_codes;
DROP POLICY IF EXISTS "Anyone can delete verification codes" ON public.verification_codes;

-- Create RLS policies
CREATE POLICY "Anyone can insert verification codes"
  ON public.verification_codes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read verification codes"
  ON public.verification_codes
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can delete verification codes"
  ON public.verification_codes
  FOR DELETE
  USING (true);

-- Grant necessary permissions to PostgREST roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.verification_codes TO anon, authenticated;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';







