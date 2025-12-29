-- Create secure RPC function to get user's number activations
CREATE OR REPLACE FUNCTION public.get_user_number_history(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activations json;
BEGIN
  SELECT json_agg(row_to_json(t))
  INTO v_activations
  FROM (
    SELECT 
      id,
      activation_id,
      phone_number,
      price,
      status,
      messages,
      has_otp_received,
      created_at,
      server_id,
      service_id
    FROM number_activations
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
  ) t;
  
  RETURN COALESCE(v_activations, '[]'::json);
END;
$$;