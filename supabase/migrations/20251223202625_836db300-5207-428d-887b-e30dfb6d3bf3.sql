-- Update the register_user function to use the new UID generator
CREATE OR REPLACE FUNCTION public.register_user(p_email text, p_password text, p_name text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_uid TEXT;
  v_existing_user UUID;
BEGIN
  -- Check if email already exists
  SELECT id INTO v_existing_user FROM public.users WHERE email = LOWER(TRIM(p_email));
  
  IF v_existing_user IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Email already registered');
  END IF;
  
  -- Generate professional UID
  v_uid := public.generate_professional_uid();
  
  -- Insert new user with hashed password and generated UID
  INSERT INTO public.users (email, password_hash, name, uid)
  VALUES (LOWER(TRIM(p_email)), public.hash_password(p_password), p_name, v_uid)
  RETURNING id INTO v_user_id;
  
  RETURN json_build_object(
    'success', true, 
    'user', json_build_object('id', v_user_id, 'uid', v_uid, 'email', LOWER(TRIM(p_email)), 'name', p_name)
  );
END;
$function$;