-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow delete promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Allow insert promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Allow update promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Anyone can view promo codes" ON public.promo_codes;

-- Create proper PERMISSIVE policies
CREATE POLICY "Anyone can view promo codes"
ON public.promo_codes
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert promo codes"
ON public.promo_codes
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update promo codes"
ON public.promo_codes
FOR UPDATE
USING (true);

CREATE POLICY "Admins can delete promo codes"
ON public.promo_codes
FOR DELETE
USING (true);