-- Update admin_get_all_users to recognize new admin roles (owner, manager, handler)
CREATE OR REPLACE FUNCTION public.admin_get_all_users(p_admin_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_level integer;
  v_users json;
BEGIN
  -- Check if requester has any admin level (owner=3, manager=2, handler=1)
  SELECT public.get_admin_level(role) INTO v_admin_level
  FROM public.user_roles
  WHERE user_id = p_admin_id;
  
  IF v_admin_level IS NULL OR v_admin_level < 1 THEN
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