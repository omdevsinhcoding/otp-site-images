-- Create user_wallets table to store website balance
CREATE TABLE public.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own wallet"
ON public.user_wallets FOR SELECT
USING (true);

CREATE POLICY "Users can insert own wallet"
ON public.user_wallets FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own wallet"
ON public.user_wallets FOR UPDATE
USING (true);

-- Function to withdraw referral earnings to website balance
CREATE OR REPLACE FUNCTION public.withdraw_referral_earnings(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- Get available balance
  SELECT available_balance INTO v_available
  FROM public.referral_earnings
  WHERE user_id = p_user_id;
  
  IF v_available IS NULL OR v_available <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'No balance available to withdraw');
  END IF;
  
  -- Create wallet if not exists
  INSERT INTO public.user_wallets (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Add to wallet balance
  UPDATE public.user_wallets
  SET balance = balance + v_available,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  -- Update referral earnings - move to withdrawn, reset available
  UPDATE public.referral_earnings
  SET withdrawn = withdrawn + v_available,
      available_balance = 0,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN json_build_object(
    'success', true, 
    'amount_withdrawn', v_available,
    'new_wallet_balance', v_new_balance
  );
END;
$$;

-- Function to get user wallet balance
CREATE OR REPLACE FUNCTION public.get_wallet_balance(p_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  SELECT balance INTO v_balance
  FROM public.user_wallets
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_balance, 0);
END;
$$;