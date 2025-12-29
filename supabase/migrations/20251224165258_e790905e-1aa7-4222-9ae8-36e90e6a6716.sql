-- Update login_user to allow banned users to login but return is_banned flag
CREATE OR REPLACE FUNCTION public.login_user(p_email text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user users%ROWTYPE;
BEGIN
    -- Find user by email
    SELECT * INTO v_user FROM users WHERE email = lower(trim(p_email));
    
    IF v_user.id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invalid credentials');
    END IF;
    
    -- Verify password
    IF NOT verify_password(p_password, v_user.password_hash) THEN
        RETURN json_build_object('success', false, 'error', 'Invalid credentials');
    END IF;
    
    -- Update last active
    UPDATE users SET last_active = now() WHERE id = v_user.id;
    
    -- Return user data with is_banned flag (allow login but indicate banned status)
    RETURN json_build_object(
        'success', true,
        'user', json_build_object(
            'id', v_user.id,
            'uid', v_user.uid,
            'email', v_user.email,
            'name', v_user.name,
            'created_at', v_user.created_at,
            'is_banned', v_user.is_banned
        )
    );
END;
$$;