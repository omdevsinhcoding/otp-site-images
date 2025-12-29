-- Add service discount columns to user_wallets table
ALTER TABLE public.user_wallets 
ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
ADD COLUMN IF NOT EXISTS discount_value numeric DEFAULT 0;

-- Create function to update user discount
CREATE OR REPLACE FUNCTION public.admin_update_user_discount(
  p_admin_id uuid,
  p_user_id uuid,
  p_discount_type text,
  p_discount_value numeric
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
$$;

-- Update admin_get_all_users to include discount info
CREATE OR REPLACE FUNCTION public.admin_get_all_users(p_admin_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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