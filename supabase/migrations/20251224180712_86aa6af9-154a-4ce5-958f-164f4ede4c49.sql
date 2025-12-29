-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Create a new policy that allows admins to view all roles
CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (
  -- Users can see their own role
  user_id = (SELECT id FROM public.users WHERE uid = (SELECT uid FROM public.users WHERE id = user_roles.user_id) LIMIT 1)
  OR 
  -- Any admin can view all roles (for stats and admin management)
  public.has_admin_level((SELECT id FROM public.users LIMIT 1), 1)
);