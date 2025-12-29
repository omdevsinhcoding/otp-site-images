import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, CheckCircle, ArrowLeft, AlertCircle, Copy, Check, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { useCustomToast } from '@/components/ui/custom-toast';
import { supabase } from '@/integrations/supabase/client';
import { BannedUserOverlay } from '@/components/ui/BannedUserOverlay';
import { PromoCodeCelebration } from '@/components/ui/PromoCodeCelebration';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import upiIcon from '@/assets/upi-icon.png';
import promoIcon from '@/assets/promo-icon.png';
import cryptoIcon from '@/assets/crypto-icon.png';
import giftCardImg from '@/assets/gift-card.png';
import bharatpayQr from '@/assets/bharatpay-qr.jpg';
import copyIcon from '@/assets/copy-icon.png';
import copiedIcon from '@/assets/copied-icon.png';

interface UpiPublicSettings {
  upi_id: string;
  upi_qr_url: string;
  min_recharge: number;
  is_active: boolean;
}

const DEFAULT_UPI_ID = "BHARATPE.8C0L1Z0L8A27304@fbpe";

const rechargeMethods = [{
  id: 'upi',
  title: 'UPI',
  subtitle: 'Phonepe,Paytm etc.',
  icon: upiIcon
}, {
  id: 'auto-payment',
  title: 'Auto Payment',
  subtitle: 'Instant Verification',
  icon: upiIcon
}, {
  id: 'promo',
  title: 'Promo Code',
  subtitle: 'Gift Code',
  icon: promoIcon
}, {
  id: 'crypto',
  title: 'Crypto',
  subtitle: 'Tron , USDT',
  icon: cryptoIcon
}];

export default function Recharge() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast, updateToast } = useCustomToast();
  const db = useDatabase();
  const [balance, setBalance] = useState(0);
  const [activeView, setActiveView] = useState<'methods' | 'promo' | 'upi' | 'crypto'>('methods');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [initiatingCrypto, setInitiatingCrypto] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<{
    amount: number;
  } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationAmount, setCelebrationAmount] = useState(0);
  const [utrNumber, setUtrNumber] = useState('');
  const [upiCopied, setUpiCopied] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [upiSettings, setUpiSettings] = useState<UpiPublicSettings | null>(null);
  const [verifyingUtr, setVerifyingUtr] = useState(false);

  const upiNotes = [
    "अगर आपका कभी पैसा ऐड होने / या आपको राशि जोड़ने हेतु कोई भी समस्या आती है तो घबराएं नहीं हमारे ग्राहक सहायता @OTPBUYSUPPORT पर संपर्क कर सकते हैं, हमें आपकी सेवा करने में प्रसन्नता हो रही है @OTPBUYSUPPORT पर मैसेज करें! हम आपको किसी भी कीमत पर 24 घंटे के भीतर जवाब देंगे और आपकी समस्या का समाधान करेंगे।",
    "Sometimes Airtel Payment Bank and Slice Payments may not work. If you face any issues, please contact our support team.",
    "Please enter the correct UTR/Transaction ID to avoid delays in balance credit. Double-check before submitting."
  ];

  // Auto-rotate UPI notes
  useEffect(() => {
    if (activeView !== 'upi') return;
    
    const interval = setInterval(() => {
      setCurrentNoteIndex((prev) => (prev + 1) % upiNotes.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [activeView, upiNotes.length]);

  // Fetch balance on mount and when user changes
  const fetchBalance = async () => {
    if (!user?.id) return;
    try {
      const result = await db.users.getDashboardStats(user.id);
      if (result.success && result.data) {
        setBalance(result.data.balance);
      }
    } catch {
      // Silent fail - balance will show 0
    }
  };

  // Fetch UPI settings
  const fetchUpiSettings = async () => {
    try {
      const { data } = await supabase.rpc('get_upi_settings_public');
      if (data) {
        setUpiSettings(data as unknown as UpiPublicSettings);
      }
    } catch {
      // Silent fail - will use defaults
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchUpiSettings();
  }, [user?.id]);
  const handleMethodClick = async (methodId: string) => {
    if (methodId === 'promo') {
      setActiveView('promo');
      setRedeemSuccess(null);
      setPromoCode('');
    } else if (methodId === 'upi') {
      setActiveView('upi');
      setUtrNumber('');
      setUpiCopied(false);
    } else if (methodId === 'auto-payment') {
      navigate('/auto-payment');
    } else if (methodId === 'crypto') {
      setActiveView('crypto');
      setCryptoAmount('');
    }
  };

  const handleCryptoPayment = async () => {
    if (!cryptoAmount.trim()) {
      showToast("Enter amount", "error");
      return;
    }
    
    const numAmount = parseFloat(cryptoAmount);
    if (isNaN(numAmount) || numAmount < 100) {
      showToast("Minimum amount is ₹100", "error");
      return;
    }
    
    if (!user?.id) {
      showToast("Login required", "error");
      return;
    }
    
    setInitiatingCrypto(true);
    const toastId = showToast("Initializing crypto payment...", "loading", true);
    
    try {
      // First check if crypto is enabled
      const { data: settingsData } = await supabase.rpc('get_app_setting', {
        p_setting_key: 'cryptomus_settings'
      });
      
      let cryptoEnabled = false;
      if (settingsData && typeof settingsData === 'object') {
        const settings = settingsData as { is_active?: boolean };
        cryptoEnabled = settings.is_active === true;
      }
      
      if (!cryptoEnabled) {
        updateToast(toastId, "Crypto is disabled", "error");
        setInitiatingCrypto(false);
        return;
      }
      
      // Call cryptomus-initiate edge function
      const response = await supabase.functions.invoke('cryptomus-initiate', {
        body: { amount: numAmount, user_id: user.id }
      });
      
      if (response.error) throw response.error;
      
      const result = response.data as { success: boolean; error?: string; payment_url?: string };
      
      if (result.success && result.payment_url) {
        updateToast(toastId, "Redirecting to payment...", "success");
        window.open(result.payment_url, '_blank');
        setCryptoAmount('');
      } else {
        // Show concise error message
        let errorMsg = "Payment failed";
        if (result.error?.includes("minimum")) {
          errorMsg = "Amount too low";
        } else if (result.error?.includes("disabled")) {
          errorMsg = "Crypto is disabled";
        } else if (result.error?.includes("settings")) {
          errorMsg = "Gateway not configured";
        }
        updateToast(toastId, errorMsg, "error");
      }
    } catch (error: any) {
      updateToast(toastId, "Payment failed", "error");
    } finally {
      setInitiatingCrypto(false);
    }
  };

  const handleCopyUpi = async () => {
    const upiId = upiSettings?.upi_id || DEFAULT_UPI_ID;
    try {
      await navigator.clipboard.writeText(upiId);
      setUpiCopied(true);
      showToast("UPI ID copied!", "success");
      setTimeout(() => setUpiCopied(false), 2000);
    } catch {
      showToast("Failed to copy", "error");
    }
  };

  const handleAddMoney = async () => {
    if (!utrNumber.trim()) {
      showToast("Enter UTR Number", "error");
      return;
    }
    if (utrNumber.trim().length > 12) {
      showToast("UTR cannot be more than 12 digits", "error");
      return;
    }
    if (!/^[a-zA-Z0-9]+$/.test(utrNumber.trim())) {
      showToast("Only alphanumeric characters allowed", "error");
      return;
    }
    if (utrNumber.trim().startsWith('0')) {
      showToast("Invalid UTR entered", "error");
      return;
    }
    if (!user?.id) {
      showToast("Login required", "error");
      return;
    }

    setVerifyingUtr(true);
    const toastId = showToast("Verifying payment...", "loading", true);

    try {
      const response = await supabase.functions.invoke('verify-upi', {
        body: { user_id: user.id, txn_id: utrNumber.trim() }
      });

      if (response.error) throw response.error;

      const result = response.data as { success: boolean; error?: string; amount?: number; new_balance?: number };

      if (result.success) {
        updateToast(toastId, result.amount ? `₹${result.amount} credited!` : "Payment verified!", "success");
        if (result.new_balance !== undefined) {
          setBalance(result.new_balance);
        } else {
          await fetchBalance();
        }
        setUtrNumber('');
      } else {
        updateToast(toastId, result.error || "Verification failed", "error");
      }
    } catch (error: any) {
      updateToast(toastId, error.message || "Failed to verify", "error");
    } finally {
      setVerifyingUtr(false);
    }
  };
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
    
    // Show loading toast and keep reference
    const toastId = showToast("Validating...", "loading", true);
    
    try {
      const {
        data,
        error
      } = await supabase.rpc('redeem_promo_code', {
        p_code: promoCode.toUpperCase(),
        p_user_id: user.id
      });
      if (error) throw error;
      const result = data as {
        success: boolean;
        error?: string;
        amount?: number;
        new_balance?: number;
      };
      if (result.success) {
        // Update toast to success
        updateToast(toastId, `₹${result.amount} added!`, "success");
        
        // Show celebration
        setCelebrationAmount(result.amount || 0);
        setShowCelebration(true);
        
        // Update balance
        if (result.new_balance !== undefined) {
          setBalance(result.new_balance);
        } else {
          await fetchBalance();
        }
        
        // Set success state
        setRedeemSuccess({
          amount: result.amount || 0
        });
      } else {
        // Show short error messages
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
  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
  }, []);

  // Crypto Payment View
  if (activeView === 'crypto') {
    return (
      <DashboardLayout balance={balance}>
        {user?.is_banned && <BannedUserOverlay />}
        <div className="flex w-full items-start justify-center pt-2 sm:pt-4 md:pt-6">
          <Card className="bg-card border border-border rounded-lg sm:rounded-xl shadow-sm w-full max-w-[calc(100%-0.5rem)] sm:max-w-md lg:max-w-xl">
            <div className="p-3 xxxs:p-4 xs:p-5 sm:p-6 md:p-8">
              {/* Header with back button */}
              <div className="flex items-center gap-2 xxxs:gap-2.5 xs:gap-3 sm:gap-4 mb-4 xxxs:mb-5 xs:mb-6 sm:mb-8">
                <button 
                  onClick={() => setActiveView('methods')} 
                  className="p-1 xxxs:p-1.5 xs:p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 xxxs:h-4.5 xxxs:w-4.5 xs:h-5 xs:w-5 sm:h-6 sm:w-6 text-foreground" />
                </button>
                <div>
                  <h1 className="text-sm xxxs:text-base xs:text-lg sm:text-xl font-bold text-foreground uppercase tracking-wide">CRYPTO</h1>
                  <p className="text-primary text-[10px] xxxs:text-xs xs:text-sm sm:text-base font-medium">Tron,USDT</p>
                </div>
              </div>

              {/* Note Box */}
              <div className="mb-4 xxxs:mb-5 xs:mb-6 sm:mb-8 p-3 xxxs:p-4 xs:p-5 sm:p-6 bg-muted/30 border-l-4 border-destructive/60 rounded-r-md xxxs:rounded-r-lg">
                <div className="flex items-start gap-2 xxxs:gap-2.5 xs:gap-3 mb-2 xxxs:mb-2.5 xs:mb-3">
                  <AlertCircle className="h-4 w-4 xxxs:h-4.5 xxxs:w-4.5 xs:h-5 xs:w-5 sm:h-5 sm:w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <span className="text-xs xxxs:text-sm xs:text-base sm:text-lg font-semibold text-destructive">Note</span>
                </div>
                <div className="pl-6 xxxs:pl-7 xs:pl-8 space-y-1 xxxs:space-y-1.5 xs:space-y-2">
                  <p className="text-[10px] xxxs:text-xs xs:text-sm sm:text-base text-primary">
                    Payment should be complete it given time
                  </p>
                  <p className="text-[10px] xxxs:text-xs xs:text-sm sm:text-base text-primary">
                    Pay Only given address
                  </p>
                  <p className="text-[10px] xxxs:text-xs xs:text-sm sm:text-base text-primary">
                    Before paying please check the payment address and network
                  </p>
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-3 xxxs:mb-4 xs:mb-5 sm:mb-6">
                <Input
                  inputSize="lg"
                  type="number"
                  placeholder="Enter Amount"
                  value={cryptoAmount}
                  onChange={(e) => setCryptoAmount(e.target.value)}
                  className="w-full border-border bg-background focus:bg-background placeholder:text-muted-foreground text-xs xxxs:text-sm xs:text-base sm:text-lg h-10 xxxs:h-11 xs:h-12 sm:h-14 px-3 xxxs:px-4 xs:px-5 rounded-md xxxs:rounded-lg"
                  min={100}
                  disabled={initiatingCrypto}
                />
              </div>

              {/* Minimum Deposit Text */}
              <p className="text-center text-xs xxxs:text-sm xs:text-base sm:text-lg text-primary font-semibold mb-4 xxxs:mb-5 xs:mb-6 sm:mb-8">
                Minimum Deposit is 100 rs
              </p>

              {/* Pay Button */}
              <Button
                onClick={handleCryptoPayment}
                disabled={initiatingCrypto}
                variant="outline"
                className="rounded-md xxxs:rounded-lg px-4 xxxs:px-5 xs:px-6 sm:px-8 py-2 xxxs:py-2.5 xs:py-3 h-9 xxxs:h-10 xs:h-11 sm:h-12 border-[#706ef1] text-[#706ef1] bg-transparent hover:bg-[#706ef1] hover:text-white transition-colors font-medium text-xs xxxs:text-sm xs:text-base sm:text-lg gap-2"
              >
                {initiatingCrypto ? (
                  <>
                    <Loader2 className="h-4 w-4 xxxs:h-4.5 xxxs:w-4.5 xs:h-5 xs:w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 xxxs:h-4.5 xxxs:w-4.5 xs:h-5 xs:w-5" />
                    Pay
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // UPI Payment View
  if (activeView === 'upi') {
    return (
      <DashboardLayout balance={balance}>
        {user?.is_banned && <BannedUserOverlay />}
        <div className="flex w-full items-start justify-center pt-2 sm:pt-4 md:pt-6">
          <Card className="bg-card border border-border rounded-lg sm:rounded-xl shadow-sm w-full max-w-[calc(100%-0.5rem)] sm:max-w-md lg:max-w-xl">
            <div className="p-2 xxxs:p-2.5 xs:p-3 sm:p-5 md:p-6 lg:p-8">
              {/* Header with back button */}
              <div className="flex items-center gap-1 xxxs:gap-1.5 xs:gap-2 sm:gap-3 mb-2 xxxs:mb-2.5 xs:mb-3 sm:mb-5 lg:mb-6">
                <button 
                  onClick={() => setActiveView('methods')} 
                  className="p-0.5 xxxs:p-1 xs:p-1.5 sm:p-2 hover:bg-[#f8f9fa] rounded-full transition-colors"
                >
                  <ArrowLeft className="h-3 w-3 xxxs:h-3.5 xxxs:w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-foreground" />
                </button>
                <div>
                  <h1 className="text-[11px] xxxs:text-xs xs:text-sm sm:text-lg font-semibold text-foreground">UPI</h1>
                  <p className="text-[#838093] text-[9px] xxxs:text-[10px] xs:text-xs sm:text-base">Phonepe, Paytm etc</p>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="text-center space-y-1.5 xxxs:space-y-2 xs:space-y-3 sm:space-y-4">
                {/* QR Code */}
                <div className="flex justify-center">
                  {upiSettings?.upi_qr_url ? (
                    <img 
                      src={upiSettings.upi_qr_url} 
                      alt="UPI QR Code" 
                      className="w-40 h-40 xxxs:w-48 xxxs:h-48 xs:w-56 xs:h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 object-contain" 
                    />
                  ) : (
                    <div className="w-40 h-40 xxxs:w-48 xxxs:h-48 xs:w-56 xs:h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground text-xs sm:text-sm">No QR Set</span>
                    </div>
                  )}
                </div>

                {/* UPI ID with Copy */}
                <div className="flex items-center justify-center gap-1 xxxs:gap-1.5 xs:gap-2 flex-wrap px-0.5 xxxs:px-1">
                  <span className="font-mono text-[8px] xxxs:text-[9px] xs:text-[10px] sm:text-sm md:text-base text-foreground font-medium break-all leading-tight">
                    {upiSettings?.upi_id || DEFAULT_UPI_ID}
                  </span>
                  <button
                    onClick={handleCopyUpi}
                    className="p-0.5 xxxs:p-1 xs:p-1.5 hover:bg-[#f8f9fa] rounded-md xxxs:rounded-lg transition-colors flex-shrink-0"
                    aria-label="Copy UPI ID"
                  >
                    {upiCopied ? (
                      <Check className="h-2.5 w-2.5 xxxs:h-3 xxxs:w-3 xs:h-3.5 xs:w-3.5 sm:h-5 sm:w-5 text-emerald-600" />
                    ) : (
                      <Copy className="h-2.5 w-2.5 xxxs:h-3 xxxs:w-3 xs:h-3.5 xs:w-3.5 sm:h-5 sm:w-5 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {/* Minimum Deposit */}
                <p className="text-[9px] xxxs:text-[10px] xs:text-xs sm:text-base text-primary font-medium">Minimum Deposit is ₹{upiSettings?.min_recharge || 10}</p>

                {/* UTR Input */}
                <div className="space-y-1.5 xxxs:space-y-2 xs:space-y-3 pt-0.5 xxxs:pt-1 xs:pt-2">
                  <Input
                    inputSize="lg"
                    placeholder="UTR Number / Transaction ID"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="border-[#e0e0e0] bg-white focus:bg-white placeholder:text-[#9ca3af] text-[10px] xxxs:text-[11px] xs:text-xs sm:text-base h-7 xxxs:h-8 xs:h-9 sm:h-11"
                    maxLength={30}
                  />

                  <Button
                    onClick={handleAddMoney}
                    disabled={verifyingUtr}
                    variant="outline"
                    className="rounded-sm xxxs:rounded-md xs:rounded-lg px-2 xxxs:px-3 xs:px-4 sm:px-6 py-1.5 xxxs:py-2 xs:py-2.5 h-6 xxxs:h-7 xs:h-8 sm:h-10 md:h-11 border-[#706ef1] text-[#706ef1] bg-transparent hover:bg-[#706ef1] hover:text-white transition-colors font-medium text-[9px] xxxs:text-[10px] xs:text-xs sm:text-base"
                  >
                    {verifyingUtr ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Add Money'
                    )}
                  </Button>
                </div>

                {/* Rotating Notes - Swipeable */}
                <div 
                  className="mt-1.5 xxxs:mt-2 xs:mt-3 sm:mt-4 p-1.5 xxxs:p-2 xs:p-2.5 sm:p-4 bg-blue-50 border border-blue-200 rounded-sm xxxs:rounded-md xs:rounded-lg overflow-hidden cursor-grab active:cursor-grabbing select-none"
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    (e.currentTarget as any).startX = touch.clientX;
                  }}
                  onTouchEnd={(e) => {
                    const touch = e.changedTouches[0];
                    const startX = (e.currentTarget as any).startX;
                    const diff = touch.clientX - startX;
                    if (Math.abs(diff) > 50) {
                      if (diff > 0) {
                        setCurrentNoteIndex((prev) => (prev - 1 + upiNotes.length) % upiNotes.length);
                      } else {
                        setCurrentNoteIndex((prev) => (prev + 1) % upiNotes.length);
                      }
                    }
                  }}
                  onMouseDown={(e) => {
                    (e.currentTarget as any).startX = e.clientX;
                    (e.currentTarget as any).isDragging = true;
                  }}
                  onMouseUp={(e) => {
                    if (!(e.currentTarget as any).isDragging) return;
                    const startX = (e.currentTarget as any).startX;
                    const diff = e.clientX - startX;
                    if (Math.abs(diff) > 50) {
                      if (diff > 0) {
                        setCurrentNoteIndex((prev) => (prev - 1 + upiNotes.length) % upiNotes.length);
                      } else {
                        setCurrentNoteIndex((prev) => (prev + 1) % upiNotes.length);
                      }
                    }
                    (e.currentTarget as any).isDragging = false;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as any).isDragging = false;
                  }}
                >
                  <div className="flex items-start gap-1 xxxs:gap-1.5 xs:gap-2">
                    <AlertCircle className="h-2.5 w-2.5 xxxs:h-3 xxxs:w-3 xs:h-3.5 xs:w-3.5 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="relative flex-1 min-h-[3.5rem] xs:min-h-[4rem] sm:min-h-[2.5rem]">
                      {upiNotes.map((note, index) => (
                        <p
                          key={index}
                          className={`text-[8px] xxxs:text-[9px] xs:text-[10px] sm:text-sm text-blue-700 text-left leading-snug xxxs:leading-relaxed transition-all duration-500 ${
                            index === currentNoteIndex 
                              ? 'opacity-100 translate-y-0' 
                              : 'opacity-0 absolute top-0 left-0 translate-y-2 pointer-events-none'
                          }`}
                        >
                          {note}
                        </p>
                      ))}
                    </div>
                  </div>
                  {/* Dots indicator */}
                  <div className="flex justify-center gap-1 xxxs:gap-1.5 xs:gap-2 mt-1.5 xxxs:mt-2 xs:mt-3">
                    {upiNotes.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentNoteIndex(index)}
                        className={`w-1 h-1 xxxs:w-1.5 xxxs:h-1.5 xs:w-2 xs:h-2 rounded-full transition-all duration-300 ${
                          index === currentNoteIndex 
                            ? 'bg-blue-600 scale-125' 
                            : 'bg-blue-300 hover:bg-blue-400'
                        }`}
                        aria-label={`Note ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Promo Code Page View
  if (activeView === 'promo') {
    return <DashboardLayout balance={balance}>
        {user?.is_banned && <BannedUserOverlay />}
        <PromoCodeCelebration 
          show={showCelebration} 
          amount={celebrationAmount} 
          onComplete={handleCelebrationComplete} 
        />
        <div className="flex w-full items-start justify-center pt-2 sm:pt-4 md:pt-6">
          <Card className="bg-card border border-border rounded-lg sm:rounded-xl shadow-sm w-full max-w-[calc(100%-0.5rem)] sm:max-w-md lg:max-w-xl">
            <div className="p-2 xxxs:p-2.5 xs:p-3 sm:p-5 md:p-6 lg:p-8">
              {/* Header with back button */}
              <div className="flex items-center gap-1 xxxs:gap-1.5 xs:gap-2 sm:gap-3 mb-2 xxxs:mb-2.5 xs:mb-3 sm:mb-5 lg:mb-6">
                <button onClick={() => setActiveView('methods')} className="p-0.5 xxxs:p-1 xs:p-1.5 sm:p-2 hover:bg-[#f8f9fa] rounded-full transition-colors">
                  <ArrowLeft className="h-3 w-3 xxxs:h-3.5 xxxs:w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-foreground" />
                </button>
                <div>
                  <h1 className="text-[11px] xxxs:text-xs xs:text-sm sm:text-lg font-semibold text-foreground">Promocode</h1>
                  <p className="text-[#838093] text-[9px] xxxs:text-[10px] xs:text-xs sm:text-base">gift card.</p>
                </div>
              </div>

              {redeemSuccess ? <div className="py-2 xxxs:py-3 xs:py-4 sm:py-6 lg:py-8 text-center">
                  <div className="w-8 h-8 xxxs:w-10 xxxs:h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto mb-2 xxxs:mb-2.5 xs:mb-3 sm:mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 xxxs:w-5 xxxs:h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-sm xxxs:text-base xs:text-lg sm:text-xl font-bold text-foreground mb-1">Success!</h3>
                  <p className="text-base xxxs:text-lg xs:text-xl sm:text-2xl font-bold text-emerald-600 mb-1 xxxs:mb-2">₹{redeemSuccess.amount}</p>
                  <p className="text-[9px] xxxs:text-[10px] xs:text-xs sm:text-sm text-muted-foreground">has been added to your balance</p>
                  <Button onClick={handleDone} className="mt-2 xxxs:mt-3 xs:mt-4 sm:mt-6 rounded-md xxxs:rounded-lg xs:rounded-xl bg-[#706ef1] hover:bg-[#5a5cd8] text-white text-[10px] xxxs:text-xs xs:text-sm sm:text-base h-7 xxxs:h-8 xs:h-9 sm:h-10">
                    Apply Another Code
                  </Button>
                </div> : <>
                  {/* Gift card image */}
                  <div className="flex justify-center mb-0.5 xxxs:mb-1 xs:mb-1.5 sm:mb-2 lg:mb-3">
                    <OptimizedImage src={giftCardImg} alt="Gift Card" className="w-16 h-16 xxxs:w-20 xxxs:h-20 xs:w-24 xs:h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 2xl:w-64 2xl:h-64 rounded-md xxxs:rounded-lg" priority />
                  </div>

                  {/* Promo code input section */}
                  <div className="space-y-1.5 xxxs:space-y-2 xs:space-y-3">
                    <h2 className="text-center text-[10px] xxxs:text-xs xs:text-sm sm:text-base font-medium text-foreground">
                      Enter Your PromoCode
                    </h2>

                    <div className="w-full">
                      <Input inputSize="lg" placeholder="Code" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} className="font-mono uppercase text-amber-700 border-[#e0e0e0] bg-white focus:bg-white placeholder:text-[#9ca3af] placeholder:font-normal placeholder:not-italic placeholder:normal-case text-[10px] xxxs:text-[11px] xs:text-xs sm:text-base h-7 xxxs:h-8 xs:h-9 sm:h-11" maxLength={14} disabled={redeeming} />
                    </div>

                    <div>
                      <Button onClick={handleRedeemPromo} disabled={redeeming} variant="outline" className="rounded-sm xxxs:rounded-md xs:rounded-lg px-2 xxxs:px-3 xs:px-4 sm:px-6 py-1.5 xxxs:py-2 xs:py-2.5 h-6 xxxs:h-7 xs:h-8 sm:h-10 md:h-11 border-[#706ef1] text-[#706ef1] bg-transparent hover:bg-[#706ef1] hover:text-white transition-colors font-medium text-[9px] xxxs:text-[10px] xs:text-xs sm:text-base">
                        {redeeming ? <>
                            <Loader2 className="w-2.5 h-2.5 xxxs:w-3 xxxs:h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 mr-1 xxxs:mr-1.5 xs:mr-2 animate-spin" />
                            Applying...
                          </> : 'Apply'}
                      </Button>
                    </div>
                  </div>
                </>}
            </div>
          </Card>
        </div>
      </DashboardLayout>;
  }
  return <DashboardLayout balance={balance}>
      {user?.is_banned && <BannedUserOverlay />}
      <div className="mx-auto w-full max-w-[50rem] space-y-3 xxxs:space-y-4 xs:space-y-5 sm:space-y-6">
        <Card className="bg-[#ffffff] border border-[#f5f5f5] p-2 xxxs:p-3 xs:p-4 sm:p-6 rounded-md xxxs:rounded-lg xs:rounded-xl shadow-sm w-full">
          <h2 className="text-sm xxxs:text-base xs:text-lg font-semibold text-foreground mb-2 xxxs:mb-3 xs:mb-4">Recharge Methods</h2>
          
          <div className="space-y-1 xxxs:space-y-1.5 xs:space-y-2">
            {rechargeMethods.map(method => <div key={method.id}>
                <button onClick={() => handleMethodClick(method.id)} className="w-full flex items-center justify-between p-2 xxxs:p-2.5 xs:p-3 sm:p-4 rounded-md xxxs:rounded-lg bg-[#f8f9fa] hover:bg-[#f0f1f3] transition-colors duration-200 group">
                  <div className="flex items-center gap-2 xxxs:gap-2.5 xs:gap-3 sm:gap-4">
                    <div className="flex-shrink-0">
                      <OptimizedImage src={method.icon} alt={method.title} className="h-6 w-6 xxxs:h-7 xxxs:w-7 xs:h-8 xs:w-8 sm:h-10 sm:w-10 rounded-full" priority />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground text-[11px] xxxs:text-xs xs:text-sm sm:text-base">{method.title}</p>
                      <p className="text-[9px] xxxs:text-[10px] xs:text-xs sm:text-sm text-primary">{method.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-3 w-3 xxxs:h-3.5 xxxs:w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-primary transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>)}
          </div>
        </Card>
      </div>
    </DashboardLayout>;
}