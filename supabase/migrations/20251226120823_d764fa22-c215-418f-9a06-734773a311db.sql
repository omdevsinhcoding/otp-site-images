-- Create table to track number activations/purchases
CREATE TABLE public.number_activations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  server_id UUID NOT NULL REFERENCES public.sms_servers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  activation_id TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  messages JSONB DEFAULT '[]'::jsonb,
  has_otp_received BOOLEAN NOT NULL DEFAULT false,
  refunded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('active', 'cancelled', 'completed', 'expired'))
);

-- Enable RLS
ALTER TABLE public.number_activations ENABLE ROW LEVEL SECURITY;

-- Users can view their own activations
CREATE POLICY "Users can view own activations"
ON public.number_activations
FOR SELECT
USING (true);

-- System can insert activations
CREATE POLICY "System can insert activations"
ON public.number_activations
FOR INSERT
WITH CHECK (true);

-- System can update activations
CREATE POLICY "System can update activations"
ON public.number_activations
FOR UPDATE
USING (true);

-- Create index for faster queries
CREATE INDEX idx_number_activations_user_id ON public.number_activations(user_id);
CREATE INDEX idx_number_activations_status ON public.number_activations(status);
CREATE INDEX idx_number_activations_activation_id ON public.number_activations(activation_id);

-- Create trigger for updated_at
CREATE TRIGGER update_number_activations_updated_at
BEFORE UPDATE ON public.number_activations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get number and create activation
CREATE OR REPLACE FUNCTION public.create_number_activation(
  p_user_id UUID,
  p_server_id UUID,
  p_service_id UUID,
  p_activation_id TEXT,
  p_phone_number TEXT,
  p_price NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_balance NUMERIC;
  v_new_balance NUMERIC;
  v_activation_record number_activations%ROWTYPE;
BEGIN
  -- Get current balance
  SELECT balance INTO v_balance
  FROM public.user_wallets
  WHERE user_id = p_user_id;
  
  IF v_balance IS NULL OR v_balance < p_price THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  -- Deduct balance
  UPDATE public.user_wallets
  SET balance = balance - p_price, updated_at = now()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  -- Create activation record
  INSERT INTO public.number_activations (
    user_id, server_id, service_id, activation_id, phone_number, price
  ) VALUES (
    p_user_id, p_server_id, p_service_id, p_activation_id, p_phone_number, p_price
  )
  RETURNING * INTO v_activation_record;
  
  -- Create transaction record
  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'number_purchase', p_price, 'Number purchase: ' || p_phone_number);
  
  RETURN json_build_object(
    'success', true,
    'activation', json_build_object(
      'id', v_activation_record.id,
      'activation_id', v_activation_record.activation_id,
      'phone_number', v_activation_record.phone_number,
      'price', v_activation_record.price,
      'status', v_activation_record.status
    ),
    'new_balance', v_new_balance
  );
END;
$$;

-- Function to cancel number and refund if no OTP received
CREATE OR REPLACE FUNCTION public.cancel_number_activation(
  p_user_id UUID,
  p_activation_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_activation number_activations%ROWTYPE;
  v_new_balance NUMERIC;
BEGIN
  -- Get activation
  SELECT * INTO v_activation
  FROM public.number_activations
  WHERE activation_id = p_activation_id AND user_id = p_user_id;
  
  IF v_activation.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Activation not found');
  END IF;
  
  IF v_activation.status != 'active' THEN
    RETURN json_build_object('success', false, 'error', 'Activation is not active');
  END IF;
  
  -- Update activation status
  UPDATE public.number_activations
  SET status = 'cancelled', cancelled_at = now(), updated_at = now()
  WHERE id = v_activation.id;
  
  -- Refund if no OTP received
  IF NOT v_activation.has_otp_received THEN
    UPDATE public.user_wallets
    SET balance = balance + v_activation.price, updated_at = now()
    WHERE user_id = p_user_id
    RETURNING balance INTO v_new_balance;
    
    UPDATE public.number_activations
    SET refunded = true
    WHERE id = v_activation.id;
    
    -- Create refund transaction
    INSERT INTO public.transactions (user_id, type, amount, description)
    VALUES (p_user_id, 'refund', v_activation.price, 'Refund for cancelled number: ' || v_activation.phone_number);
    
    RETURN json_build_object(
      'success', true,
      'refunded', true,
      'amount', v_activation.price,
      'new_balance', v_new_balance
    );
  END IF;
  
  RETURN json_build_object('success', true, 'refunded', false);
END;
$$;

-- Function to update activation with OTP message
CREATE OR REPLACE FUNCTION public.update_activation_message(
  p_activation_id TEXT,
  p_message TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_activation number_activations%ROWTYPE;
  v_messages JSONB;
BEGIN
  SELECT * INTO v_activation
  FROM public.number_activations
  WHERE activation_id = p_activation_id;
  
  IF v_activation.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Activation not found');
  END IF;
  
  -- Append message to array
  v_messages := v_activation.messages || jsonb_build_array(jsonb_build_object(
    'text', p_message,
    'received_at', now()
  ));
  
  -- Update activation
  UPDATE public.number_activations
  SET 
    messages = v_messages,
    has_otp_received = true,
    updated_at = now()
  WHERE id = v_activation.id;
  
  RETURN json_build_object('success', true, 'messages', v_messages);
END;
$$;

-- Function to get user's active numbers
CREATE OR REPLACE FUNCTION public.get_user_active_numbers(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'id', na.id,
          'activation_id', na.activation_id,
          'phone_number', na.phone_number,
          'price', na.price,
          'status', na.status,
          'messages', na.messages,
          'has_otp_received', na.has_otp_received,
          'created_at', na.created_at,
          'server_name', ss.server_name,
          'country_dial_code', ss.country_dial_code,
          'service_name', s.service_name,
          'service_logo', s.logo_url
        )
        ORDER BY na.created_at DESC
      ),
      '[]'::json
    )
    FROM public.number_activations na
    JOIN public.sms_servers ss ON na.server_id = ss.id
    JOIN public.services s ON na.service_id = s.id
    WHERE na.user_id = p_user_id AND na.status = 'active'
  );
END;
$$;