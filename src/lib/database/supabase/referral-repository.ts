import { supabase } from '@/integrations/supabase/client';
import type { IReferralRepository } from '../interfaces';
import type { OperationResult, ReferralStats } from '../types';

export class SupabaseReferralRepository implements IReferralRepository {
  async getOrCreateReferralCode(userId: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('get_or_create_referral_code', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error getting referral code:', error);
        return '';
      }

      return data as string;
    } catch {
      return '';
    }
  }

  async getReferralStats(userId: string): Promise<OperationResult<ReferralStats>> {
    try {
      const { data, error } = await supabase.rpc('get_referral_stats', {
        p_user_id: userId
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const stats = data as unknown as ReferralStats;
      return { success: true, data: stats };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async withdrawEarnings(
    userId: string
  ): Promise<OperationResult<{ amount_withdrawn: number; new_wallet_balance: number }>> {
    try {
      const { data, error } = await supabase.rpc('withdraw_referral_earnings', {
        p_user_id: userId
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const result = data as unknown as {
        success: boolean;
        error?: string;
        amount_withdrawn: number;
        new_wallet_balance: number;
      };

      if (!result.success) {
        return { success: false, error: result.error || 'Withdrawal failed' };
      }

      return {
        success: true,
        data: {
          amount_withdrawn: result.amount_withdrawn,
          new_wallet_balance: result.new_wallet_balance
        }
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
