import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RupeeIcon } from '@/components/icons/RupeeIcon';
import { BanknoteIcon } from '@/components/icons/BanknoteIcon';
import { ChatBubbleIcon } from '@/components/icons/ChatBubbleIcon';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { BannedUserOverlay } from '@/components/ui/BannedUserOverlay';
import { useCustomToast } from '@/components/ui/custom-toast';

interface DashboardStats {
  balance: number;
  total_recharge: number;
  total_otp: number;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const db = useDatabase();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    balance: 0,
    total_recharge: 0,
    total_otp: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const { showToast } = useCustomToast();
  const banToastShownRef = useRef(false);

  // Show ban toast once when banned user enters dashboard
  useEffect(() => {
    if (user?.is_banned && !banToastShownRef.current) {
      banToastShownRef.current = true;
      showToast('Account suspended. Contact support.', 'error', false, 5000);
    }
  }, [user?.is_banned, showToast]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;
      
      try {
        const result = await db.users.getDashboardStats(user.id);
        
        if (result.success && result.data) {
          setStats({
            balance: result.data.balance || 0,
            total_recharge: result.data.total_recharge || 0,
            total_otp: result.data.total_otp || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    if (user?.id) {
      fetchStats();
    }
  }, [user?.id, db.users]);

  // Update last_active when user visits dashboard
  useEffect(() => {
    const updateLastActive = async () => {
      if (!user?.id) return;
      
      try {
        await db.auth.updateUserLastActive(user.id);
      } catch (error) {
        console.error('Error updating last active:', error);
      }
    };

    if (user?.id) {
      updateLastActive();
    }
  }, [user?.id, db.auth]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout balance={stats.balance}>
      {/* Show overlay for banned users */}
      {user.is_banned && <BannedUserOverlay />}
      
      <div className="grid gap-3 xs:gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Balance"
          value={statsLoading ? '...' : stats.balance.toFixed(2)}
          icon={RupeeIcon}
          iconBgColor="bg-red-500"
        />
        <StatCard
          title="Total Recharge"
          value={statsLoading ? '...' : stats.total_recharge.toFixed(2)}
          icon={BanknoteIcon}
          iconBgColor="bg-emerald-500"
        />
        <StatCard
          title="Total OTP Taken"
          value={statsLoading ? '...' : stats.total_otp}
          icon={ChatBubbleIcon}
          iconBgColor="bg-indigo-500"
        />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;