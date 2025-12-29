-- Update admin_update_user_balance to use get_admin_level (manager+ level 2)
CREATE OR REPLACE FUNCTION public.admin_update_user_balance(p_admin_id uuid, p_user_id uuid, p_amount numeric, p_operation text, p_notes text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_level integer;
  v_current_balance numeric;
  v_new_balance numeric;
  v_transaction_type text;
  v_description text;
BEGIN
  -- Check if requester has manager+ level (level 2+)
  SELECT public.get_admin_level(role) INTO v_admin_level
  FROM public.user_roles
  WHERE user_id = p_admin_id;
  
  IF v_admin_level IS NULL OR v_admin_level < 2 THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Manager or higher access required');
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
    v_description := COALESCE(p_notes, 'Admin credit');
  ELSIF p_operation = 'debit' THEN
    v_new_balance := v_current_balance - ABS(p_amount);
    v_transaction_type := 'number_purchase';
    v_description := COALESCE(p_notes, 'Admin debit');
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
  
  -- Create transaction record with admin_id
  INSERT INTO public.transactions (user_id, type, amount, description, admin_id)
  VALUES (p_user_id, v_transaction_type, ABS(p_amount), v_description, p_admin_id);
  
  RETURN json_build_object(
    'success', true,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'operation', p_operation,
    'amount', ABS(p_amount)
  );
END;
$function$;

-- Update admin_reset_user_password to use get_admin_level (handler+ level 1)
CREATE OR REPLACE FUNCTION public.admin_reset_user_password(p_admin_id uuid, p_user_id uuid, p_new_password text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_level integer;
BEGIN
  -- Check if requester has handler+ level (level 1+)
  SELECT public.get_admin_level(role) INTO v_admin_level
  FROM public.user_roles
  WHERE user_id = p_admin_id;
  
  IF v_admin_level IS NULL OR v_admin_level < 1 THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;
  
  -- Validate password length
  IF LENGTH(p_new_password) < 6 THEN
    RETURN json_build_object('success', false, 'error', 'Password must be at least 6 characters');
  END IF;
  
  -- Update password
  UPDATE public.users
  SET password_hash = public.hash_password(p_new_password), updated_at = now()
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Password reset successfully');
END;
$function$;

-- Update admin_update_user_stats to use get_admin_level (manager+ level 2)
CREATE OR REPLACE FUNCTION public.admin_update_user_stats(p_admin_id uuid, p_user_id uuid, p_balance numeric DEFAULT NULL::numeric, p_total_recharge numeric DEFAULT NULL::numeric, p_total_otp integer DEFAULT NULL::integer)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_level integer;
BEGIN
  -- Check if requester has manager+ level (level 2+)
  SELECT public.get_admin_level(role) INTO v_admin_level
  FROM public.user_roles
  WHERE user_id = p_admin_id;
  
  IF v_admin_level IS NULL OR v_admin_level < 2 THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Manager or higher access required');
  END IF;
  
  -- Create wallet if not exists
  INSERT INTO public.user_wallets (user_id, balance, total_recharge, total_otp)
  VALUES (p_user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Update only provided fields
  UPDATE public.user_wallets
  SET 
    balance = COALESCE(p_balance, balance),
    total_recharge = COALESCE(p_total_recharge, total_recharge),
    total_otp = COALESCE(p_total_otp, total_otp),
    updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN json_build_object('success', true, 'message', 'User stats updated successfully');
END;
$function$;

-- Update admin_update_user_discount to use get_admin_level (manager+ level 2)
CREATE OR REPLACE FUNCTION public.admin_update_user_discount(p_admin_id uuid, p_user_id uuid, p_discount_type text, p_discount_value numeric)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_level integer;
BEGIN
  -- Check if requester has manager+ level (level 2+)
  SELECT public.get_admin_level(role) INTO v_admin_level
  FROM public.user_roles
  WHERE user_id = p_admin_id;
  
  IF v_admin_level IS NULL OR v_admin_level < 2 THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Manager or higher access required');
  END IF;
  
  -- Validate discount type
  IF p_discount_type NOT IN ('percentage', 'fixed') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid discount type. Use percentage or fixed');
  END IF;
  
  -- Validate discount value
  IF p_discount_value < 0 THEN
    RETURN json_build_object('success', false, 'error', 'Discount value cannot be negative');
  END IF;
  
  -- For percentage, max 100%
  IF p_discount_type = 'percentage' AND p_discount_value > 100 THEN
    RETURN json_build_object('success', false, 'error', 'Percentage discount cannot exceed 100%');
  END IF;
  
  -- Create wallet if not exists
  INSERT INTO public.user_wallets (user_id, balance, discount_type, discount_value)
  VALUES (p_user_id, 0, 'percentage', 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Update discount
  UPDATE public.user_wallets
  SET 
    discount_type = p_discount_type,
    discount_value = p_discount_value,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN json_build_object(
    'success', true,
    'discount_type', p_discount_type,
    'discount_value', p_discount_value
  );
END;
$function$;