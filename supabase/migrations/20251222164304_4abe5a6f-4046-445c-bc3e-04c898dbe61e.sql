-- Create referral_codes table to store unique referral codes for each user
CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE DEFAULT upper(substring(gen_random_uuid()::text, 1, 8) || substring(gen_random_uuid()::text, 10, 4) || substring(gen_random_uuid()::text, 15, 4) || substring(gen_random_uuid()::text, 20, 12)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create referrals table to track who referred whom
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  deposit_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  commission_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referred_user_id)
);

-- Create referral_earnings table to track withdrawable balance
CREATE TABLE public.referral_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  total_earned NUMERIC(10, 2) NOT NULL DEFAULT 0,
  withdrawn NUMERIC(10, 2) NOT NULL DEFAULT 0,
  available_balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_codes
CREATE POLICY "Users can view own referral code"
ON public.referral_codes FOR SELECT
USING (user_id IN (SELECT id FROM public.users WHERE uid = (SELECT uid FROM public.users WHERE id = referral_codes.user_id)));

CREATE POLICY "Users can insert own referral code"
ON public.referral_codes FOR INSERT
WITH CHECK (true);

-- RLS Policies for referrals
CREATE POLICY "Users can view own referrals"
ON public.referrals FOR SELECT
USING (referrer_id IN (SELECT id FROM public.users));

-- RLS Policies for referral_earnings
CREATE POLICY "Users can view own earnings"
ON public.referral_earnings FOR SELECT
USING (user_id IN (SELECT id FROM public.users));

CREATE POLICY "Users can insert own earnings"
ON public.referral_earnings FOR INSERT
WITH CHECK (true);

-- Function to get or create referral code for a user
CREATE OR REPLACE FUNCTION public.get_or_create_referral_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- Try to get existing code
  SELECT code INTO v_code FROM public.referral_codes WHERE user_id = p_user_id;
  
  IF v_code IS NULL THEN
    -- Create new code
    INSERT INTO public.referral_codes (user_id)
    VALUES (p_user_id)
    RETURNING code INTO v_code;
    
    -- Also create earnings record
    INSERT INTO public.referral_earnings (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN v_code;
END;
$$;

-- Function to get referral stats for a user
CREATE OR REPLACE FUNCTION public.get_referral_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referred_count INTEGER;
  v_total_earned NUMERIC;
  v_available_balance NUMERIC;
BEGIN
  -- Count referrals
  SELECT COUNT(*) INTO v_referred_count
  FROM public.referrals
  WHERE referrer_id = p_user_id;
  
  -- Get earnings
  SELECT COALESCE(total_earned, 0), COALESCE(available_balance, 0)
  INTO v_total_earned, v_available_balance
  FROM public.referral_earnings
  WHERE user_id = p_user_id;
  
  IF v_total_earned IS NULL THEN
    v_total_earned := 0;
    v_available_balance := 0;
  END IF;
  
  RETURN json_build_object(
    'referred_count', COALESCE(v_referred_count, 0),
    'total_earned', v_total_earned,
    'available_balance', v_available_balance
  );
END;
$$;