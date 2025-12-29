import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Zap, Copy, Check, Loader2, QrCode, AlertCircle, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCustomToast } from '@/components/ui/custom-toast';

interface AutoPaymentSettings {
  upi_id: string;
  payee_name: string;
  min_recharge: number;
  max_pending_minutes: number;
  is_active: boolean;
}

interface InitiatedOrder {
  order_id: string;
  amount: number;
  upi_url: string;
  qr_url: string;
  txn_token: string | null;
  paytm_checkout_url?: string;
  fallback?: boolean;
}

type PaymentStatus = 'idle' | 'initiating' | 'waiting' | 'checking' | 'success' | 'failed' | 'timeout';

export default function AutoPayment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useCustomToast();
  
  const [settings, setSettings] = useState<AutoPaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [order, setOrder] = useState<InitiatedOrder | null>(null);
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchSettings();
    return () => {
      stopPolling();
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await supabase.functions.invoke('paytm-verify', {
        body: { action: 'get_settings' }
      });

      if (response.error) throw response.error;
      
      if (response.data?.success && response.data?.settings) {
        setSettings(response.data.settings);
      } else {
        showToast(response.data?.error || 'Auto payment not available', 'error');
      }
    } catch (error: any) {
      console.error('Failed to fetch settings:', error);
      showToast('Failed to load payment settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async () => {
    if (!settings || !amount || !user?.id) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < settings.min_recharge) {
      showToast(`Minimum amount is ₹${settings.min_recharge}`, 'error');
      return;
    }

    setPaymentStatus('initiating');

    try {
      const response = await supabase.functions.invoke('paytm-initiate', {
        body: { 
          user_id: user.id,
          amount: amountNum
        }
      });

      if (response.error) throw response.error;

      if (!response.data?.success) {
        showToast(response.data?.error || 'Failed to initiate payment', 'error');
        setPaymentStatus('idle');
        return;
      }

      const orderData: InitiatedOrder = {
        order_id: response.data.order_id,
        amount: response.data.amount,
        upi_url: response.data.upi_url,
        qr_url: response.data.qr_url,
        txn_token: response.data.txn_token,
        paytm_checkout_url: response.data.paytm_checkout_url,
        fallback: response.data.fallback
      };

      setOrder(orderData);
      setPaymentStatus('waiting');
      
      // Start countdown timer
      const totalSeconds = settings.max_pending_minutes * 60;
      setTimeRemaining(totalSeconds);
      
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Start polling for payment status after a short delay
      setTimeout(() => {
        startPolling(orderData.order_id, amountNum, totalSeconds);
      }, 5000); // Wait 5 seconds before first check

    } catch (error: any) {
      console.error('Failed to initiate payment:', error);
      showToast('Failed to initiate payment', 'error');
      setPaymentStatus('idle');
    }
  };

  const startPolling = (orderId: string, amountNum: number, timeoutSeconds: number) => {
    const startTime = Date.now();
    
    pollingRef.current = setInterval(async () => {
      const elapsed = (Date.now() - startTime) / 1000;
      
      if (elapsed >= timeoutSeconds) {
        stopPolling();
        setPaymentStatus('timeout');
        setStatusMessage('Payment verification timed out');
        return;
      }

      setPaymentStatus('checking');
      
      try {
        const response = await supabase.functions.invoke('paytm-verify', {
          body: {
            action: 'check_status',
            order_id: orderId,
            amount: amountNum,
            user_id: user?.id
          }
        });

        if (response.data?.success && response.data?.status === 'TXN_SUCCESS') {
          stopPolling();
          setPaymentStatus('success');
          setStatusMessage(`Payment successful! UTR: ${response.data.utr}`);
          showToast(`₹${amountNum} added to your wallet!`, 'success');
          
          setTimeout(() => navigate('/recharge'), 3000);
          return;
        }

        if (response.data?.status === 'TXN_FAILURE') {
          stopPolling();
          setPaymentStatus('failed');
          setStatusMessage(response.data?.message || 'Payment failed. Please try again.');
          return;
        }

        // Still pending
        setPaymentStatus('waiting');
        setStatusMessage('Waiting for payment confirmation...');
      } catch (error) {
        console.error('Status check error:', error);
        setPaymentStatus('waiting');
      }
    }, 4000); // Check every 4 seconds
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleCopyUpi = async () => {
    if (!settings?.upi_id) return;
    try {
      await navigator.clipboard.writeText(settings.upi_id);
      setCopied(true);
      showToast('UPI ID copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  const handleOpenPaytm = () => {
    if (order?.paytm_checkout_url) {
      window.open(order.paytm_checkout_url, '_blank');
    }
  };

  const resetPayment = () => {
    stopPolling();
    setPaymentStatus('idle');
    setOrder(null);
    setStatusMessage('');
    setTimeRemaining(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!settings || !settings.is_active) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <XCircle className="h-16 w-16 text-destructive" />
          <h2 className="text-xl font-semibold">Auto Payment Not Available</h2>
          <p className="text-muted-foreground text-center">
            This payment method is currently disabled. Please try another method.
          </p>
          <Button onClick={() => navigate('/recharge')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Recharge
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/recharge')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Auto Payment</h1>
              <p className="text-muted-foreground text-sm">Paytm Payment Gateway</p>
            </div>
          </div>
        </div>

        {paymentStatus === 'idle' ? (
          /* Amount Input View */
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Enter Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  min={settings.min_recharge}
                  placeholder={`Min ₹${settings.min_recharge}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum deposit: ₹{settings.min_recharge}
                </p>
              </div>

              <Button 
                onClick={initiatePayment} 
                className="w-full"
                disabled={!amount || parseFloat(amount) < settings.min_recharge}
              >
                <QrCode className="mr-2 h-4 w-4" />
                Generate Payment
              </Button>
            </CardContent>
          </Card>
        ) : paymentStatus === 'initiating' ? (
          /* Initiating View */
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-lg font-medium">Creating payment order...</p>
                <p className="text-sm text-muted-foreground">Please wait</p>
              </div>
            </CardContent>
          </Card>
        ) : order && (
          /* QR Code & Status View */
          <div className="space-y-4">
            {/* QR Code Card */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="text-center">
                  <p className="text-lg font-semibold">Amount: ₹{order.amount}</p>
                  <p className="text-sm text-muted-foreground">Order: {order.order_id}</p>
                </div>

                {order.qr_url && (
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-xl">
                      <img src={order.qr_url} alt="Payment QR Code" className="w-48 h-48" loading="eager" />
                    </div>
                  </div>
                )}

                {/* UPI ID */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <span className="flex-1 font-mono text-sm truncate">{settings.upi_id}</span>
                  <Button variant="ghost" size="sm" onClick={handleCopyUpi}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Paytm Checkout Button */}
                {order.paytm_checkout_url && !order.fallback && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleOpenPaytm}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Paytm Checkout
                  </Button>
                )}

                {/* Fallback Notice */}
                {order.fallback && (
                  <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      Using direct UPI payment. Scan QR with any UPI app.
                    </p>
                  </div>
                )}

                {/* Timer */}
                {timeRemaining > 0 && (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Time remaining: {formatTime(timeRemaining)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card className={cn(
              "border-2 transition-colors",
              paymentStatus === 'success' && "border-green-500 bg-green-500/10",
              paymentStatus === 'failed' && "border-destructive bg-destructive/10",
              paymentStatus === 'timeout' && "border-yellow-500 bg-yellow-500/10",
              (paymentStatus === 'waiting' || paymentStatus === 'checking') && "border-primary/50"
            )}>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-3">
                  {(paymentStatus === 'waiting' || paymentStatus === 'checking') && (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-center font-medium">
                        {paymentStatus === 'checking' ? 'Verifying payment...' : 'Waiting for payment...'}
                      </p>
                      {statusMessage && (
                        <p className="text-sm text-muted-foreground text-center">{statusMessage}</p>
                      )}
                    </>
                  )}

                  {paymentStatus === 'success' && (
                    <>
                      <CheckCircle2 className="h-12 w-12 text-green-500" />
                      <p className="text-center font-medium text-green-600">{statusMessage}</p>
                    </>
                  )}

                  {paymentStatus === 'failed' && (
                    <>
                      <XCircle className="h-12 w-12 text-destructive" />
                      <p className="text-center font-medium text-destructive">{statusMessage}</p>
                    </>
                  )}

                  {paymentStatus === 'timeout' && (
                    <>
                      <AlertCircle className="h-12 w-12 text-yellow-500" />
                      <p className="text-center font-medium text-yellow-600">{statusMessage}</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {(paymentStatus === 'failed' || paymentStatus === 'timeout') && (
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => navigate('/recharge')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button className="flex-1" onClick={resetPayment}>
                  Try Again
                </Button>
              </div>
            )}

            {/* Instructions */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">Payment Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Scan QR code or open Paytm checkout</li>
                    <li>Complete payment of ₹{order.amount}</li>
                    <li>Wait for automatic verification</li>
                    <li>Balance will be credited instantly</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
