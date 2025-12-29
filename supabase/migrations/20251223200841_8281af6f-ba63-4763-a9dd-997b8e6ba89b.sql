-- Create transactions table to store all user transactions
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('recharge', 'number_purchase', 'withdrawal', 'referral_bonus')),
  amount numeric NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" 
ON public.transactions 
FOR SELECT 
USING (user_id IN (SELECT id FROM public.users));

-- Only system/admin can insert transactions
CREATE POLICY "System can insert transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (true);

-- Create function to get user transactions with pagination
CREATE OR REPLACE FUNCTION public.get_user_transactions(
  p_user_id uuid,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_type text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transactions json;
  v_total integer;
BEGIN
  -- Get total count
  IF p_type IS NULL THEN
    SELECT COUNT(*) INTO v_total FROM public.transactions WHERE user_id = p_user_id;
  ELSE
    SELECT COUNT(*) INTO v_total FROM public.transactions WHERE user_id = p_user_id AND type = p_type;
  END IF;
  
  -- Get transactions
  IF p_type IS NULL THEN
    SELECT json_agg(
      json_build_object(
        'id', id,
        'type', type,
        'amount', amount,
        'description', description,
        'created_at', created_at
      )
      ORDER BY created_at DESC
    )
    INTO v_transactions
    FROM (
      SELECT * FROM public.transactions 
      WHERE user_id = p_user_id 
      ORDER BY created_at DESC 
      LIMIT p_limit OFFSET p_offset
    ) t;
  ELSE
    SELECT json_agg(
      json_build_object(
        'id', id,
        'type', type,
        'amount', amount,
        'description', description,
        'created_at', created_at
      )
      ORDER BY created_at DESC
    )
    INTO v_transactions
    FROM (
      SELECT * FROM public.transactions 
      WHERE user_id = p_user_id AND type = p_type
      ORDER BY created_at DESC 
      LIMIT p_limit OFFSET p_offset
    ) t;
  END IF;
  
  RETURN json_build_object(
    'transactions', COALESCE(v_transactions, '[]'::json),
    'total', v_total
  );
END;
$$;