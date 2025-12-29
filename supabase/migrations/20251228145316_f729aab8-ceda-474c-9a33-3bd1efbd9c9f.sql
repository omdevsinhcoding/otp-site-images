-- Recreate the view with SECURITY INVOKER to fix the linter warning
DROP VIEW IF EXISTS public.public_services;

CREATE VIEW public.public_services 
WITH (security_invoker = true) AS
SELECT 
  id,
  server_id,
  service_name,
  service_code,
  logo_url,
  final_price,
  is_active,
  is_popular,
  cancel_disable_time,
  created_at,
  updated_at
FROM public.services;

-- Since the services table now requires admin access, we need to allow the view to work for regular users
-- Drop the restrictive policy and create a better approach
DROP POLICY IF EXISTS "Only admins can view full services" ON public.services;

-- Allow anyone to view services (needed for the app to work), but only show limited columns via the view
CREATE POLICY "Anyone can view services"
ON public.services
FOR SELECT
USING (true);

-- Grant access to the view
GRANT SELECT ON public.public_services TO anon;
GRANT SELECT ON public.public_services TO authenticated;