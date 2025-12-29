-- Update the get_user_active_numbers function to include server_id and service_id
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
          'server_name', ss.server_name,
          'country_dial_code', ss.country_dial_code,
          'service_name', s.service_name,
          'service_logo', s.logo_url,
          'server_id', na.server_id,
          'service_id', na.service_id
        )
        ORDER BY na.created_at DESC
      ),
      '[]'::json
    )
    FROM public.number_activations na
    JOIN public.sms_servers ss ON na.server_id = ss.id
    JOIN public.services s ON na.service_id = s.id
    WHERE na.user_id = p_user_id AND na.status = 'active'
  );
END;
$function$;