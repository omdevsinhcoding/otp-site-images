-- Remove the operator_url column from auto_services as it's not needed
-- The api_get_number_url is already in auto_sms_servers table
ALTER TABLE public.auto_services DROP COLUMN IF EXISTS operator_url;