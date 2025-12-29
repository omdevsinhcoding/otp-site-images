import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalBalance: number;
  totalReferrals: number;
  totalTransactions: number;
}

export function useAdminStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalAdmins: 0,
    totalBalance: 0,
    totalReferrals: 0,
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      // Use secure RPC functions to fetch admin stats
      const [statsResult, adminsResult, referralsResult] = await Promise.all([
        supabase.rpc('get_admin_stats', { p_admin_id: user.id }),
        supabase.rpc('get_admin_count'),
        supabase.rpc('get_referral_count'),
      ]);

      const statsData = statsResult.data as { success: boolean; total_users?: number; total_balance?: number; total_transactions?: number } | null;
      
      if (statsData?.success) {
        setStats({
          totalUsers: statsData.total_users || 0,
          totalAdmins: (adminsResult.data as number) || 0,
          totalBalance: statsData.total_balance || 0,
          totalReferrals: (referralsResult.data as number) || 0,
          totalTransactions: statsData.total_transactions || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => fetchStats(true);

  useEffect(() => {
    fetchStats();

    // Set up real-time subscriptions for updates
    const usersChannel = supabase
      .channel('admin-users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchStats();
      })
      .subscribe();

    const walletsChannel = supabase
      .channel('admin-wallets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_wallets' }, () => {
        fetchStats();
      })
      .subscribe();

    const referralsChannel = supabase
      .channel('admin-referrals-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals' }, () => {
        fetchStats();
      })
      .subscribe();

    const rolesChannel = supabase
      .channel('admin-roles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(walletsChannel);
      supabase.removeChannel(referralsChannel);
      supabase.removeChannel(rolesChannel);
    };
  }, [user?.id]);

  return { stats, loading, refetch };
}