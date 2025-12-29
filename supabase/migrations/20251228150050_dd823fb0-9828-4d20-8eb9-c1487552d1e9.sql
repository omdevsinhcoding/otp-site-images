-- Drop the conflicting policy first
DROP POLICY IF EXISTS "Anyone can view services" ON public.services;
DROP POLICY IF EXISTS "System functions only - view services" ON public.services;

-- 1. Services - allow public read (services don't have secrets, just pricing)
CREATE POLICY "Anyone can view services"
ON public.services FOR SELECT USING (true);

-- 2. Auto Services - allow public read
DROP POLICY IF EXISTS "Anyone can view auto services" ON public.auto_services;
DROP POLICY IF EXISTS "System functions only - view auto services" ON public.auto_services;
CREATE POLICY "Anyone can view auto services"
ON public.auto_services FOR SELECT USING (true);

-- 3. SMS Servers - create a PUBLIC view without secrets, keep table locked
DROP VIEW IF EXISTS public.public_sms_servers;
CREATE VIEW public.public_sms_servers 
WITH (security_invoker = true) AS
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

GRANT SELECT ON public.public_sms_servers TO anon;
GRANT SELECT ON public.public_sms_servers TO authenticated;

-- 4. Auto SMS Servers - create a PUBLIC view without secrets
DROP VIEW IF EXISTS public.public_auto_sms_servers;
CREATE VIEW public.public_auto_sms_servers 
WITH (security_invoker = true) AS
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

GRANT SELECT ON public.public_auto_sms_servers TO anon;
GRANT SELECT ON public.public_auto_sms_servers TO authenticated;

-- 5. Create RPC function to get admin stats (since direct table queries are blocked)
CREATE OR REPLACE FUNCTION public.get_admin_stats(p_admin_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_level integer;
  v_total_users integer;
  v_total_balance numeric;
  v_total_transactions integer;
BEGIN
  -- Check admin access
  SELECT public.get_admin_level(role) INTO v_admin_level
  FROM public.user_roles
  WHERE user_id = p_admin_id;
  
  IF v_admin_level IS NULL OR v_admin_level < 1 THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  SELECT COUNT(*) INTO v_total_users FROM public.users;
  SELECT COALESCE(SUM(balance), 0) INTO v_total_balance FROM public.user_wallets;
  SELECT COUNT(*) INTO v_total_transactions FROM public.transactions;
  
  RETURN json_build_object(
    'success', true,
    'total_users', v_total_users,
    'total_balance', v_total_balance,
    'total_transactions', v_total_transactions
  );
END;
$$;

-- 6. Create RPC function to get server and service details for NumberHistory
CREATE OR REPLACE FUNCTION public.get_server_details(p_server_ids uuid[])
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT json_agg(servers)
    FROM (
      SELECT id, server_name, country_dial_code FROM public.sms_servers WHERE id = ANY(p_server_ids)
      UNION ALL
      SELECT id, server_name, country_dial_code FROM public.auto_sms_servers WHERE id = ANY(p_server_ids)
    ) servers
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_service_details(p_service_ids uuid[])
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT json_agg(services)
    FROM (
      SELECT id, service_name, logo_url, cancel_disable_time FROM public.services WHERE id = ANY(p_service_ids)
      UNION ALL
      SELECT id, service_name, logo_url, cancel_disable_time FROM public.auto_services WHERE id = ANY(p_service_ids)
    ) services
  );
END;
$$;