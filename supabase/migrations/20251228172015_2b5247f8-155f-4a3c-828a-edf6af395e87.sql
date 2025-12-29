-- Drop existing views
DROP VIEW IF EXISTS public.public_sms_servers;
DROP VIEW IF EXISTS public.public_auto_sms_servers;

-- Recreate public_sms_servers with SECURITY DEFINER to bypass RLS
CREATE VIEW public.public_sms_servers 
WITH (security_invoker = false)
AS
SELECT 
  id,
  server_name,
  country_flag,
  country_name,
  country_code,
  country_dial_code,
  is_active,
  created_at,
  updated_at
FROM public.sms_servers;

-- Recreate public_auto_sms_servers with SECURITY DEFINER to bypass RLS  
CREATE VIEW public.public_auto_sms_servers
WITH (security_invoker = false)
AS
SELECT 
  id,
  server_name,
  country_flag,
  country_name,
  country_code,
  country_dial_code,
  is_active,
  provider,
  created_at,
  updated_at
FROM public.auto_sms_servers;

-- Grant SELECT permissions
GRANT SELECT ON public.public_sms_servers TO anon, authenticated;
GRANT SELECT ON public.public_auto_sms_servers TO anon, authenticated;