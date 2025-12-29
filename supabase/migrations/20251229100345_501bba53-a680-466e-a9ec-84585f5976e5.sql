-- Create secure RPC function to get full server details (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_server_details(p_admin_id uuid, p_server_id uuid, p_source_table text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_level integer;
  v_server_data json;
BEGIN
  -- Check if user has admin level 2+ (manager or higher)
  SELECT public.get_admin_level(role) INTO v_admin_level
  FROM public.user_roles
  WHERE user_id = p_admin_id;
  
  IF v_admin_level IS NULL OR v_admin_level < 2 THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Manager or higher access required');
  END IF;
  
  -- Fetch from appropriate table
  IF p_source_table = 'sms_servers' THEN
    SELECT json_build_object(
      'id', s.id,
      'server_name', s.server_name,
      'country_name', s.country_name,
      'country_code', s.country_code,
      'country_dial_code', s.country_dial_code,
      'country_flag', s.country_flag,
      'is_active', s.is_active,
      'api_get_number_url', s.api_get_number_url,
      'api_get_message_url', s.api_get_message_url,
      'api_cancel_number_url', s.api_cancel_number_url,
      'api_activate_next_message_url', s.api_activate_next_message_url,
      'api_response_type', s.api_response_type,
      'uses_headers', s.uses_headers,
      'header_key_name', s.header_key_name,
      'header_value', s.header_value,
      'number_id_path', s.number_id_path,
      'phone_number_path', s.phone_number_path,
      'otp_path_in_json', s.otp_path_in_json,
      'auto_cancel_minutes', s.auto_cancel_minutes,
      'api_retry_count', s.api_retry_count,
      'created_at', s.created_at,
      'updated_at', s.updated_at,
      'created_by', s.created_by,
      'source_table', 'sms_servers'
    ) INTO v_server_data
    FROM public.sms_servers s
    WHERE s.id = p_server_id;
  ELSIF p_source_table = 'auto_sms_servers' THEN
    SELECT json_build_object(
      'id', a.id,
      'server_name', a.server_name,
      'country_name', a.country_name,
      'country_code', a.country_code,
      'country_dial_code', a.country_dial_code,
      'country_flag', a.country_flag,
      'is_active', a.is_active,
      'api_get_number_url', a.api_get_number_url,
      'api_get_message_url', a.api_get_message_url,
      'api_cancel_number_url', a.api_cancel_number_url,
      'api_activate_next_message_url', a.api_activate_next_message_url,
      'api_response_type', a.api_response_type,
      'uses_headers', a.uses_headers,
      'header_key_name', a.header_key_name,
      'header_value', a.header_value,
      'number_id_path', a.number_id_path,
      'phone_number_path', a.phone_number_path,
      'otp_path_in_json', a.otp_path_in_json,
      'auto_cancel_minutes', a.auto_cancel_minutes,
      'api_retry_count', a.api_retry_count,
      'created_at', a.created_at,
      'updated_at', a.updated_at,
      'created_by', a.created_by,
      'api_key', a.api_key,
      'provider', a.provider,
      'source_table', 'auto_sms_servers'
    ) INTO v_server_data
    FROM public.auto_sms_servers a
    WHERE a.id = p_server_id;
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid source table');
  END IF;
  
  IF v_server_data IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Server not found');
  END IF;
  
  RETURN json_build_object('success', true, 'server', v_server_data);
END;
$$;

-- Create secure RPC function to update server (admin only)
CREATE OR REPLACE FUNCTION public.admin_update_server(
  p_admin_id uuid,
  p_server_id uuid,
  p_source_table text,
  p_server_data json
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_level integer;
BEGIN
  -- Check if user has admin level 2+ (manager or higher)
  SELECT public.get_admin_level(role) INTO v_admin_level
  FROM public.user_roles
  WHERE user_id = p_admin_id;
  
  IF v_admin_level IS NULL OR v_admin_level < 2 THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Manager or higher access required');
  END IF;
  
  IF p_source_table = 'sms_servers' THEN
    UPDATE public.sms_servers SET
      server_name = COALESCE((p_server_data->>'server_name'), server_name),
      country_name = COALESCE((p_server_data->>'country_name'), country_name),
      country_code = COALESCE((p_server_data->>'country_code'), country_code),
      country_dial_code = COALESCE((p_server_data->>'country_dial_code'), country_dial_code),
      country_flag = (p_server_data->>'country_flag'),
      is_active = COALESCE((p_server_data->>'is_active')::boolean, is_active),
      api_get_number_url = COALESCE((p_server_data->>'api_get_number_url'), api_get_number_url),
      api_get_message_url = (p_server_data->>'api_get_message_url'),
      api_cancel_number_url = (p_server_data->>'api_cancel_number_url'),
      api_activate_next_message_url = (p_server_data->>'api_activate_next_message_url'),
      api_response_type = COALESCE((p_server_data->>'api_response_type'), api_response_type),
      uses_headers = COALESCE((p_server_data->>'uses_headers')::boolean, uses_headers),
      header_key_name = (p_server_data->>'header_key_name'),
      header_value = (p_server_data->>'header_value'),
      number_id_path = (p_server_data->>'number_id_path'),
      phone_number_path = (p_server_data->>'phone_number_path'),
      otp_path_in_json = (p_server_data->>'otp_path_in_json'),
      auto_cancel_minutes = COALESCE((p_server_data->>'auto_cancel_minutes')::integer, auto_cancel_minutes),
      api_retry_count = COALESCE((p_server_data->>'api_retry_count')::integer, api_retry_count),
      updated_at = now()
    WHERE id = p_server_id;
  ELSIF p_source_table = 'auto_sms_servers' THEN
    UPDATE public.auto_sms_servers SET
      server_name = COALESCE((p_server_data->>'server_name'), server_name),
      country_name = COALESCE((p_server_data->>'country_name'), country_name),
      country_code = COALESCE((p_server_data->>'country_code'), country_code),
      country_dial_code = COALESCE((p_server_data->>'country_dial_code'), country_dial_code),
      country_flag = (p_server_data->>'country_flag'),
      is_active = COALESCE((p_server_data->>'is_active')::boolean, is_active),
      api_get_number_url = COALESCE((p_server_data->>'api_get_number_url'), api_get_number_url),
      api_get_message_url = (p_server_data->>'api_get_message_url'),
      api_cancel_number_url = (p_server_data->>'api_cancel_number_url'),
      api_activate_next_message_url = (p_server_data->>'api_activate_next_message_url'),
      api_response_type = COALESCE((p_server_data->>'api_response_type'), api_response_type),
      uses_headers = COALESCE((p_server_data->>'uses_headers')::boolean, uses_headers),
      header_key_name = (p_server_data->>'header_key_name'),
      header_value = (p_server_data->>'header_value'),
      number_id_path = (p_server_data->>'number_id_path'),
      phone_number_path = (p_server_data->>'phone_number_path'),
      otp_path_in_json = (p_server_data->>'otp_path_in_json'),
      auto_cancel_minutes = COALESCE((p_server_data->>'auto_cancel_minutes')::integer, auto_cancel_minutes),
      api_retry_count = COALESCE((p_server_data->>'api_retry_count')::integer, api_retry_count),
      api_key = COALESCE((p_server_data->>'api_key'), api_key),
      provider = COALESCE((p_server_data->>'provider'), provider),
      updated_at = now()
    WHERE id = p_server_id;
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid source table');
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Server updated successfully');
END;
$$;

-- Create secure RPC function to delete server (admin only)
CREATE OR REPLACE FUNCTION public.admin_delete_server(p_admin_id uuid, p_server_id uuid, p_source_table text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_level integer;
BEGIN
  -- Check if user has admin level 2+ (manager or higher)
  SELECT public.get_admin_level(role) INTO v_admin_level
  FROM public.user_roles
  WHERE user_id = p_admin_id;
  
  IF v_admin_level IS NULL OR v_admin_level < 2 THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Manager or higher access required');
  END IF;
  
  IF p_source_table = 'sms_servers' THEN
    DELETE FROM public.sms_servers WHERE id = p_server_id;
  ELSIF p_source_table = 'auto_sms_servers' THEN
    DELETE FROM public.auto_sms_servers WHERE id = p_server_id;
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid source table');
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Server deleted successfully');
END;
$$;

-- Create secure RPC function to list servers for selection (admin only, no sensitive data)
CREATE OR REPLACE FUNCTION public.admin_list_servers(p_admin_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_level integer;
  v_servers json;
BEGIN
  -- Check if user has admin level 2+ (manager or higher)
  SELECT public.get_admin_level(role) INTO v_admin_level
  FROM public.user_roles
  WHERE user_id = p_admin_id;
  
  IF v_admin_level IS NULL OR v_admin_level < 2 THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Manager or higher access required');
  END IF;
  
  SELECT json_agg(servers ORDER BY created_at DESC) INTO v_servers
  FROM (
    SELECT id, server_name, country_name, country_flag, is_active, created_at, 'sms_servers' as source_table
    FROM public.sms_servers
    UNION ALL
    SELECT id, server_name, country_name, country_flag, is_active, created_at, 'auto_sms_servers' as source_table
    FROM public.auto_sms_servers
  ) servers;
  
  RETURN json_build_object('success', true, 'servers', COALESCE(v_servers, '[]'::json));
END;
$$;