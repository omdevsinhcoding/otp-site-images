import { supabase } from '@/integrations/supabase/client';
import type { ITransactionRepository } from '../interfaces';
import type { OperationResult, TransactionsResult } from '../types';

export class SupabaseTransactionRepository implements ITransactionRepository {
  async getUserTransactions(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    type?: string
  ): Promise<OperationResult<TransactionsResult>> {
    try {
      const { data, error } = await supabase.rpc('get_user_transactions', {
        p_user_id: userId,
        p_limit: limit,
        p_offset: offset,
        p_type: type || null
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const result = data as unknown as TransactionsResult;
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async addRecharge(
    userId: string,
    amount: number
  ): Promise<OperationResult<{ new_balance: number; total_recharge: number }>> {
    try {
      const { data, error } = await supabase.rpc('add_user_recharge', {
        p_user_id: userId,
        p_amount: amount
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const result = data as unknown as { success: boolean; new_balance: number; total_recharge: number };
      
      if (!result.success) {
        return { success: false, error: 'Recharge failed' };
      }

      return {
        success: true,
        data: {
          new_balance: result.new_balance,
          total_recharge: result.total_recharge
        }
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async deductForPurchase(
    userId: string,
    amount: number,
    description: string = 'Number purchase'
  ): Promise<OperationResult<{ new_balance: number }>> {
    try {
      const { data, error } = await supabase.rpc('deduct_for_number_purchase', {
        p_user_id: userId,
        p_amount: amount,
        p_description: description
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const result = data as unknown as { success: boolean; error?: string; new_balance: number };
      
      if (!result.success) {
        return { success: false, error: result.error || 'Deduction failed' };
      }

      return { success: true, data: { new_balance: result.new_balance } };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
