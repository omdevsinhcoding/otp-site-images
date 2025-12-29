-- Create a secure view for public service data that hides sensitive business info
CREATE OR REPLACE VIEW public.public_services AS
SELECT 
  id,
  server_id,
  service_name,
  service_code,
  logo_url,
  final_price,
  is_active,
  is_popular,
  cancel_disable_time,
  created_at,
  updated_at
FROM public.services;

-- Grant access to the view
GRANT SELECT ON public.public_services TO anon;
GRANT SELECT ON public.public_services TO authenticated;

-- Update RLS on services table to only allow admins to see full data
DROP POLICY IF EXISTS "Anyone can view services" ON public.services;

-- Only admins can view the full services table with margins
CREATE POLICY "Only admins can view full services"
ON public.services
FOR SELECT
USING (public.has_admin_level(auth.uid(), 1));