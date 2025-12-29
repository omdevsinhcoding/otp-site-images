-- Update admin_ban_user to accept all admin levels (owner, manager, handler)
CREATE OR REPLACE FUNCTION public.admin_ban_user(p_admin_id uuid, p_user_id uuid, p_ban boolean)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_level integer;
  v_user_email text;
BEGIN
  -- Check if requester has any admin level (handler, manager, or owner)
  SELECT public.get_admin_level(role) INTO v_admin_level
  FROM public.user_roles
  WHERE user_id = p_admin_id;
  
  IF v_admin_level IS NULL OR v_admin_level < 1 THEN
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