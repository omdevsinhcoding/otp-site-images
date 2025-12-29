-- Update get_user_transactions to include promo code creator UID for promo_bonus transactions
CREATE OR REPLACE FUNCTION public.get_user_transactions(p_user_id uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0, p_type text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- Get transactions with admin UID and promo creator UID
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
        'admin_uid', u.uid,
        'promo_creator_uid', CASE 
          WHEN t.type = 'promo_bonus' THEN (
            SELECT creator.uid 
            FROM public.promo_codes pc
            JOIN public.users creator ON pc.created_by = creator.id
            WHERE pc.code = REPLACE(t.description, 'Promo code: ', '')
            LIMIT 1
          )
          ELSE NULL
        END
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
        'admin_uid', u.uid,
        'promo_creator_uid', CASE 
          WHEN t.type = 'promo_bonus' THEN (
            SELECT creator.uid 
            FROM public.promo_codes pc
            JOIN public.users creator ON pc.created_by = creator.id
            WHERE pc.code = REPLACE(t.description, 'Promo code: ', '')
            LIMIT 1
          )
          ELSE NULL
        END
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
$function$;