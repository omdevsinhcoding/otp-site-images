-- Create promo_codes table for balance recharge codes
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL DEFAULT 0,
  max_redemptions INTEGER NOT NULL DEFAULT 1,
  current_redemptions INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id)
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Admins can manage promo codes
CREATE POLICY "Admins can manage promo codes" 
ON public.promo_codes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id IN (SELECT id FROM public.users) 
    AND role IN ('owner', 'manager', 'handler', 'admin')
  )
);

-- Anyone can view active promo codes for validation
CREATE POLICY "Anyone can view promo codes for validation" 
ON public.promo_codes 
FOR SELECT 
USING (true);

-- Create promo_redemptions table to track who redeemed what
CREATE TABLE public.promo_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  amount NUMERIC NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(promo_code_id, user_id)
);

-- Enable RLS
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

-- Users can view own redemptions
CREATE POLICY "Users can view own redemptions" 
ON public.promo_redemptions 
FOR SELECT 
USING (user_id IN (SELECT id FROM public.users));

-- System can insert redemptions
CREATE POLICY "System can insert redemptions" 
ON public.promo_redemptions 
FOR INSERT 
WITH CHECK (true);

-- Function to redeem promo code
CREATE OR REPLACE FUNCTION public.redeem_promo_code(p_user_id uuid, p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
  v_already_redeemed boolean;
  v_new_balance numeric;
BEGIN
  -- Find the promo code
  SELECT * INTO v_promo FROM public.promo_codes 
  WHERE UPPER(code) = UPPER(p_code);
  
  IF v_promo.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid promo code');
  END IF;
  
  -- Check if active
  IF NOT v_promo.is_active THEN
    RETURN json_build_object('success', false, 'error', 'This promo code is no longer active');
  END IF;
  
  -- Check expiry
  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'This promo code has expired');
  END IF;
  
  -- Check max redemptions
  IF v_promo.current_redemptions >= v_promo.max_redemptions THEN
    RETURN json_build_object('success', false, 'error', 'This promo code has reached maximum redemptions');
  END IF;
  
  -- Check if user already redeemed
  SELECT EXISTS (
    SELECT 1 FROM public.promo_redemptions 
    WHERE promo_code_id = v_promo.id AND user_id = p_user_id
  ) INTO v_already_redeemed;
  
  IF v_already_redeemed THEN
    RETURN json_build_object('success', false, 'error', 'You have already redeemed this promo code');
  END IF;
  
  -- Create wallet if not exists
  INSERT INTO public.user_wallets (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Add balance to user wallet
  UPDATE public.user_wallets
  SET balance = balance + v_promo.amount, updated_at = now()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  -- Record redemption
  INSERT INTO public.promo_redemptions (promo_code_id, user_id, amount)
  VALUES (v_promo.id, p_user_id, v_promo.amount);
  
  -- Increment redemption count
  UPDATE public.promo_codes
  SET current_redemptions = current_redemptions + 1
  WHERE id = v_promo.id;
  
  -- Create transaction record
  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'promo_bonus', v_promo.amount, 'Promo code: ' || v_promo.code);
  
  RETURN json_build_object(
    'success', true,
    'amount', v_promo.amount,
    'new_balance', v_new_balance,
    'code', v_promo.code
  );
END;
$$;

-- Function to create promo code (admin only)
CREATE OR REPLACE FUNCTION public.admin_create_promo_code(
  p_admin_id uuid,
  p_code text,
  p_amount numeric,
  p_max_redemptions integer,
  p_expires_at timestamp with time zone DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_level integer;
  v_new_promo promo_codes%ROWTYPE;
BEGIN
  -- Check admin level
  SELECT public.get_admin_level(role) INTO v_admin_level
  FROM public.user_roles
  WHERE user_id = p_admin_id;
  
  IF v_admin_level IS NULL OR v_admin_level < 1 THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;
  
  -- Validate inputs
  IF LENGTH(p_code) < 8 OR LENGTH(p_code) > 14 THEN
    RETURN json_build_object('success', false, 'error', 'Code must be 8-14 characters');
  END IF;
  
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be greater than 0');
  END IF;
  
  IF p_max_redemptions <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Max redemptions must be greater than 0');
  END IF;
  
  -- Check if code already exists
  IF EXISTS (SELECT 1 FROM public.promo_codes WHERE UPPER(code) = UPPER(p_code)) THEN
    RETURN json_build_object('success', false, 'error', 'This promo code already exists');
  END IF;
  
  -- Create promo code
  INSERT INTO public.promo_codes (code, amount, max_redemptions, expires_at, created_by)
  VALUES (UPPER(p_code), p_amount, p_max_redemptions, p_expires_at, p_admin_id)
  RETURNING * INTO v_new_promo;
  
  RETURN json_build_object(
    'success', true,
    'promo', json_build_object(
      'id', v_new_promo.id,
      'code', v_new_promo.code,
      'amount', v_new_promo.amount,
      'max_redemptions', v_new_promo.max_redemptions,
      'expires_at', v_new_promo.expires_at
    )
  );
END;
$$;

-- Function to delete promo code
CREATE OR REPLACE FUNCTION public.admin_delete_promo_code(p_admin_id uuid, p_promo_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_level integer;
BEGIN
  SELECT public.get_admin_level(role) INTO v_admin_level
  FROM public.user_roles
  WHERE user_id = p_admin_id;
  
  IF v_admin_level IS NULL OR v_admin_level < 1 THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;
  
  DELETE FROM public.promo_codes WHERE id = p_promo_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Promo code not found');
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Promo code deleted');
END;
$$;

-- Function to toggle promo code status
CREATE OR REPLACE FUNCTION public.admin_toggle_promo_code(p_admin_id uuid, p_promo_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_level integer;
  v_new_status boolean;
BEGIN
  SELECT public.get_admin_level(role) INTO v_admin_level
  FROM public.user_roles
  WHERE user_id = p_admin_id;
  
  IF v_admin_level IS NULL OR v_admin_level < 1 THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;
  
  UPDATE public.promo_codes
  SET is_active = NOT is_active
  WHERE id = p_promo_id
  RETURNING is_active INTO v_new_status;
  
  IF v_new_status IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Promo code not found');
  END IF;
  
  RETURN json_build_object('success', true, 'is_active', v_new_status);
END;
$$;

-- Function to get all promo codes for admin
CREATE OR REPLACE FUNCTION public.admin_get_promo_codes(p_admin_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_level integer;
  v_promos json;
BEGIN
  SELECT public.get_admin_level(role) INTO v_admin_level
  FROM public.user_roles
  WHERE user_id = p_admin_id;
  
  IF v_admin_level IS NULL OR v_admin_level < 1 THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;
  
  SELECT json_agg(
    json_build_object(
      'id', p.id,
      'code', p.code,
      'amount', p.amount,
      'max_redemptions', p.max_redemptions,
      'current_redemptions', p.current_redemptions,
      'is_active', p.is_active,
      'expires_at', p.expires_at,
      'created_at', p.created_at
    )
    ORDER BY p.created_at DESC
  )
  INTO v_promos
  FROM public.promo_codes p;
  
  RETURN json_build_object('success', true, 'promos', COALESCE(v_promos, '[]'::json));
END;
$$;