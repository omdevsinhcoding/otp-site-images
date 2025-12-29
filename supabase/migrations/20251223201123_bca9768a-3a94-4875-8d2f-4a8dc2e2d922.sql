-- Update admin_update_user_balance function to also create transaction records
CREATE OR REPLACE FUNCTION public.admin_update_user_balance(
  p_admin_id uuid,
  p_user_id uuid,
  p_amount numeric,
  p_operation text -- 'credit' or 'debit'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_current_balance numeric;
  v_new_balance numeric;
  v_transaction_type text;
BEGIN
  -- Check if requester is admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_admin_id AND role = 'admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;
  
  -- Get current balance or create wallet if not exists
  INSERT INTO public.user_wallets (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT balance INTO v_current_balance
  FROM public.user_wallets
  WHERE user_id = p_user_id;
  
  -- Calculate new balance and set transaction type
  IF p_operation = 'credit' THEN
    v_new_balance := v_current_balance + ABS(p_amount);
    v_transaction_type := 'recharge';
  ELSIF p_operation = 'debit' THEN
    v_new_balance := v_current_balance - ABS(p_amount);
    v_transaction_type := 'number_purchase';
    IF v_new_balance < 0 THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient balance for debit');
    END IF;
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid operation. Use credit or debit');
  END IF;
  
  -- Update balance
  UPDATE public.user_wallets
  SET balance = v_new_balance, updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Create transaction record
  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (
    p_user_id, 
    v_transaction_type, 
    ABS(p_amount),
    CASE 
      WHEN p_operation = 'credit' THEN 'Admin credit'
      ELSE 'Admin debit'
    END
  );
  
  RETURN json_build_object(
    'success', true,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'operation', p_operation,
    'amount', ABS(p_amount)
  );
END;
$$;

-- Update add_user_recharge function to also create transaction records
CREATE OR REPLACE FUNCTION public.add_user_recharge(p_user_id uuid, p_amount numeric)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance numeric;
  v_new_total_recharge numeric;
BEGIN
  -- Create wallet if not exists
  INSERT INTO public.user_wallets (user_id, balance, total_recharge, total_otp)
  VALUES (p_user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Update balance and total_recharge
  UPDATE public.user_wallets
  SET 
    balance = balance + ABS(p_amount),
    total_recharge = total_recharge + ABS(p_amount),
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING balance, total_recharge INTO v_new_balance, v_new_total_recharge;
  
  -- Create transaction record
  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'recharge', ABS(p_amount), 'Wallet recharge');
  
  RETURN json_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'total_recharge', v_new_total_recharge
  );
END;
$$;

-- Create function for number purchase (debit with transaction)
CREATE OR REPLACE FUNCTION public.deduct_for_number_purchase(p_user_id uuid, p_amount numeric, p_description text DEFAULT 'Number purchase')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance numeric;
  v_new_balance numeric;
BEGIN
  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM public.user_wallets
  WHERE user_id = p_user_id;
  
  IF v_current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  
  IF v_current_balance < ABS(p_amount) THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  -- Deduct balance and increment total_otp
  UPDATE public.user_wallets
  SET 
    balance = balance - ABS(p_amount),
    total_otp = total_otp + 1,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  -- Create transaction record
  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'number_purchase', ABS(p_amount), p_description);
  
  RETURN json_build_object(
    'success', true,
    'new_balance', v_new_balance
  );
END;
$$;

-- Update withdraw_referral_earnings to create transaction record
CREATE OR REPLACE FUNCTION public.withdraw_referral_earnings(p_user_id uuid)
RETURNS json
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
  
  -- Create transaction record
  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'referral_bonus', v_available, 'Referral earnings withdrawal');
  
  RETURN json_build_object(
    'success', true, 
    'amount_withdrawn', v_available,
    'new_wallet_balance', v_new_balance
  );
END;
$$;