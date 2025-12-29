-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID NOT NULL REFERENCES public.sms_servers(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  service_code TEXT NOT NULL,
  logo_url TEXT,
  base_price NUMERIC NOT NULL DEFAULT 0,
  margin_percentage NUMERIC NOT NULL DEFAULT 0,
  final_price NUMERIC GENERATED ALWAYS AS (base_price + (base_price * margin_percentage / 100)) STORED,
  cancel_disable_time INTEGER NOT NULL DEFAULT 0,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(server_id, service_code)
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view services" 
ON public.services 
FOR SELECT 
USING (true);

CREATE POLICY "System can insert services" 
ON public.services 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update services" 
ON public.services 
FOR UPDATE 
USING (true);

CREATE POLICY "System can delete services" 
ON public.services 
FOR DELETE 
USING (true);

-- Create function to add service
CREATE OR REPLACE FUNCTION public.admin_add_service(
  p_admin_id UUID,
  p_server_id UUID,
  p_service_name TEXT,
  p_service_code TEXT,
  p_logo_url TEXT DEFAULT NULL,
  p_base_price NUMERIC DEFAULT 0,
  p_margin_percentage NUMERIC DEFAULT 0,
  p_cancel_disable_time INTEGER DEFAULT 0,
  p_is_popular BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service RECORD;
BEGIN
  -- Check if admin has permission (level 2+)
  IF NOT has_admin_level(p_admin_id, 2) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Insufficient permissions');
  END IF;

  -- Check if server exists
  IF NOT EXISTS (SELECT 1 FROM sms_servers WHERE id = p_server_id) THEN
    RETURN json_build_object('success', false, 'error', 'Server not found');
  END IF;

  -- Check if service code already exists for this server
  IF EXISTS (SELECT 1 FROM services WHERE server_id = p_server_id AND service_code = p_service_code) THEN
    RETURN json_build_object('success', false, 'error', 'Service code already exists for this server');
  END IF;

  -- Insert the service
  INSERT INTO services (
    server_id,
    service_name,
    service_code,
    logo_url,
    base_price,
    margin_percentage,
    cancel_disable_time,
    is_popular,
    created_by
  ) VALUES (
    p_server_id,
    p_service_name,
    p_service_code,
    p_logo_url,
    p_base_price,
    p_margin_percentage,
    p_cancel_disable_time,
    p_is_popular,
    p_admin_id
  )
  RETURNING * INTO v_service;

  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'id', v_service.id,
      'service_name', v_service.service_name,
      'service_code', v_service.service_code,
      'final_price', v_service.final_price
    )
  );
END;
$$;

-- Create function to get all servers for dropdown
CREATE OR REPLACE FUNCTION public.get_all_sms_servers()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'id', s.id,
        'server_name', s.server_name,
        'country_name', s.country_name,
        'country_flag', s.country_flag,
        'is_active', s.is_active
      )
    )
    FROM sms_servers s
    ORDER BY s.created_at DESC
  );
END;
$$;