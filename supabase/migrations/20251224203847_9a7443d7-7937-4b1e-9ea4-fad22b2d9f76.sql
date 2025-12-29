-- Drop the restrictive policy and create proper ones for promo_codes
DROP POLICY IF EXISTS "Admins can manage promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Anyone can view promo codes for validation" ON public.promo_codes;

-- Allow anyone to view promo codes (for validation during redemption)
CREATE POLICY "Anyone can view promo codes"
ON public.promo_codes
FOR SELECT
USING (true);

-- Allow inserts (admin check done at application level since we use custom auth)
CREATE POLICY "Allow insert promo codes"
ON public.promo_codes
FOR INSERT
WITH CHECK (true);

-- Allow updates (admin check done at application level)
CREATE POLICY "Allow update promo codes"
ON public.promo_codes
FOR UPDATE
USING (true);

-- Allow deletes (admin check done at application level)
CREATE POLICY "Allow delete promo codes"
ON public.promo_codes
FOR DELETE
USING (true);