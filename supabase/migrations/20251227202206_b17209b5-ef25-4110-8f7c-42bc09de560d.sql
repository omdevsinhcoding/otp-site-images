-- Fix get_user_active_numbers to support both sms_servers and auto_sms_servers
CREATE OR REPLACE FUNCTION public.get_user_active_numbers(p_user_id uuid)
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
          'id', na.id,
          'activation_id', na.activation_id,
          'phone_number', na.phone_number,
          'price', na.price,
          'status', na.status,
          'messages', na.messages,
          'has_otp_received', na.has_otp_received,
          'created_at', na.created_at,
          'server_name', COALESCE(ss.server_name, ass.server_name),
          'country_dial_code', COALESCE(ss.country_dial_code, ass.country_dial_code),
          'service_name', COALESCE(s.service_name, asvc.service_name),
          'service_logo', COALESCE(s.logo_url, asvc.logo_url),
          'server_id', na.server_id,
          'service_id', na.service_id,
          'cancel_disable_time', COALESCE(s.cancel_disable_time, asvc.cancel_disable_time, 0)
        )
        ORDER BY na.created_at DESC
      ),
      '[]'::json
    )
    FROM public.number_activations na
    LEFT JOIN public.sms_servers ss ON na.server_id = ss.id
    LEFT JOIN public.auto_sms_servers ass ON na.server_id = ass.id
    LEFT JOIN public.services s ON na.service_id = s.id
    LEFT JOIN public.auto_services asvc ON na.service_id = asvc.id
    WHERE na.user_id = p_user_id AND na.status = 'active'
  );
END;
$function$;