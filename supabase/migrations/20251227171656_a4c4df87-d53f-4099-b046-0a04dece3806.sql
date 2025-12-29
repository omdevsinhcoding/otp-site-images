-- Create auto_sms_servers table for auto-imported servers
CREATE TABLE public.auto_sms_servers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  server_name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  country_dial_code TEXT NOT NULL,
  country_flag TEXT,
  api_key TEXT NOT NULL,
  api_response_type TEXT NOT NULL DEFAULT 'json',
  uses_headers BOOLEAN NOT NULL DEFAULT false,
  header_key_name TEXT,
  header_value TEXT,
  api_get_number_url TEXT NOT NULL,
  api_get_message_url TEXT,
  api_activate_next_message_url TEXT,
  api_cancel_number_url TEXT,
  number_id_path TEXT,
  phone_number_path TEXT,
  otp_path_in_json TEXT,
  auto_cancel_minutes INTEGER NOT NULL DEFAULT 20,
  api_retry_count INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  provider TEXT NOT NULL DEFAULT '5sim',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create auto_services table for auto-imported services
CREATE TABLE public.auto_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID NOT NULL REFERENCES public.auto_sms_servers(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  service_code TEXT NOT NULL,
  operator TEXT NOT NULL,
  operator_url TEXT NOT NULL,
  logo_url TEXT,
  base_price NUMERIC NOT NULL DEFAULT 0,
  margin_percentage NUMERIC NOT NULL DEFAULT 0,
  final_price NUMERIC,
  cancel_disable_time INTEGER NOT NULL DEFAULT 0,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auto_sms_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_services ENABLE ROW LEVEL SECURITY;

-- Create policies for auto_sms_servers
CREATE POLICY "Anyone can view auto servers" ON public.auto_sms_servers FOR SELECT USING (true);
CREATE POLICY "System can insert auto servers" ON public.auto_sms_servers FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update auto servers" ON public.auto_sms_servers FOR UPDATE USING (true);
CREATE POLICY "System can delete auto servers" ON public.auto_sms_servers FOR DELETE USING (true);

-- Create policies for auto_services
CREATE POLICY "Anyone can view auto services" ON public.auto_services FOR SELECT USING (true);
CREATE POLICY "System can insert auto services" ON public.auto_services FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update auto services" ON public.auto_services FOR UPDATE USING (true);
CREATE POLICY "System can delete auto services" ON public.auto_services FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX idx_auto_services_server_id ON public.auto_services(server_id);
CREATE INDEX idx_auto_services_service_code ON public.auto_services(service_code);
CREATE INDEX idx_auto_sms_servers_provider ON public.auto_sms_servers(provider);