-- Add api_cancel_number_url column to sms_servers table
ALTER TABLE public.sms_servers
ADD COLUMN api_cancel_number_url TEXT;

-- Update the admin_add_sms_server function to include the new field
CREATE OR REPLACE FUNCTION public.admin_add_sms_server(
  p_admin_id UUID,
  p_server_name TEXT,
  p_country_code TEXT,
  p_country_name TEXT,
  p_country_dial_code TEXT,
  p_country_flag TEXT,
  p_api_response_type TEXT,
  p_uses_headers BOOLEAN,
  p_header_key_name TEXT,
  p_header_value TEXT,
  p_api_get_number_url TEXT,
  p_api_get_message_url TEXT,
  p_api_activate_next_message_url TEXT,
  p_api_cancel_number_url TEXT,
  p_number_id_path TEXT,
  p_phone_number_path TEXT,
  p_otp_path_in_json TEXT,
  p_auto_cancel_minutes INTEGER,
  p_api_retry_count INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_admin_level INTEGER;
  v_new_server sms_servers%ROWTYPE;
BEGIN
  -- Check admin level (handler+ can add servers)
  SELECT public.get_admin_level(role) INTO v_admin_level
  FROM public.user_roles
  WHERE user_id = p_admin_id;
  
  IF v_admin_level IS NULL OR v_admin_level < 1 THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;
  
  -- Insert new server
  INSERT INTO public.sms_servers (
    server_name, country_code, country_name, country_dial_code, country_flag,
    api_response_type, uses_headers, header_key_name, header_value,
    api_get_number_url, api_get_message_url, api_activate_next_message_url, api_cancel_number_url,
    number_id_path, phone_number_path, otp_path_in_json,
    auto_cancel_minutes, api_retry_count, created_by
  ) VALUES (
    p_server_name, p_country_code, p_country_name, p_country_dial_code, p_country_flag,
    p_api_response_type, p_uses_headers, p_header_key_name, p_header_value,
    p_api_get_number_url, p_api_get_message_url, p_api_activate_next_message_url, p_api_cancel_number_url,
    p_number_id_path, p_phone_number_path, p_otp_path_in_json,
    p_auto_cancel_minutes, p_api_retry_count, p_admin_id
  )
  RETURNING * INTO v_new_server;
  
  RETURN json_build_object(
    'success', true,
    'server', json_build_object(
      'id', v_new_server.id,
      'server_name', v_new_server.server_name,
      'country_name', v_new_server.country_name
    )
  );
END;
$$;