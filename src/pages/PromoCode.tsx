import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { useCustomToast } from '@/components/ui/custom-toast';
import { supabase } from '@/integrations/supabase/client';
import { BannedUserOverlay } from '@/components/ui/BannedUserOverlay';
import giftCardImg from '@/assets/gift-card.png';

export default function PromoCode() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast, updateToast } = useCustomToast();
  const db = useDatabase();

  const [balance, setBalance] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<{ amount: number } | null>(null);

  // Fetch balance on mount
  const fetchBalance = async () => {
    if (!user?.id) return;
    try {
      const result = await db.users.getDashboardStats(user.id);
      if (result.success && result.data) {
        setBalance(result.data.balance);
      }
    } catch {
      // Silent fail
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [user?.id]);

  const handleRedeemPromo = async () => {
    if (!promoCode.trim()) {
      showToast("Enter code", "error");
      return;
    }

    if (!user?.id) {
      showToast("Login required", "error");
      return;
    }

    setRedeeming(true);
    const toastId = showToast("Validating...", "loading", true);
    
    try {
      const { data, error } = await supabase.rpc('redeem_promo_code', {
        p_code: promoCode.toUpperCase(),
        p_user_id: user.id
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; amount?: number; new_balance?: number };

      if (result.success) {
        updateToast(toastId, `₹${result.amount} added!`, "success");
        setRedeemSuccess({ amount: result.amount || 0 });
        if (result.new_balance !== undefined) {
          setBalance(result.new_balance);
        } else {
          await fetchBalance();
        }
      } else {
        let errorMsg = "Failed to redeem";
        
        if (result.error?.includes("maximum redemptions")) {
          errorMsg = "Limit Reached";
        } else if (result.error?.includes("already redeemed")) {
          errorMsg = "Already Redeemed";
        } else if (result.error?.includes("expired")) {
          errorMsg = "Code Expired";
        } else if (result.error?.includes("no longer active")) {
          errorMsg = "Code Inactive";
        } else if (result.error?.includes("Invalid")) {
          errorMsg = "Invalid Code";
        }
        
        updateToast(toastId, errorMsg, "error");
      }
    } catch (error: any) {
      updateToast(toastId, error.message || "Failed to redeem", "error");
    } finally {
      setRedeeming(false);
    }
  };

  const handleDone = () => {
    setPromoCode('');
    setRedeemSuccess(null);
  };

  return (
    <DashboardLayout balance={balance}>
      {user?.is_banned && <BannedUserOverlay />}
      <div className="space-y-6">
        <Card className="bg-[#ffffff] border border-[#f5f5f5] p-4 xs:p-6 rounded-xl shadow-sm w-full max-w-lg mx-auto">
          {/* Header with back button */}
          <div className="flex items-center gap-2 xs:gap-3 mb-6 xs:mb-8">
            <button
              onClick={() => navigate('/recharge')}
              className="p-1.5 xs:p-2 hover:bg-[#f8f9fa] rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-base xs:text-lg font-semibold text-foreground">Promocode</h1>
              <p className="text-xs xs:text-sm text-primary">gift card.</p>
            </div>
          </div>

          {redeemSuccess ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">Success!</h3>
              <p className="text-2xl font-bold text-emerald-600 mb-2">₹{redeemSuccess.amount}</p>
              <p className="text-sm text-muted-foreground">has been added to your balance</p>
              <Button
                onClick={handleDone}
                className="mt-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Apply Another Code
              </Button>
            </div>
          ) : (
            <>
              {/* Gift card image */}
              <div className="flex justify-center mb-6 xs:mb-8">
                <img
                  src={giftCardImg}
                  alt="Gift Card"
                  className="w-32 h-32 xs:w-40 xs:h-40 sm:w-48 sm:h-48 object-contain"
                />
              </div>

              {/* Promo code input section */}
              <div className="space-y-6">
                <h2 className="text-center text-base font-medium text-primary">
                  Enter Your PromoCode
                </h2>

                <div className="max-w-sm mx-auto">
                  <Input
                    placeholder="Code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="font-mono uppercase text-base text-center border border-[#e5e7eb] rounded-lg px-4 py-3 bg-[#f8f9fa] focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                    maxLength={14}
                    disabled={redeeming}
                  />
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={handleRedeemPromo}
                    disabled={redeeming}
                    variant="outline"
                    className="rounded-full px-8 py-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {redeeming ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      'Apply'
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
