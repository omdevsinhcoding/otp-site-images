-- Create a function to get admin counts by role
CREATE OR REPLACE FUNCTION public.get_admin_counts_by_role()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT json_build_object(
    'owner', COALESCE((SELECT COUNT(*) FROM public.user_roles WHERE role = 'owner'), 0),
    'manager', COALESCE((SELECT COUNT(*) FROM public.user_roles WHERE role = 'manager'), 0),
    'handler', COALESCE((SELECT COUNT(*) FROM public.user_roles WHERE role = 'handler'), 0),
    'admin', COALESCE((SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin'), 0),
    'moderator', COALESCE((SELECT COUNT(*) FROM public.user_roles WHERE role = 'moderator'), 0)
  )
$$;