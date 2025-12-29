import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2, Save, Zap, QrCode, IndianRupee, CreditCard, Shield, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCustomToast } from '@/components/ui/custom-toast';

interface AutoPaymentSettings {
  upi_id: string;
  merchant_mid: string;
  payee_name: string;
  min_recharge: number;
  max_pending_minutes: number;
  is_active: boolean;
}

const defaultSettings: AutoPaymentSettings = {
  upi_id: '',
  merchant_mid: '',
  payee_name: 'Payment Receiver',
  min_recharge: 10,
  max_pending_minutes: 10,
  is_active: false
};

export default function AdminAutoPaymentSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast, updateToast } = useCustomToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AutoPaymentSettings>(defaultSettings);

  useEffect(() => {
    fetchSettings();
  }, [user?.id]);

  const fetchSettings = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase.rpc('get_app_setting', {
        p_setting_key: 'auto_payment_settings'
      });

      if (error) throw error;

      if (data && typeof data === 'object') {
        const settingData = data as Record<string, unknown>;
        
        if ('success' in settingData && settingData.success && 'setting' in settingData) {
          const setting = settingData.setting as { setting_value?: AutoPaymentSettings };
          if (setting?.setting_value) {
            setSettings({ ...defaultSettings, ...setting.setting_value });
          }
        } else if ('setting_value' in settingData) {
          setSettings({ ...defaultSettings, ...(settingData.setting_value as AutoPaymentSettings) });
        } else if ('upi_id' in settingData || 'merchant_mid' in settingData) {
          setSettings({ ...defaultSettings, ...(settingData as unknown as AutoPaymentSettings) });
        }
      }
    } catch (error: any) {
      console.log('No auto payment settings found, using defaults');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    const toastId = showToast('Saving settings...', 'loading', true);

    try {
      const { data, error } = await supabase.rpc('update_app_setting', {
        p_user_id: user.id,
        p_setting_key: 'auto_payment_settings',
        p_setting_value: JSON.parse(JSON.stringify(settings))
      });

      if (error) throw error;

      const result = data as unknown as { success: boolean; error?: string };
      
      if (result.success) {
        updateToast(toastId, 'Settings saved successfully', 'success');
      } else {
        updateToast(toastId, result.error || 'Failed to save', 'error');
      }
    } catch (error: any) {
      updateToast(toastId, error.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/admin/payments')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Auto Payment Settings</h1>
              <p className="text-muted-foreground text-sm">Configure Paytm UPI Auto Verification</p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-600 dark:text-blue-400">Simple Setup</p>
            <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
              Only requires Paytm Merchant ID (MID) and UPI VPA. No merchant secret key needed!
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Paytm Merchant Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                Paytm Merchant Credentials
              </CardTitle>
              <CardDescription>
                Get the MID from your Paytm Business Dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="merchant_mid">Merchant ID (MID)</Label>
                <Input
                  id="merchant_mid"
                  placeholder="e.g., MgjdFH15397320634096"
                  value={settings.merchant_mid}
                  onChange={(e) => setSettings(prev => ({ ...prev, merchant_mid: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Your Paytm Merchant ID used for transaction verification
                </p>
              </div>
            </CardContent>
          </Card>

          {/* UPI Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <QrCode className="h-5 w-5 text-primary" />
                UPI & Display Details
              </CardTitle>
              <CardDescription>
                Configure the UPI ID and payee name shown to users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="upi_id">UPI ID (VPA)</Label>
                  <Input
                    id="upi_id"
                    placeholder="e.g., paytmqr2810050501011s25rtxh7ixy@paytm"
                    value={settings.upi_id}
                    onChange={(e) => setSettings(prev => ({ ...prev, upi_id: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your Paytm QR VPA for receiving payments
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payee_name">Payee Name</Label>
                  <Input
                    id="payee_name"
                    placeholder="Payment Receiver"
                    value={settings.payee_name}
                    onChange={(e) => setSettings(prev => ({ ...prev, payee_name: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Display name shown in UPI apps
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <IndianRupee className="h-5 w-5 text-primary" />
                Payment Settings
              </CardTitle>
              <CardDescription>
                Configure payment limits and enable/disable auto payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="min_recharge">Minimum Recharge Amount (₹)</Label>
                  <Input
                    id="min_recharge"
                    type="number"
                    min={1}
                    placeholder="10"
                    value={settings.min_recharge}
                    onChange={(e) => setSettings(prev => ({ ...prev, min_recharge: Number(e.target.value) || 10 }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max_pending_minutes">Payment Timeout (minutes)</Label>
                  <Input
                    id="max_pending_minutes"
                    type="number"
                    min={1}
                    max={30}
                    placeholder="10"
                    value={settings.max_pending_minutes}
                    onChange={(e) => setSettings(prev => ({ ...prev, max_pending_minutes: Number(e.target.value) || 10 }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Enable Auto Payment
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Toggle Paytm auto payment verification
                  </p>
                </div>
                <Switch
                  checked={settings.is_active}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={saving}
            size="lg"
            className="w-full sm:w-auto sm:min-w-[200px] sm:mx-auto"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
