-- Add is_banned column to users table
ALTER TABLE public.users ADD COLUMN is_banned boolean NOT NULL DEFAULT false;

-- Create function to ban/unban a user (admin only)
CREATE OR REPLACE FUNCTION public.admin_ban_user(p_admin_id uuid, p_user_id uuid, p_ban boolean)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_user_email text;
BEGIN
  -- Check if requester is admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_admin_id AND role = 'admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;
  
  -- Get user email for confirmation message
  SELECT email INTO v_user_email FROM public.users WHERE id = p_user_id;
  
  IF v_user_email IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Update ban status
  UPDATE public.users
  SET is_banned = p_ban, updated_at = now()
  WHERE id = p_user_id;
  
  RETURN json_build_object(
    'success', true,
    'is_banned', p_ban,
    'email', v_user_email,
    'message', CASE WHEN p_ban THEN 'User has been banned' ELSE 'User has been unbanned' END
  );
END;
$$;

-- Update login_user function to check for banned status
CREATE OR REPLACE FUNCTION public.login_user(p_email text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Find user by email
  SELECT id, uid, email, password_hash, name, created_at, is_banned
  INTO v_user
  FROM public.users
  WHERE email = LOWER(TRIM(p_email));
  
  IF v_user IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
  -- Verify password
  IF NOT public.verify_password(p_password, v_user.password_hash) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
  -- Check if user is banned
  IF v_user.is_banned THEN
    RETURN json_build_object('success', false, 'error', 'banned', 'is_banned', true);
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_user.id,
      'uid', v_user.uid,
      'email', v_user.email,
      'name', v_user.name,
      'created_at', v_user.created_at
    )
  );
END;
$$;

-- Update admin_get_all_users to include is_banned
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
      'is_banned', u.is_banned,
      'balance', COALESCE(w.balance, 0),
      'total_recharge', COALESCE(w.total_recharge, 0),
      'total_otp', COALESCE(w.total_otp, 0),
      'role', COALESCE(r.role, 'user'),
      'discount_type', COALESCE(w.discount_type, 'percentage'),
      'discount_value', COALESCE(w.discount_value, 0)
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