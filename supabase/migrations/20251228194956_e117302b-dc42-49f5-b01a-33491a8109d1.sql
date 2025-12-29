-- Create SECURITY DEFINER function to get public servers (combines sms_servers and auto_sms_servers)
CREATE OR REPLACE FUNCTION public.get_public_servers()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(servers), '[]'::json)
    FROM (
      -- From sms_servers
      SELECT id, server_name, country_flag, country_name, country_code, country_dial_code, is_active
      FROM sms_servers WHERE is_active = true
      UNION ALL
      -- From auto_sms_servers
      SELECT id, server_name, country_flag, country_name, country_code, country_dial_code, is_active
      FROM auto_sms_servers WHERE is_active = true
    ) servers
  );
END;
$$;

-- Create SECURITY DEFINER function to get public services (combines services and auto_services)
CREATE OR REPLACE FUNCTION public.get_public_services()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(services), '[]'::json)
    FROM (
      -- From services (no operator column)
      SELECT id, service_name, service_code, final_price, logo_url, server_id, is_popular, cancel_disable_time, NULL::text as operator
      FROM services WHERE is_active = true
      UNION ALL
      -- From auto_services (has operator column)
      SELECT id, service_name, service_code, final_price, logo_url, server_id, is_popular, cancel_disable_time, operator
      FROM auto_services WHERE is_active = true
    ) services
  );
END;
$$;

-- Drop the 4 public views (no longer needed)
DROP VIEW IF EXISTS public_sms_servers;
DROP VIEW IF EXISTS public_auto_sms_servers;
DROP VIEW IF EXISTS public_services;
DROP VIEW IF EXISTS public_auto_services;