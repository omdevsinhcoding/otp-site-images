-- Update the get_all_sms_servers function to fetch from both sms_servers and auto_sms_servers tables
CREATE OR REPLACE FUNCTION public.get_all_sms_servers()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'id', combined.id,
          'server_name', combined.server_name,
          'country_name', combined.country_name,
          'country_flag', combined.country_flag,
          'country_code', combined.country_code,
          'is_active', combined.is_active,
          'source_table', combined.source_table
        )
        ORDER BY combined.created_at DESC
      ),
      '[]'::json
    )
    FROM (
      -- From sms_servers table
      SELECT 
        s.id,
        s.server_name,
        s.country_name,
        s.country_flag,
        s.country_code,
        s.is_active,
        s.created_at,
        'sms_servers' as source_table
      FROM sms_servers s
      
      UNION ALL
      
      -- From auto_sms_servers table
      SELECT 
        a.id,
        a.server_name,
        a.country_name,
        a.country_flag,
        a.country_code,
        a.is_active,
        a.created_at,
        'auto_sms_servers' as source_table
      FROM auto_sms_servers a
    ) combined
  );
END;
$function$