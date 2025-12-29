-- Update the function to generate shorter hex-style codes
CREATE OR REPLACE FUNCTION public.get_or_create_referral_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- Try to get existing code
  SELECT code INTO v_code FROM public.referral_codes WHERE user_id = p_user_id;
  
  IF v_code IS NULL THEN
    -- Generate a shorter hex-style code (24 characters like MongoDB ObjectId)
    v_code := lower(
      substring(replace(gen_random_uuid()::text, '-', ''), 1, 24)
    );
    
    -- Create new code
    INSERT INTO public.referral_codes (user_id, code)
    VALUES (p_user_id, v_code);
    
    -- Also create earnings record
    INSERT INTO public.referral_earnings (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN v_code;
END;
$$;