-- Update get_user_transactions to include UTR for recharge transactions
CREATE OR REPLACE FUNCTION public.get_user_transactions(
  p_user_id uuid,
  p_limit integer DEFAULT 10,
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
  SELECT COUNT(*) INTO v_total
  FROM transactions t
  WHERE t.user_id = p_user_id
    AND (p_type IS NULL OR t.type = p_type);
  
  -- Get transactions with UTR for recharges
  SELECT json_agg(tx_data ORDER BY created_at DESC)
  INTO v_transactions
  FROM (
    SELECT 
      t.id,
      t.type,
      t.amount,
      t.description,
      t.created_at,
      t.admin_id,
      admin_user.uid as admin_uid,
      promo.created_by as promo_creator_id,
      promo_creator.uid as promo_creator_uid,
      -- Get UTR from upi_recharges for recharge transactions
      CASE 
        WHEN t.type = 'recharge' THEN (
          SELECT ur.txn_id 
          FROM upi_recharges ur 
          WHERE ur.user_id = t.user_id 
            AND ur.amount = t.amount 
            AND ur.created_at <= t.created_at + interval '5 seconds'
            AND ur.created_at >= t.created_at - interval '5 seconds'
          ORDER BY ur.created_at DESC
          LIMIT 1
        )
        ELSE NULL
      END as utr_number
    FROM transactions t
    LEFT JOIN users admin_user ON t.admin_id = admin_user.id
    LEFT JOIN promo_redemptions pr ON t.user_id = pr.user_id 
      AND t.type = 'promo_bonus' 
      AND t.created_at = pr.redeemed_at
    LEFT JOIN promo_codes promo ON pr.promo_code_id = promo.id
    LEFT JOIN users promo_creator ON promo.created_by = promo_creator.id
    WHERE t.user_id = p_user_id
      AND (p_type IS NULL OR t.type = p_type)
    ORDER BY t.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ) tx_data;
  
  RETURN json_build_object(
    'success', true,
    'transactions', COALESCE(v_transactions, '[]'::json),
    'total', v_total
  );
END;
$$;