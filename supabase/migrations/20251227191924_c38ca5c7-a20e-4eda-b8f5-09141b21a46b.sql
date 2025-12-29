-- Drop the foreign key constraint that only allows sms_servers
ALTER TABLE public.number_activations DROP CONSTRAINT IF EXISTS number_activations_server_id_fkey;

-- Also drop the service_id foreign key since we now support both services and auto_services
ALTER TABLE public.number_activations DROP CONSTRAINT IF EXISTS number_activations_service_id_fkey;