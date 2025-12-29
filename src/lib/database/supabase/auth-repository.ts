import { supabase } from '@/integrations/supabase/client';
import type { IAuthRepository } from '../interfaces';
import type { User, OperationResult, LoginResult } from '../types';

export class SupabaseAuthRepository implements IAuthRepository {
  private isNetworkFetchError(err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return /failed to fetch|networkerror|load failed/i.test(message);
  }

  private async sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async registerUser(email: string, password: string, name?: string): Promise<OperationResult<LoginResult>> {
    try {
      let data: unknown;
      let error: any;

      // Retry once for transient network failures (DNS/VPN/adblock/CORS hiccups)
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          ({ data, error } = await supabase.rpc('register_user', {
            p_email: email,
            p_password: password,
            p_name: name || null,
          }));
          break;
        } catch (err) {
          if (this.isNetworkFetchError(err) && attempt === 0) {
            console.warn('[auth.registerUser] transient network error, retrying once');
            await this.sleep(500);
            continue;
          }
          throw err;
        }
      }

      if (error) {
        return { success: false, error: error.message };
      }

      const result = data as unknown as { success: boolean; error?: string; user?: LoginResult['user'] };

      if (!result.success) {
        return { success: false, error: result.error || 'Registration failed' };
      }

      return { success: true, data: { user: result.user! } };
    } catch (err: any) {
      if (this.isNetworkFetchError(err)) {
        console.warn('[auth.registerUser] cannot reach Supabase (network/CORS/adblock/VPN)');
        return {
          success: false,
          error:
            'Network error: cannot reach Supabase. Disable VPN/AdBlock and ensure your network allows https://sqbqutpuiqwwclyxjeem.supabase.co',
        };
      }
      return { success: false, error: err?.message || 'Registration failed' };
    }
  }

  async loginUser(email: string, password: string): Promise<OperationResult<LoginResult>> {
    try {
      let data: unknown;
      let error: any;

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          ({ data, error } = await supabase.rpc('login_user', {
            p_email: email,
            p_password: password,
          }));
          break;
        } catch (err) {
          if (this.isNetworkFetchError(err) && attempt === 0) {
            console.warn('[auth.loginUser] transient network error, retrying once');
            await this.sleep(500);
            continue;
          }
          throw err;
        }
      }

      if (error) {
        return { success: false, error: error.message };
      }

      const result = data as unknown as { success: boolean; error?: string; user?: LoginResult['user'] };

      if (!result.success) {
        return { success: false, error: result.error || 'Invalid credentials' };
      }

      return { success: true, data: { user: result.user! } };
    } catch (err: any) {
      if (this.isNetworkFetchError(err)) {
        console.warn('[auth.loginUser] cannot reach Supabase (network/CORS/adblock/VPN)');
        return {
          success: false,
          error:
            'Network error: cannot reach Supabase. Disable VPN/AdBlock and ensure your network allows https://sqbqutpuiqwwclyxjeem.supabase.co',
        };
      }
      return { success: false, error: err?.message || 'Login failed' };
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return data as User;
  }

  async updateUserAvatar(userId: string, avatarUrl: string): Promise<OperationResult> {
    try {
      const { data, error } = await supabase.rpc('update_user_avatar', {
        p_user_id: userId,
        p_avatar_url: avatarUrl
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

  async updateUserLastActive(userId: string): Promise<void> {
    await supabase.rpc('update_user_last_active', { p_user_id: userId });
  }
}
