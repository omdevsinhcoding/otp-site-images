-- CRITICAL: This app uses CUSTOM AUTH (not Supabase Auth), so auth.uid() returns NULL
-- All data access should go through SECURITY DEFINER functions only
-- Block direct table access to sensitive tables

-- 1. Fix users table - remove the UPDATE policy that allows anyone to update
DROP POLICY IF EXISTS "System can update users" ON public.users;
-- Updates should only happen via security definer functions

-- 2. Fix user_wallets - block direct access
DROP POLICY IF EXISTS "Users can view own wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can insert own wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON public.user_wallets;

CREATE POLICY "System functions only - view wallets"
ON public.user_wallets FOR SELECT USING (false);

CREATE POLICY "System functions only - insert wallets"
ON public.user_wallets FOR INSERT WITH CHECK (false);

CREATE POLICY "System functions only - update wallets"
ON public.user_wallets FOR UPDATE USING (false);

-- 3. Fix number_activations - block direct access
DROP POLICY IF EXISTS "Users can view own activations" ON public.number_activations;
DROP POLICY IF EXISTS "System can insert activations" ON public.number_activations;
DROP POLICY IF EXISTS "System can update activations" ON public.number_activations;

CREATE POLICY "System functions only - view activations"
ON public.number_activations FOR SELECT USING (false);

CREATE POLICY "System functions only - insert activations"
ON public.number_activations FOR INSERT WITH CHECK (false);

CREATE POLICY "System functions only - update activations"
ON public.number_activations FOR UPDATE USING (false);

-- 4. Fix auto_sms_servers - restrict to admin access via functions only
DROP POLICY IF EXISTS "Anyone can view auto servers" ON public.auto_sms_servers;
DROP POLICY IF EXISTS "System can insert auto servers" ON public.auto_sms_servers;
DROP POLICY IF EXISTS "System can update auto servers" ON public.auto_sms_servers;
DROP POLICY IF EXISTS "System can delete auto servers" ON public.auto_sms_servers;

CREATE POLICY "System functions only - view auto servers"
ON public.auto_sms_servers FOR SELECT USING (false);

CREATE POLICY "System functions only - insert auto servers"
ON public.auto_sms_servers FOR INSERT WITH CHECK (false);

CREATE POLICY "System functions only - update auto servers"
ON public.auto_sms_servers FOR UPDATE USING (false);

CREATE POLICY "System functions only - delete auto servers"
ON public.auto_sms_servers FOR DELETE USING (false);

-- 5. Fix sms_servers - restrict to admin access via functions only
DROP POLICY IF EXISTS "Anyone can view servers" ON public.sms_servers;
DROP POLICY IF EXISTS "System can insert servers" ON public.sms_servers;
DROP POLICY IF EXISTS "System can update servers" ON public.sms_servers;
DROP POLICY IF EXISTS "System can delete servers" ON public.sms_servers;

CREATE POLICY "System functions only - view servers"
ON public.sms_servers FOR SELECT USING (false);

CREATE POLICY "System functions only - insert servers"
ON public.sms_servers FOR INSERT WITH CHECK (false);

CREATE POLICY "System functions only - update servers"
ON public.sms_servers FOR UPDATE USING (false);

CREATE POLICY "System functions only - delete servers"
ON public.sms_servers FOR DELETE USING (false);

-- 6. Fix upi_settings - block all direct access
DROP POLICY IF EXISTS "Admins can view upi settings" ON public.upi_settings;
DROP POLICY IF EXISTS "Admins can update upi settings" ON public.upi_settings;

CREATE POLICY "System functions only - view upi settings"
ON public.upi_settings FOR SELECT USING (false);

CREATE POLICY "System functions only - update upi settings"
ON public.upi_settings FOR UPDATE USING (false);

-- 7. Fix transactions - block direct access
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON public.transactions;

CREATE POLICY "System functions only - view transactions"
ON public.transactions FOR SELECT USING (false);

CREATE POLICY "System functions only - insert transactions"
ON public.transactions FOR INSERT WITH CHECK (false);

-- 8. Fix upi_recharges
DROP POLICY IF EXISTS "Users can view own upi recharges" ON public.upi_recharges;
DROP POLICY IF EXISTS "System can insert upi recharges" ON public.upi_recharges;

CREATE POLICY "System functions only - view upi recharges"
ON public.upi_recharges FOR SELECT USING (false);

CREATE POLICY "System functions only - insert upi recharges"
ON public.upi_recharges FOR INSERT WITH CHECK (false);

-- 9. Fix referral_codes
DROP POLICY IF EXISTS "Users can view own referral code" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can insert own referral code" ON public.referral_codes;

CREATE POLICY "System functions only - view referral codes"
ON public.referral_codes FOR SELECT USING (false);

CREATE POLICY "System functions only - insert referral codes"
ON public.referral_codes FOR INSERT WITH CHECK (false);

-- 10. Fix referral_earnings
DROP POLICY IF EXISTS "Users can view own earnings" ON public.referral_earnings;
DROP POLICY IF EXISTS "Users can insert own earnings" ON public.referral_earnings;

CREATE POLICY "System functions only - view referral earnings"
ON public.referral_earnings FOR SELECT USING (false);

CREATE POLICY "System functions only - insert referral earnings"
ON public.referral_earnings FOR INSERT WITH CHECK (false);

-- 11. Fix referrals
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;

CREATE POLICY "System functions only - view referrals"
ON public.referrals FOR SELECT USING (false);

-- 12. Fix promo_redemptions
DROP POLICY IF EXISTS "Users can view own redemptions" ON public.promo_redemptions;
DROP POLICY IF EXISTS "System can insert redemptions" ON public.promo_redemptions;

CREATE POLICY "System functions only - view promo redemptions"
ON public.promo_redemptions FOR SELECT USING (false);

CREATE POLICY "System functions only - insert promo redemptions"
ON public.promo_redemptions FOR INSERT WITH CHECK (false);

-- 13. Fix user_favorite_services
DROP POLICY IF EXISTS "Users can view own favorites" ON public.user_favorite_services;
DROP POLICY IF EXISTS "Users can insert own favorites" ON public.user_favorite_services;
DROP POLICY IF EXISTS "Users can delete own favorites" ON public.user_favorite_services;

CREATE POLICY "System functions only - view favorites"
ON public.user_favorite_services FOR SELECT USING (false);

CREATE POLICY "System functions only - insert favorites"
ON public.user_favorite_services FOR INSERT WITH CHECK (false);

CREATE POLICY "System functions only - delete favorites"
ON public.user_favorite_services FOR DELETE USING (false);

-- 14. Fix cdn_settings
DROP POLICY IF EXISTS "Admins can view cdn settings" ON public.cdn_settings;
DROP POLICY IF EXISTS "Admins can update cdn settings" ON public.cdn_settings;
DROP POLICY IF EXISTS "Admins can insert cdn settings" ON public.cdn_settings;

CREATE POLICY "System functions only - view cdn settings"
ON public.cdn_settings FOR SELECT USING (false);

CREATE POLICY "System functions only - update cdn settings"
ON public.cdn_settings FOR UPDATE USING (false);

CREATE POLICY "System functions only - insert cdn settings"
ON public.cdn_settings FOR INSERT WITH CHECK (false);