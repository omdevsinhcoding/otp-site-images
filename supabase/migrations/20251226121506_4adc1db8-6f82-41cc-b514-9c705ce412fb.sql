-- Drop existing check constraint and add new one with refund type
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Add new check constraint with refund type included
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('recharge', 'number_purchase', 'referral_bonus', 'promo_bonus', 'refund', 'admin_credit', 'admin_debit'));