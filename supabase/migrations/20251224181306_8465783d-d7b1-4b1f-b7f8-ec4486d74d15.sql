-- Create a security definer function to count referrals (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_referral_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer FROM public.referrals
$$;