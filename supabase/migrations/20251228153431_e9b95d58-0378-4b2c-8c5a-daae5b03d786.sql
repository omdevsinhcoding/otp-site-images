-- Grant SELECT on all public views to anon and authenticated roles
GRANT SELECT ON public.public_services TO anon, authenticated;
GRANT SELECT ON public.public_sms_servers TO anon, authenticated;
GRANT SELECT ON public.public_auto_services TO anon, authenticated;
GRANT SELECT ON public.public_auto_sms_servers TO anon, authenticated;

-- Also grant EXECUTE on the RPC functions used
GRANT EXECUTE ON FUNCTION public.get_user_number_history(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_server_details(uuid[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_service_details(uuid[]) TO anon, authenticated;