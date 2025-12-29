import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2, Save, CreditCard, QrCode, Key, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCustomToast } from '@/components/ui/custom-toast';

interface UpiSettings {
  upi_id: string;
  upi_qr_url: string;
  merchant_id: string;
  merchant_token: string;
  min_recharge: number;
  is_active: boolean;
}

export default function AdminBharatPeSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast, updateToast } = useCustomToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UpiSettings>({
    upi_id: '',
    upi_qr_url: '',
    merchant_id: '',
    merchant_token: '',
    min_recharge: 10,
    is_active: true
  });

  useEffect(() => {
    fetchSettings();
  }, [user?.id]);

  const fetchSettings = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase.rpc('admin_get_upi_settings', {
        p_admin_id: user.id
      });

      if (error) throw error;

      const result = data as unknown as { success: boolean; error?: string; settings?: UpiSettings };
      
      if (result.success && result.settings) {
        setSettings(result.settings);
      } else if (result.error) {
        showToast(result.error, 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    const toastId = showToast('Saving settings...', 'loading', true);

    try {
      const { data, error } = await supabase.rpc('admin_update_upi_settings', {
        p_admin_id: user.id,
        p_upi_id: settings.upi_id,
        p_upi_qr_url: settings.upi_qr_url,
        p_merchant_id: settings.merchant_id,
        p_merchant_token: settings.merchant_token,
        p_min_recharge: settings.min_recharge,
        p_is_active: settings.is_active
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">BharatPe Settings</h1>
              <p className="text-muted-foreground text-sm">Configure UPI payment gateway</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* UPI Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <QrCode className="h-5 w-5 text-primary" />
                UPI Details
              </CardTitle>
              <CardDescription>
                Configure the UPI ID and QR code that users will see
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="upi_id">UPI ID</Label>
                  <Input
                    id="upi_id"
                    placeholder="example@upi"
                    value={settings.upi_id}
                    onChange={(e) => setSettings(prev => ({ ...prev, upi_id: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="upi_qr_url">QR Code URL</Label>
                  <Input
                    id="upi_qr_url"
                    placeholder="https://example.com/qr-code.png"
                    value={settings.upi_qr_url}
                    onChange={(e) => setSettings(prev => ({ ...prev, upi_qr_url: e.target.value }))}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                URL to the QR code image. Leave empty to use the default QR code.
              </p>
            </CardContent>
          </Card>

          {/* BharatPe API Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Key className="h-5 w-5 text-primary" />
                BharatPe API Credentials
              </CardTitle>
              <CardDescription>
                Enter your BharatPe merchant credentials for automatic payment verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="merchant_id">Merchant ID</Label>
                  <Input
                    id="merchant_id"
                    placeholder="Your BharatPe Merchant ID"
                    value={settings.merchant_id}
                    onChange={(e) => setSettings(prev => ({ ...prev, merchant_id: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="merchant_token">Merchant Token</Label>
                  <Input
                    id="merchant_token"
                    type="password"
                    placeholder="Your BharatPe API Token"
                    value={settings.merchant_token}
                    onChange={(e) => setSettings(prev => ({ ...prev, merchant_token: e.target.value }))}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Get these credentials from your BharatPe dashboard under API settings
              </p>
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
                Configure minimum recharge and enable/disable UPI payments
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
                
                <div className="flex items-center justify-between sm:justify-start sm:gap-4 p-3 rounded-lg border bg-muted/30">
                  <div className="space-y-0.5">
                    <Label>Enable UPI Payments</Label>
                    <p className="text-xs text-muted-foreground">
                      Toggle UPI payment option
                    </p>
                  </div>
                  <Switch
                    checked={settings.is_active}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
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