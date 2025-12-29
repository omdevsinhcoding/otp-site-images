-- Drop existing views
DROP VIEW IF EXISTS public.public_services;
DROP VIEW IF EXISTS public.public_auto_services;

-- Recreate public_services with SECURITY DEFINER to bypass RLS
CREATE VIEW public.public_services 
WITH (security_invoker = false)
AS
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

-- Recreate public_auto_services with SECURITY DEFINER to bypass RLS  
CREATE VIEW public.public_auto_services
WITH (security_invoker = false)
AS
SELECT 
  id,
  server_id,
  service_name,
  service_code,
  operator,
  logo_url,
  final_price,
  is_active,
  is_popular,
  cancel_disable_time,
  created_at,
  updated_at
FROM public.auto_services;

-- Grant SELECT permissions
GRANT SELECT ON public.public_services TO anon, authenticated;
GRANT SELECT ON public.public_auto_services TO anon, authenticated;