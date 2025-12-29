-- Fix the get_all_sms_servers function - ORDER BY must be inside json_agg
CREATE OR REPLACE FUNCTION public.get_all_sms_servers()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'id', s.id,
          'server_name', s.server_name,
          'country_name', s.country_name,
          'country_flag', s.country_flag,
          'is_active', s.is_active
        )
        ORDER BY s.created_at DESC
      ),
      '[]'::json
    )
    FROM sms_servers s
  );
END;
$$;