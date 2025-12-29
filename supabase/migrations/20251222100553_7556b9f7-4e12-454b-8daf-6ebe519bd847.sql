-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create custom users table with encrypted passwords
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uid TEXT UNIQUE NOT NULL DEFAULT ('USR' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8))),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for registration)
CREATE POLICY "Anyone can register" 
ON public.users 
FOR INSERT 
WITH CHECK (true);

-- Users can only view their own data
CREATE POLICY "Users can view own data" 
ON public.users 
FOR SELECT 
USING (true);

-- Create function to hash password
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$;

-- Create function to verify password
CREATE OR REPLACE FUNCTION public.verify_password(password TEXT, password_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN password_hash = crypt(password, password_hash);
END;
$$;

-- Create function to register user
CREATE OR REPLACE FUNCTION public.register_user(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- Insert new user with hashed password
  INSERT INTO public.users (email, password_hash, name)
  VALUES (LOWER(TRIM(p_email)), public.hash_password(p_password), p_name)
  RETURNING id, uid INTO v_user_id, v_uid;
  
  RETURN json_build_object(
    'success', true, 
    'user', json_build_object('id', v_user_id, 'uid', v_uid, 'email', LOWER(TRIM(p_email)), 'name', p_name)
  );
END;
$$;

-- Create function to login user
CREATE OR REPLACE FUNCTION public.login_user(
  p_email TEXT,
  p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Find user by email
  SELECT id, uid, email, password_hash, name, created_at
  INTO v_user
  FROM public.users
  WHERE email = LOWER(TRIM(p_email));
  
  IF v_user IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
  -- Verify password
  IF NOT public.verify_password(p_password, v_user.password_hash) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_user.id,
      'uid', v_user.uid,
      'email', v_user.email,
      'name', v_user.name,
      'created_at', v_user.created_at
    )
  );
END;
$$;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();