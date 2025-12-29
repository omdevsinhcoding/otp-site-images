-- Drop and recreate hash_password function using SHA256
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT encode(sha256(password::bytea), 'hex');
$$;

-- Update verify_password function for SHA256
CREATE OR REPLACE FUNCTION public.verify_password(password text, password_hash text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT encode(sha256(password::bytea), 'hex') = password_hash;
$$;