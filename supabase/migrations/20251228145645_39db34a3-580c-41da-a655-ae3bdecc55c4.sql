-- 1. Create secure view for auto_services (hide base_price and margin_percentage)
CREATE VIEW public.public_auto_services 
WITH (security_invoker = true) AS
SELECT 
  id,
  server_id,
  service_name,
  service_code,
  logo_url,
  final_price,
  operator,
  is_active,
  is_popular,
  cancel_disable_time,
  created_at,
  updated_at
FROM public.auto_services;

-- Grant access to the view
GRANT SELECT ON public.public_auto_services TO anon;
GRANT SELECT ON public.public_auto_services TO authenticated;

-- 2. Fix users table RLS - users should only see their own data
DROP POLICY IF EXISTS "Users can view own data" ON public.users;

CREATE POLICY "Users can view own data"
ON public.users
FOR SELECT
USING (id IN (SELECT id FROM public.users WHERE uid = (SELECT uid FROM public.users WHERE id = auth.uid())));

-- Actually, since we use custom auth (not Supabase auth), we need a different approach
-- The app stores user_id in localStorage and passes it. Let's allow authenticated system access
-- but restrict direct table access to the user's own record via RPC functions
DROP POLICY IF EXISTS "Users can view own data" ON public.users;

-- Only allow viewing via security definer functions (login_user, register_user, etc.)
-- Direct table access should be restricted
CREATE POLICY "System functions can access users"
ON public.users
FOR SELECT
USING (false); -- Block direct access, use RPC functions instead

-- Allow insert for registration
DROP POLICY IF EXISTS "Anyone can register" ON public.users;
CREATE POLICY "Anyone can register"
ON public.users
FOR INSERT
WITH CHECK (true);

-- Allow system updates via security definer functions
CREATE POLICY "System can update users"
ON public.users
FOR UPDATE
USING (true);

-- 3. Fix user_roles table RLS - only allow users to see their own role
DROP POLICY IF EXISTS "Anyone can view roles for stats" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Users can only see their own role
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
USING (false); -- Block direct access, use has_role() and get_user_role() functions instead

-- Admins can manage roles (via security definer functions)
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_admin_level(user_id, 3)); -- Only owners can manage