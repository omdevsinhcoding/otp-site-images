-- Add last_active column to users table for activity tracking
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_active timestamp with time zone DEFAULT now();

-- Create function to update last_active timestamp
CREATE OR REPLACE FUNCTION public.update_user_last_active(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET last_active = now()
  WHERE id = p_user_id;
END;
$$;

-- Create function for admin to update user balance (credit/debit)
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
  
  -- Calculate new balance
  IF p_operation = 'credit' THEN
    v_new_balance := v_current_balance + ABS(p_amount);
  ELSIF p_operation = 'debit' THEN
    v_new_balance := v_current_balance - ABS(p_amount);
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
  
  RETURN json_build_object(
    'success', true,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'operation', p_operation,
    'amount', ABS(p_amount)
  );
END;
$$;

-- Create function for admin to reset user password
CREATE OR REPLACE FUNCTION public.admin_reset_user_password(
  p_admin_id uuid,
  p_user_id uuid,
  p_new_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Check if requester is admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_admin_id AND role = 'admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
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
$$;

-- Create function to get all users for admin
CREATE OR REPLACE FUNCTION public.admin_get_all_users(p_admin_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_users json;
BEGIN
  -- Check if requester is admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_admin_id AND role = 'admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;
  
  SELECT json_agg(
    json_build_object(
      'id', u.id,
      'uid', u.uid,
      'email', u.email,
      'name', u.name,
      'created_at', u.created_at,
      'last_active', u.last_active,
      'balance', COALESCE(w.balance, 0),
      'role', COALESCE(r.role, 'user')
    )
    ORDER BY u.created_at DESC
  )
  INTO v_users
  FROM public.users u
  LEFT JOIN public.user_wallets w ON u.id = w.user_id
  LEFT JOIN public.user_roles r ON u.id = r.user_id;
  
  RETURN json_build_object('success', true, 'users', COALESCE(v_users, '[]'::json));
END;
$$;