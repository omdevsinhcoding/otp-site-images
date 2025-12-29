import { supabase } from '@/integrations/supabase/client';
import type { IUserRepository } from '../interfaces';
import type { OperationResult, DashboardStats } from '../types';

export class SupabaseUserRepository implements IUserRepository {
  async getUserRole(userId: string): Promise<'admin' | 'moderator' | 'user'> {
    try {
      const { data, error } = await supabase.rpc('get_user_role', { p_user_id: userId });
      
      if (error || !data) {
        return 'user';
      }
      
      return data as 'admin' | 'moderator' | 'user';
    } catch {
      return 'user';
    }
  }

  async hasRole(userId: string, role: 'admin' | 'moderator' | 'user'): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: role
      });
      
      if (error) return false;
      return data as boolean;
    } catch {
      return false;
    }
  }

  async getDashboardStats(userId: string): Promise<OperationResult<DashboardStats>> {
    try {
      const { data, error } = await supabase.rpc('get_user_dashboard_stats', {
        p_user_id: userId
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const stats = data as unknown as DashboardStats;
      return { success: true, data: stats };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async getWalletBalance(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_wallet_balance', {
        p_user_id: userId
      });

      if (error) return 0;
      return data as number;
    } catch {
      return 0;
    }
  }
}
