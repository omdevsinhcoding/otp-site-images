-- Ensure pgcrypto is available (try in public schema for function access)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recreate hash_password function using proper pgcrypto reference
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$;

-- Recreate verify_password function
CREATE OR REPLACE FUNCTION public.verify_password(password text, password_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN password_hash = crypt(password, password_hash);
END;
$$;