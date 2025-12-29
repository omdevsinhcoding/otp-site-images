-- Create function to generate professional UID format: 6 alphanumeric + hyphen + 4 numbers (e.g., A7B3K2-1847)
CREATE OR REPLACE FUNCTION public.generate_professional_uid()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  -- Generate 6 random alphanumeric characters (excluding confusing chars like 0, O, 1, I)
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  
  -- Add hyphen
  result := result || '-';
  
  -- Add 4 random numbers (1000-9999 to ensure 4 digits)
  result := result || LPAD(floor(random() * 9000 + 1000)::text, 4, '0');
  
  RETURN result;
END;
$function$;

-- Update the default for uid column in users table
ALTER TABLE public.users 
ALTER COLUMN uid SET DEFAULT public.generate_professional_uid();

-- Update existing users to have the new UID format
UPDATE public.users 
SET uid = public.generate_professional_uid()
WHERE uid LIKE 'USR%';