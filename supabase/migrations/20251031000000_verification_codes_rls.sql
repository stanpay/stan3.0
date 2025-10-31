-- Enable RLS on verification_codes
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert verification codes (for email verification)
CREATE POLICY "Anyone can insert verification codes"
  ON public.verification_codes
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to read verification codes (for verification)
CREATE POLICY "Anyone can read verification codes"
  ON public.verification_codes
  FOR SELECT
  USING (true);

-- Allow anyone to delete verification codes (after verification)
CREATE POLICY "Anyone can delete verification codes"
  ON public.verification_codes
  FOR DELETE
  USING (true);

