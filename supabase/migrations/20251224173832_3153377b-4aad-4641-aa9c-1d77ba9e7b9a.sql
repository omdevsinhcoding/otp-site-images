-- Create function to check admin level permissions
CREATE OR REPLACE FUNCTION public.get_admin_level(p_role app_role)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_role
    WHEN 'owner' THEN 3
    WHEN 'manager' THEN 2
    WHEN 'handler' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'moderator' THEN 1
    ELSE 0
  END
$$;

-- Create function to check if user has minimum admin level
CREATE OR REPLACE FUNCTION public.has_admin_level(p_user_id uuid, p_min_level integer)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = p_user_id
      AND public.get_admin_level(ur.role) >= p_min_level
  )
$$;

-- Create function to get user's admin role details
CREATE OR REPLACE FUNCTION public.get_admin_role(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role;
  v_level integer;
BEGIN
  SELECT role INTO v_role
  FROM public.user_roles
  WHERE user_id = p_user_id
  LIMIT 1;
  
  IF v_role IS NULL THEN
    RETURN json_build_object('role', 'user', 'level', 0, 'is_admin', false);
  END IF;
  
  v_level := public.get_admin_level(v_role);
  
  RETURN json_build_object(
    'role', v_role,
    'level', v_level,
    'is_admin', v_level > 0,
    'is_owner', v_role = 'owner',
    'is_manager', v_role IN ('owner', 'manager', 'admin'),
    'is_handler', v_level > 0
  );
END;
$$;

-- Create function to add/update admin role (owner only)
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_owner_id uuid,
  p_target_user_id uuid,
  p_new_role app_role
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_role app_role;
  v_target_email text;
  v_target_uid text;
BEGIN
  SELECT role INTO v_owner_role
  FROM public.user_roles
  WHERE user_id = p_owner_id;
  
  IF v_owner_role != 'owner' THEN
    RETURN json_build_object('success', false, 'error', 'Only owners can manage admin roles');
  END IF;
  
  SELECT email, uid INTO v_target_email, v_target_uid
  FROM public.users
  WHERE id = p_target_user_id;
  
  IF v_target_email IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  INSERT INTO public.user_roles (user_id, role, email, uid)
  VALUES (p_target_user_id, p_new_role, v_target_email, v_target_uid)
  ON CONFLICT (user_id) 
  DO UPDATE SET role = p_new_role, email = v_target_email, uid = v_target_uid;
  
  RETURN json_build_object(
    'success', true,
    'user_id', p_target_user_id,
    'email', v_target_email,
    'new_role', p_new_role
  );
END;
$$;

-- Create function to remove admin role (owner only)
CREATE OR REPLACE FUNCTION public.admin_remove_user_role(
  p_owner_id uuid,
  p_target_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_role app_role;
  v_target_email text;
BEGIN
  SELECT role INTO v_owner_role
  FROM public.user_roles
  WHERE user_id = p_owner_id;
  
  IF v_owner_role != 'owner' THEN
    RETURN json_build_object('success', false, 'error', 'Only owners can remove admin roles');
  END IF;
  
  SELECT email INTO v_target_email
  FROM public.users
  WHERE id = p_target_user_id;
  
  DELETE FROM public.user_roles
  WHERE user_id = p_target_user_id;
  
  RETURN json_build_object(
    'success', true,
    'user_id', p_target_user_id,
    'email', v_target_email,
    'message', 'Admin role removed'
  );
END;
$$;

-- Create function to get all admins (for admin management page)
CREATE OR REPLACE FUNCTION public.get_all_admins(p_requester_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requester_level integer;
  v_admins json;
BEGIN
  SELECT public.get_admin_level(role) INTO v_requester_level
  FROM public.user_roles
  WHERE user_id = p_requester_id;
  
  IF v_requester_level < 3 THEN
    RETURN json_build_object('success', false, 'error', 'Only owners can view admin list');
  END IF;
  
  SELECT json_agg(
    json_build_object(
      'id', u.id,
      'uid', u.uid,
      'email', u.email,
      'name', u.name,
      'role', ur.role,
      'level', public.get_admin_level(ur.role),
      'created_at', ur.created_at,
      'last_active', u.last_active
    )
    ORDER BY public.get_admin_level(ur.role) DESC, ur.created_at ASC
  )
  INTO v_admins
  FROM public.user_roles ur
  JOIN public.users u ON u.id = ur.user_id
  WHERE public.get_admin_level(ur.role) > 0;
  
  RETURN json_build_object('success', true, 'admins', COALESCE(v_admins, '[]'::json));
END;
$$;

-- Set om@om.com as owner
DO $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_user_uid text;
BEGIN
  SELECT id, email, uid INTO v_user_id, v_user_email, v_user_uid
  FROM public.users
  WHERE email = 'om@om.com';
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, email, uid)
    VALUES (v_user_id, 'owner', v_user_email, v_user_uid)
    ON CONFLICT (user_id) 
    DO UPDATE SET role = 'owner', email = v_user_email, uid = v_user_uid;
  END IF;
END $$;