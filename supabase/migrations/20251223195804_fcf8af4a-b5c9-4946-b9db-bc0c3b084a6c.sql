-- Add total_recharge and total_otp columns to user_wallets table
ALTER TABLE public.user_wallets 
ADD COLUMN IF NOT EXISTS total_recharge numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_otp integer NOT NULL DEFAULT 0;

-- Create function to get user stats for dashboard
CREATE OR REPLACE FUNCTION public.get_user_dashboard_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats json;
BEGIN
  -- Create wallet if not exists
  INSERT INTO public.user_wallets (user_id, balance, total_recharge, total_otp)
  VALUES (p_user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT json_build_object(
    'balance', COALESCE(balance, 0),
    'total_recharge', COALESCE(total_recharge, 0),
    'total_otp', COALESCE(total_otp, 0)
  )
  INTO v_stats
  FROM public.user_wallets
  WHERE user_id = p_user_id;
  
  RETURN v_stats;
END;
$$;

-- Create function to add recharge (for user recharge flow)
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
  
  RETURN json_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'total_recharge', v_new_total_recharge
  );
END;
$$;

-- Update admin function to include new fields
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
      'total_recharge', COALESCE(w.total_recharge, 0),
      'total_otp', COALESCE(w.total_otp, 0),
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

-- Create admin function to update user stats (balance, total_recharge, total_otp)
CREATE OR REPLACE FUNCTION public.admin_update_user_stats(
  p_admin_id uuid,
  p_user_id uuid,
  p_balance numeric DEFAULT NULL,
  p_total_recharge numeric DEFAULT NULL,
  p_total_otp integer DEFAULT NULL
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
$$;