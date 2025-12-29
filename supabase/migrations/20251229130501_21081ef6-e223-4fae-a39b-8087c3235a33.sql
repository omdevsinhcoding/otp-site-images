-- Create paytm_orders table to track payment orders
CREATE TABLE public.paytm_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id),
  order_id text NOT NULL UNIQUE,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  txn_token text,
  paytm_txn_id text,
  bank_txn_id text,
  gateway_name text,
  payment_mode text,
  resp_code text,
  resp_msg text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '10 minutes')
);

-- Enable RLS
ALTER TABLE public.paytm_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "System functions only - insert paytm orders"
ON public.paytm_orders FOR INSERT
WITH CHECK (false);

CREATE POLICY "System functions only - update paytm orders"
ON public.paytm_orders FOR UPDATE
USING (false);

CREATE POLICY "System functions only - view paytm orders"
ON public.paytm_orders FOR SELECT
USING (false);

-- Create index for faster lookups
CREATE INDEX idx_paytm_orders_user_id ON public.paytm_orders(user_id);
CREATE INDEX idx_paytm_orders_order_id ON public.paytm_orders(order_id);
CREATE INDEX idx_paytm_orders_status ON public.paytm_orders(status);

-- Function to create a paytm order
CREATE OR REPLACE FUNCTION public.create_paytm_order(
  p_user_id uuid,
  p_order_id text,
  p_amount numeric,
  p_expires_minutes integer DEFAULT 10
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_record paytm_orders%ROWTYPE;
BEGIN
  -- Insert new order
  INSERT INTO paytm_orders (user_id, order_id, amount, expires_at)
  VALUES (p_user_id, p_order_id, p_amount, now() + (p_expires_minutes || ' minutes')::interval)
  RETURNING * INTO v_order_record;
  
  RETURN json_build_object(
    'success', true,
    'order', row_to_json(v_order_record)
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'error', 'Order ID already exists');
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to update paytm order status
CREATE OR REPLACE FUNCTION public.update_paytm_order(
  p_order_id text,
  p_status text,
  p_paytm_txn_id text DEFAULT NULL,
  p_bank_txn_id text DEFAULT NULL,
  p_gateway_name text DEFAULT NULL,
  p_payment_mode text DEFAULT NULL,
  p_resp_code text DEFAULT NULL,
  p_resp_msg text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_record paytm_orders%ROWTYPE;
BEGIN
  UPDATE paytm_orders
  SET 
    status = p_status,
    paytm_txn_id = COALESCE(p_paytm_txn_id, paytm_txn_id),
    bank_txn_id = COALESCE(p_bank_txn_id, bank_txn_id),
    gateway_name = COALESCE(p_gateway_name, gateway_name),
    payment_mode = COALESCE(p_payment_mode, payment_mode),
    resp_code = COALESCE(p_resp_code, resp_code),
    resp_msg = COALESCE(p_resp_msg, resp_msg),
    completed_at = CASE WHEN p_status IN ('success', 'failed') THEN now() ELSE completed_at END
  WHERE order_id = p_order_id
  RETURNING * INTO v_order_record;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Order not found');
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'order', row_to_json(v_order_record)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to get pending paytm order for user
CREATE OR REPLACE FUNCTION public.get_pending_paytm_order(
  p_user_id uuid,
  p_order_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_record paytm_orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order_record
  FROM paytm_orders
  WHERE user_id = p_user_id 
    AND order_id = p_order_id
    AND status = 'pending'
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Order not found or expired');
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'order', row_to_json(v_order_record)
  );
END;
$$;