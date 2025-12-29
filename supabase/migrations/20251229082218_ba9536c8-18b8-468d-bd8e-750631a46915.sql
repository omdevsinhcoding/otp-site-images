-- Create app_settings table for general application settings
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT 'true'::jsonb,
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.users(id)
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can view app settings" 
ON public.app_settings 
FOR SELECT 
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update app settings" 
ON public.app_settings 
FOR UPDATE 
USING (has_admin_level(auth.uid(), 2));

-- Only admins can insert settings
CREATE POLICY "Admins can insert app settings" 
ON public.app_settings 
FOR INSERT 
WITH CHECK (has_admin_level(auth.uid(), 2));

-- Insert default setting for operator visibility
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES ('show_operator_in_get_number', 'true', 'Show operator name in Get Number page server list');

-- Create function to get app setting
CREATE OR REPLACE FUNCTION public.get_app_setting(p_setting_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_value jsonb;
BEGIN
  SELECT setting_value INTO v_value
  FROM app_settings
  WHERE setting_key = p_setting_key;
  
  RETURN COALESCE(v_value, 'null'::jsonb);
END;
$$;

-- Create function to update app setting (admin only)
CREATE OR REPLACE FUNCTION public.update_app_setting(p_user_id uuid, p_setting_key text, p_setting_value jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT has_admin_level(p_user_id, 2) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Upsert the setting
  INSERT INTO app_settings (setting_key, setting_value, updated_at, updated_by)
  VALUES (p_setting_key, p_setting_value, now(), p_user_id)
  ON CONFLICT (setting_key)
  DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = now(),
    updated_by = EXCLUDED.updated_by;

  RETURN json_build_object('success', true);
END;
$$;