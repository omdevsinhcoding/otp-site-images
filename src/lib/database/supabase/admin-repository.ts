import { supabase } from '@/integrations/supabase/client';
import type { IAdminRepository, SmsServerData } from '../interfaces';
import type { OperationResult, AdminUserData, BalanceUpdateResult } from '../types';

export class SupabaseAdminRepository implements IAdminRepository {
  async getAllUsers(adminId: string): Promise<OperationResult<AdminUserData[]>> {
    try {
      const { data, error } = await supabase.rpc('admin_get_all_users', {
        p_admin_id: adminId
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const result = data as unknown as { success: boolean; error?: string; users?: AdminUserData[] };

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to fetch users' };
      }

      return { success: true, data: result.users || [] };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async updateUserBalance(
    adminId: string,
    userId: string,
    amount: number,
    operation: 'credit' | 'debit',
    notes?: string
  ): Promise<OperationResult<BalanceUpdateResult>> {
    try {
      const { data, error } = await supabase.rpc('admin_update_user_balance', {
        p_admin_id: adminId,
        p_user_id: userId,
        p_amount: amount,
        p_operation: operation,
        p_notes: notes || null
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const result = data as unknown as {
        success: boolean;
        error?: string;
        previous_balance: number;
        new_balance: number;
        operation: string;
        amount: number;
      };

      if (!result.success) {
        return { success: false, error: result.error || 'Update failed' };
      }

      return {
        success: true,
        data: {
          previous_balance: result.previous_balance,
          new_balance: result.new_balance,
          operation: result.operation,
          amount: result.amount
        }
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async updateUserStats(
    adminId: string,
    userId: string,
    balance?: number,
    totalRecharge?: number,
    totalOtp?: number
  ): Promise<OperationResult> {
    try {
      const { data, error } = await supabase.rpc('admin_update_user_stats', {
        p_admin_id: adminId,
        p_user_id: userId,
        p_balance: balance ?? null,
        p_total_recharge: totalRecharge ?? null,
        p_total_otp: totalOtp ?? null
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const result = data as unknown as { success: boolean; error?: string };
      return { success: result.success, error: result.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async resetUserPassword(
    adminId: string,
    userId: string,
    newPassword: string
  ): Promise<OperationResult> {
    try {
      const { data, error } = await supabase.rpc('admin_reset_user_password', {
        p_admin_id: adminId,
        p_user_id: userId,
        p_new_password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const result = data as unknown as { success: boolean; error?: string };
      return { success: result.success, error: result.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async updateUserDiscount(
    adminId: string,
    userId: string,
    discountType: 'percentage' | 'fixed',
    discountValue: number
  ): Promise<OperationResult<{ discount_type: string; discount_value: number }>> {
    try {
      const { data, error } = await supabase.rpc('admin_update_user_discount', {
        p_admin_id: adminId,
        p_user_id: userId,
        p_discount_type: discountType,
        p_discount_value: discountValue
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const result = data as unknown as {
        success: boolean;
        error?: string;
        discount_type: string;
        discount_value: number;
      };

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to update discount' };
      }

      return {
        success: true,
        data: {
          discount_type: result.discount_type,
          discount_value: result.discount_value
        }
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async addSmsServer(
    adminId: string,
    serverData: SmsServerData
  ): Promise<OperationResult<{ id: string; server_name: string; country_name: string }>> {
    try {
      const { data, error } = await supabase.rpc('admin_add_sms_server', {
        p_admin_id: adminId,
        p_server_name: serverData.server_name,
        p_country_code: serverData.country_code,
        p_country_name: serverData.country_name,
        p_country_dial_code: serverData.country_dial_code,
        p_country_flag: serverData.country_flag || null,
        p_api_response_type: serverData.api_response_type,
        p_uses_headers: serverData.uses_headers,
        p_header_key_name: serverData.header_key_name || null,
        p_header_value: serverData.header_value || null,
        p_api_get_number_url: serverData.api_get_number_url,
        p_api_get_message_url: serverData.api_get_message_url || null,
        p_api_activate_next_message_url: serverData.api_activate_next_message_url || null,
        p_api_cancel_number_url: serverData.api_cancel_number_url || null,
        p_number_id_path: serverData.number_id_path || null,
        p_phone_number_path: serverData.phone_number_path || null,
        p_otp_path_in_json: serverData.otp_path_in_json || null,
        p_auto_cancel_minutes: serverData.auto_cancel_minutes,
        p_api_retry_count: serverData.api_retry_count
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const result = data as unknown as {
        success: boolean;
        error?: string;
        server?: { id: string; server_name: string; country_name: string };
      };

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to add server' };
      }

      return {
        success: true,
        data: result.server!
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
