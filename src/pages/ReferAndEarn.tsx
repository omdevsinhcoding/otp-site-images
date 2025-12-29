import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { useCustomToast } from '@/components/ui/custom-toast';
import { BannedUserOverlay } from '@/components/ui/BannedUserOverlay';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import referIllustration from '@/assets/refer-illustration.png';

interface ReferralStats {
  referred_count: number;
  total_earned: number;
  available_balance: number;
}

const ReferAndEarn = () => {
  const { user } = useAuth();
  const db = useDatabase();
  const { showToast, updateToast } = useCustomToast();
  const [referralCode, setReferralCode] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats>({
    referred_count: 0,
    total_earned: 0,
    available_balance: 0
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [balance, setBalance] = useState(0);
  const lastClickTime = useRef<number>(0);

  const minWithdrawAmount = 50;
  const COOLDOWN_MS = 1000;

  useEffect(() => {
    if (cooldownTime <= 0) return;
    const timer = setInterval(() => {
      setCooldownTime(prev => {
        if (prev <= 100) {
          clearInterval(timer);
          return 0;
        }
        return prev - 100;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [cooldownTime > 0]);

  useEffect(() => {
    const fetchReferralData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const [balanceResult, code, statsResult] = await Promise.all([
          db.users.getWalletBalance(user.id),
          db.referrals.getOrCreateReferralCode(user.id),
          db.referrals.getReferralStats(user.id)
        ]);
        
        setBalance(balanceResult || 0);
        setReferralCode(code);
        
        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReferralData();
  }, [user?.id, db.referrals, db.users]);

  const referralLink = `${window.location.origin}/ref/${referralCode}`;

  const handleCopy = async () => {
    if (loading || !referralCode) {
      showToast('Generating link...', 'info');
      return;
    }
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      showToast('Referral link copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy link', 'error');
    }
  };

  const handleWithdraw = async () => {
    if (!user?.id) {
      showToast('Please login to withdraw', 'error', true);
      return;
    }
    const now = Date.now();
    const inCooldown = now - lastClickTime.current < COOLDOWN_MS;

    if (withdrawing || inCooldown) {
      if ((stats.available_balance ?? 0) < minWithdrawAmount) {
        showToast(`Min. ₹${minWithdrawAmount} required`, 'error', true);
      } else {
        showToast('Processing...', 'info', true);
      }
      return;
    }
    lastClickTime.current = now;

    const toastId = showToast('Withdrawing...', 'loading', true);
    setWithdrawing(true);
    setCooldownTime(COOLDOWN_MS);

    const minLoadingPromise = new Promise(resolve => setTimeout(resolve, COOLDOWN_MS));

    try {
      const statsResult = await db.referrals.getReferralStats(user.id);

      if (!statsResult.success) {
        await minLoadingPromise;
        updateToast(toastId, 'Failed to check balance', 'error');
        setWithdrawing(false);
        return;
      }

      const parsedStats = statsResult.data!;
      const latestBalance = parsedStats?.available_balance ?? 0;
      setStats(parsedStats);

      if (latestBalance < minWithdrawAmount) {
        await minLoadingPromise;
        updateToast(toastId, `Min. ₹${minWithdrawAmount} required`, 'error');
        setWithdrawing(false);
        return;
      }

      const withdrawResult = await db.referrals.withdrawEarnings(user.id);
      await minLoadingPromise;

      if (!withdrawResult.success) {
        updateToast(toastId, withdrawResult.error || 'Withdraw failed', 'error');
        setWithdrawing(false);
        return;
      }

      updateToast(toastId, `₹${withdrawResult.data!.amount_withdrawn.toFixed(2)} added!`, 'success');
      setBalance(withdrawResult.data!.new_wallet_balance);
      setStats(prev => ({ ...prev, available_balance: 0 }));
    } catch (err) {
      console.error('Error:', err);
      await minLoadingPromise;
      updateToast(toastId, 'Something went wrong', 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <DashboardLayout balance={balance}>
      {user?.is_banned && <BannedUserOverlay />}
      <div className="w-full max-w-5xl mx-auto space-y-4">
        <h1 className="text-foreground text-xl sm:text-2xl md:text-3xl font-semibold">Refer and Earn</h1>
        
        {/* Main Referral Card */}
        <div className="bg-card rounded-xl p-4 sm:py-6 sm:px-5 md:px-8 border border-border shadow-sm">
          <div className="flex justify-center mb-6 sm:mb-8">
            <OptimizedImage src={referIllustration} alt="Refer and Earn" className="w-20 h-20 sm:w-[90px] sm:h-[90px] rounded-lg" />
          </div>

          <div className="flex items-center justify-center mb-6 sm:mb-8">
            <div className="inline-flex items-center rounded-lg overflow-hidden bg-background border border-border shadow-sm max-w-full">
              <div className="px-3 sm:px-6 py-3 overflow-x-auto max-w-[200px] sm:max-w-[360px] md:max-w-[450px] scrollbar-hide">
                {loading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Generating...</span>
                  </div>
                ) : (
                  <span className="text-foreground whitespace-nowrap font-medium text-xs sm:text-sm md:text-base">
                    {referralLink}
                  </span>
                )}
              </div>
              <button onClick={handleCopy} type="button" className="p-3 border-l border-border hover:bg-muted/50 transition-colors">
                {copied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className="text-primary"><path fill="currentColor" d="M.41 13.41L6 19l1.41-1.42L1.83 12m20.41-6.42L11.66 16.17L7.5 12l-1.43 1.41L11.66 19l12-12M18 7l-1.41-1.42l-6.35 6.35l1.42 1.41z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" className="text-primary"><path fill="currentColor" d="M8 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM7 4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1zM4 6a2 2 0 0 1 1-1.732V14.5A2.5 2.5 0 0 0 7.5 17h6.232A2 2 0 0 1 12 18H7.5A3.5 3.5 0 0 1 4 14.5z" /></svg>
                )}
              </button>
            </div>
          </div>

          <h2 className="text-foreground text-center mb-4 text-base sm:text-lg font-semibold">Instructions</h2>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>1. Copy and Share Your link.</p>
            <p>2. Whenever your friend register using your link and add money.</p>
            <p>3. You will receive <span className="text-primary font-medium">5% of deposit amount</span> in your wallet.</p>
            <p>4. You can directly use that balance to buy numbers.</p>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-card rounded-xl p-4 sm:py-6 sm:px-6 border border-border shadow-sm">
          <div className="flex items-center justify-center gap-6 sm:gap-12 md:gap-20">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">{stats.referred_count}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Referred</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">₹{stats.total_earned.toFixed(2)}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Total Earned</p>
            </div>
          </div>
        </div>

        {/* Withdraw Card */}
        <div className="bg-card rounded-xl p-4 sm:py-5 sm:px-6 border border-border shadow-sm">
          <div className="text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Available Balance</p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground mb-4">₹{stats.available_balance.toFixed(2)}</p>
            <button onClick={handleWithdraw} disabled={withdrawing} className={`mx-auto flex items-center justify-center font-semibold text-xs uppercase tracking-widest min-w-[140px] sm:min-w-[180px] py-3 rounded-lg transition-all ${withdrawing ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}>
              {withdrawing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'WITHDRAW'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReferAndEarn;
