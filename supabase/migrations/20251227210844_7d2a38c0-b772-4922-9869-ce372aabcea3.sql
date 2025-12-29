-- Create UPI settings table for admin configuration
CREATE TABLE public.upi_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upi_id text NOT NULL DEFAULT '',
  upi_qr_url text NOT NULL DEFAULT '',
  merchant_id text NOT NULL DEFAULT '',
  merchant_token text NOT NULL DEFAULT '',
  min_recharge numeric NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default settings row
INSERT INTO public.upi_settings (id) VALUES (gen_random_uuid());

-- Create UPI recharges table to track used UTR numbers
CREATE TABLE public.upi_recharges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id),
  amount numeric NOT NULL,
  txn_id text NOT NULL UNIQUE,
  payer_name text,
  payer_handle text,
  status text NOT NULL DEFAULT 'success',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.upi_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upi_recharges ENABLE ROW LEVEL SECURITY;

-- UPI Settings policies - only admins can manage
CREATE POLICY "Admins can view upi settings" ON public.upi_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update upi settings" ON public.upi_settings
  FOR UPDATE USING (true);

-- UPI Recharges policies
CREATE POLICY "System can insert upi recharges" ON public.upi_recharges
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own upi recharges" ON public.upi_recharges
  FOR SELECT USING (user_id IN (SELECT id FROM public.users));

-- Create function to verify and process UPI recharge
CREATE OR REPLACE FUNCTION public.process_upi_recharge(
  p_user_id uuid,
  p_amount numeric,
  p_txn_id text,
  p_payer_name text DEFAULT NULL,
  p_payer_handle text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_balance numeric;
  v_new_total_recharge numeric;
  v_referrer_id uuid;
  v_refer_percent numeric := 5.00;
  v_refer_commission numeric;
BEGIN
  -- Check if UTR already used
  IF EXISTS (SELECT 1 FROM public.upi_recharges WHERE txn_id = p_txn_id) THEN
    RETURN json_build_object('success', false, 'error', 'UTR already used');
  END IF;
  
  -- Create wallet if not exists
  INSERT INTO public.user_wallets (user_id, balance, total_recharge, total_otp)
  VALUES (p_user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Insert UPI recharge record
  INSERT INTO public.upi_recharges (user_id, amount, txn_id, payer_name, payer_handle)
  VALUES (p_user_id, p_amount, p_txn_id, p_payer_name, p_payer_handle);
  
  -- Update user balance
  UPDATE public.user_wallets
  SET 
    balance = balance + p_amount,
    total_recharge = total_recharge + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING balance, total_recharge INTO v_new_balance, v_new_total_recharge;
  
  -- Create transaction record
  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'recharge', p_amount, 'UPI Recharge - UTR: ' || p_txn_id);
  
  -- Handle referral commission
  SELECT referrer_id INTO v_referrer_id
  FROM public.referrals
  WHERE referred_user_id = p_user_id;
  
  IF v_referrer_id IS NOT NULL THEN
    v_refer_commission := (v_refer_percent / 100) * p_amount;
    
    -- Update referral earnings
    UPDATE public.referral_earnings
    SET 
      total_earned = total_earned + v_refer_commission,
      available_balance = available_balance + v_refer_commission,
      updated_at = now()
    WHERE user_id = v_referrer_id;
    
    -- Update referral deposit amount
    UPDATE public.referrals
    SET 
      deposit_amount = deposit_amount + p_amount,
      commission_amount = commission_amount + v_refer_commission
    WHERE referred_user_id = p_user_id;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'amount', p_amount,
    'new_balance', v_new_balance,
    'total_recharge', v_new_total_recharge
  );
END;
$$;

-- Create function to get/update UPI settings (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_upi_settings(p_admin_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_level integer;
  v_settings json;
BEGIN
  SELECT public.get_admin_level(role) INTO v_admin_level
  FROM public.user_roles
  WHERE user_id = p_admin_id;
  
  IF v_admin_level IS NULL OR v_admin_level < 2 THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Manager or higher access required');
  END IF;
  
  SELECT json_build_object(
    'upi_id', upi_id,
    'upi_qr_url', upi_qr_url,
    'merchant_id', merchant_id,
    'merchant_token', merchant_token,
    'min_recharge', min_recharge,
    'is_active', is_active
  ) INTO v_settings
  FROM public.upi_settings
  LIMIT 1;
  
  RETURN json_build_object('success', true, 'settings', v_settings);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_upi_settings(
  p_admin_id uuid,
  p_upi_id text,
  p_upi_qr_url text,
  p_merchant_id text,
  p_merchant_token text,
  p_min_recharge numeric,
  p_is_active boolean DEFAULT true
)
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
  
  IF v_admin_level IS NULL OR v_admin_level < 2 THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Manager or higher access required');
  END IF;
  
  UPDATE public.upi_settings
  SET 
    upi_id = p_upi_id,
    upi_qr_url = p_upi_qr_url,
    merchant_id = p_merchant_id,
    merchant_token = p_merchant_token,
    min_recharge = p_min_recharge,
    is_active = p_is_active,
    updated_at = now()
  WHERE id = (SELECT id FROM public.upi_settings LIMIT 1);
  
  RETURN json_build_object('success', true, 'message', 'UPI settings updated successfully');
END;
$$;

-- Create function to get public UPI settings (for users)
CREATE OR REPLACE FUNCTION public.get_upi_settings_public()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'upi_id', upi_id,
      'upi_qr_url', upi_qr_url,
      'min_recharge', min_recharge,
      'is_active', is_active
    )
    FROM public.upi_settings
    LIMIT 1
  );
END;
$$;