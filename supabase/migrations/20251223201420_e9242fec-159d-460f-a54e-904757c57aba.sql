-- Add admin_id column to track which admin made the transaction
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS admin_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Update admin_update_user_balance to store admin info
CREATE OR REPLACE FUNCTION public.admin_update_user_balance(
  p_admin_id uuid,
  p_user_id uuid,
  p_amount numeric,
  p_operation text,
  p_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_current_balance numeric;
  v_new_balance numeric;
  v_transaction_type text;
  v_description text;
BEGIN
  -- Check if requester is admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_admin_id AND role = 'admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;
  
  -- Get current balance or create wallet if not exists
  INSERT INTO public.user_wallets (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT balance INTO v_current_balance
  FROM public.user_wallets
  WHERE user_id = p_user_id;
  
  -- Calculate new balance and set transaction type
  IF p_operation = 'credit' THEN
    v_new_balance := v_current_balance + ABS(p_amount);
    v_transaction_type := 'recharge';
    v_description := COALESCE(p_notes, 'Admin credit');
  ELSIF p_operation = 'debit' THEN
    v_new_balance := v_current_balance - ABS(p_amount);
    v_transaction_type := 'number_purchase';
    v_description := COALESCE(p_notes, 'Admin debit');
    IF v_new_balance < 0 THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient balance for debit');
    END IF;
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid operation. Use credit or debit');
  END IF;
  
  -- Update balance
  UPDATE public.user_wallets
  SET balance = v_new_balance, updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Create transaction record with admin_id
  INSERT INTO public.transactions (user_id, type, amount, description, admin_id)
  VALUES (p_user_id, v_transaction_type, ABS(p_amount), v_description, p_admin_id);
  
  RETURN json_build_object(
    'success', true,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'operation', p_operation,
    'amount', ABS(p_amount)
  );
END;
$$;

-- Update get_user_transactions to include admin info
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
  
  -- Get transactions with admin UID
  IF p_type IS NULL THEN
    SELECT json_agg(row_data ORDER BY created_at DESC)
    INTO v_transactions
    FROM (
      SELECT json_build_object(
        'id', t.id,
        'type', t.type,
        'amount', t.amount,
        'description', t.description,
        'created_at', t.created_at,
        'admin_uid', u.uid
      ) as row_data, t.created_at
      FROM public.transactions t
      LEFT JOIN public.users u ON t.admin_id = u.id
      WHERE t.user_id = p_user_id 
      ORDER BY t.created_at DESC 
      LIMIT p_limit OFFSET p_offset
    ) sub;
  ELSE
    SELECT json_agg(row_data ORDER BY created_at DESC)
    INTO v_transactions
    FROM (
      SELECT json_build_object(
        'id', t.id,
        'type', t.type,
        'amount', t.amount,
        'description', t.description,
        'created_at', t.created_at,
        'admin_uid', u.uid
      ) as row_data, t.created_at
      FROM public.transactions t
      LEFT JOIN public.users u ON t.admin_id = u.id
      WHERE t.user_id = p_user_id AND t.type = p_type
      ORDER BY t.created_at DESC 
      LIMIT p_limit OFFSET p_offset
    ) sub;
  END IF;
  
  RETURN json_build_object(
    'transactions', COALESCE(v_transactions, '[]'::json),
    'total', v_total
  );
END;
$$;