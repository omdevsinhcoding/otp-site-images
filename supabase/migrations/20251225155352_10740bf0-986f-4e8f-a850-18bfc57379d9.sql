-- Drop the old constraint
ALTER TABLE public.transactions DROP CONSTRAINT transactions_type_check;

-- Add the new constraint with promo_bonus included
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
CHECK (type = ANY (ARRAY['recharge'::text, 'number_purchase'::text, 'withdrawal'::text, 'referral_bonus'::text, 'promo_bonus'::text]));