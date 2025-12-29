-- Create table for user favorite services
CREATE TABLE public.user_favorite_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, service_name)
);

-- Enable RLS
ALTER TABLE public.user_favorite_services ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites"
ON public.user_favorite_services
FOR SELECT
USING (true);

-- Users can insert their own favorites
CREATE POLICY "Users can insert own favorites"
ON public.user_favorite_services
FOR INSERT
WITH CHECK (true);

-- Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
ON public.user_favorite_services
FOR DELETE
USING (true);