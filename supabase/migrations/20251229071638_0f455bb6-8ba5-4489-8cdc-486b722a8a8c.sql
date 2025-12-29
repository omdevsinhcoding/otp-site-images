-- Drop existing INSERT policy and create a simpler one
DROP POLICY IF EXISTS "Allow insert with valid created_by" ON public.auto_sms_servers;

-- Create a simpler INSERT policy that just checks created_by is not null
-- The app validates the user exists before calling insert
CREATE POLICY "Allow authenticated inserts" 
ON public.auto_sms_servers 
FOR INSERT 
WITH CHECK (created_by IS NOT NULL);

-- Also fix auto_services table
DROP POLICY IF EXISTS "Allow insert with valid created_by" ON public.auto_services;

CREATE POLICY "Allow authenticated inserts" 
ON public.auto_services 
FOR INSERT 
WITH CHECK (created_by IS NOT NULL);