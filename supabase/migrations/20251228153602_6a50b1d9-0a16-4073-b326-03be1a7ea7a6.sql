-- Create secure RPC function to get smsbower servers for stock fetching
-- This returns only the server IDs and country codes needed for stock fetching
-- The edge function will handle the API key securely
CREATE OR REPLACE FUNCTION public.get_smsbower_server_ids()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'id', id,
          'country_code', country_code
        )
      ),
      '[]'::json
    )
    FROM auto_sms_servers
    WHERE provider = 'smsbower' AND is_active = true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_smsbower_server_ids() TO anon, authenticated;