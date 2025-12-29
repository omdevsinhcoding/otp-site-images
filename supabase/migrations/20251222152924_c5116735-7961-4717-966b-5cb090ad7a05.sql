-- Add uid and email columns to user_roles table
ALTER TABLE public.user_roles
ADD COLUMN uid text,
ADD COLUMN email text;

-- Update existing records with uid and email from users table
UPDATE public.user_roles ur
SET 
  uid = u.uid,
  email = u.email
FROM public.users u
WHERE ur.user_id = u.id;

-- Create a trigger function to auto-populate uid and email on insert/update
CREATE OR REPLACE FUNCTION public.sync_user_roles_info()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Get uid and email from users table
  SELECT uid, email INTO NEW.uid, NEW.email
  FROM public.users
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-sync on insert
CREATE TRIGGER sync_user_roles_info_trigger
BEFORE INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_roles_info();

-- Create trigger to auto-sync on update (if user_id changes)
CREATE TRIGGER sync_user_roles_info_update_trigger
BEFORE UPDATE OF user_id ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_roles_info();