-- Fix RLS policies for auto_sms_servers to allow inserts via service role
-- The app uses custom auth (not Supabase Auth), so auth.uid() returns NULL
-- We need to allow inserts when created_by is provided (validated in app logic)

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Admins can insert auto servers" ON public.auto_sms_servers;

-- Create a new INSERT policy that allows inserts when created_by is a valid user
CREATE POLICY "Allow insert with valid created_by" 
ON public.auto_sms_servers 
FOR INSERT 
WITH CHECK (
  created_by IS NOT NULL 
  AND EXISTS (SELECT 1 FROM public.users WHERE id = created_by)
);

-- Also fix auto_services table INSERT policy
DROP POLICY IF EXISTS "Admins can insert auto services" ON public.auto_services;

CREATE POLICY "Allow insert with valid created_by" 
ON public.auto_services 
FOR INSERT 
WITH CHECK (
  created_by IS NOT NULL 
  AND EXISTS (SELECT 1 FROM public.users WHERE id = created_by)
);