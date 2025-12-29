import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2, Save, Bitcoin, Key, Store, Shield, Info, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCustomToast } from '@/components/ui/custom-toast';

interface CryptoSettings {
  merchant_id: string;
  api_key: string;
  min_recharge: number;
  is_active: boolean;
}

const defaultSettings: CryptoSettings = {
  merchant_id: '',
  api_key: '',
  min_recharge: 10,
  is_active: false
};

export default function AdminCryptoSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast, updateToast } = useCustomToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<CryptoSettings>(defaultSettings);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [user?.id]);

  const fetchSettings = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase.rpc('get_app_setting', {
        p_setting_key: 'cryptomus_settings'
      });

      if (error) throw error;

      if (data && typeof data === 'object') {
        const settingData = data as Record<string, unknown>;
        
        if ('success' in settingData && settingData.success && 'setting' in settingData) {
          const setting = settingData.setting as { setting_value?: CryptoSettings };
          if (setting?.setting_value) {
            setSettings({ ...defaultSettings, ...setting.setting_value });
          }
        } else if ('setting_value' in settingData) {
          setSettings({ ...defaultSettings, ...(settingData.setting_value as CryptoSettings) });
        } else if ('merchant_id' in settingData || 'api_key' in settingData) {
          setSettings({ ...defaultSettings, ...(settingData as unknown as CryptoSettings) });
        }
      }
    } catch (error: any) {
      console.log('No crypto settings found, using defaults');
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
        p_setting_key: 'cryptomus_settings',
        p_setting_value: JSON.parse(JSON.stringify(settings))
      });

      if (error) throw error;

      const result = data as unknown as { success: boolean; error?: string };
      
      if (result.success) {
        updateToast(toastId, 'Cryptomus settings saved successfully', 'success');
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center shrink-0">
              <Bitcoin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Crypto Payment Settings</h1>
              <p className="text-muted-foreground text-sm">Configure Cryptomus Payment Gateway</p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-start gap-3">
          <Info className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-orange-600 dark:text-orange-400">Cryptomus Integration</p>
            <p className="text-sm text-orange-600/80 dark:text-orange-400/80">
              Get your Merchant ID and API Key from the Cryptomus dashboard at cryptomus.com
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Merchant Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Store className="h-5 w-5 text-primary" />
                Merchant Credentials
              </CardTitle>
              <CardDescription>
                Enter your Cryptomus merchant credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="merchant_id">Merchant ID</Label>
                <Input
                  id="merchant_id"
                  placeholder="e.g., abc123-def456-ghi789"
                  value={settings.merchant_id}
                  onChange={(e) => setSettings(prev => ({ ...prev, merchant_id: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Your unique Cryptomus Merchant ID
                </p>
              </div>
            </CardContent>
          </Card>

          {/* API Key Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Key className="h-5 w-5 text-primary" />
                API Key
              </CardTitle>
              <CardDescription>
                Your secret API key for payment processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api_key">API Key</Label>
                <div className="relative">
                  <Input
                    id="api_key"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="Enter your Cryptomus API Key"
                    value={settings.api_key}
                    onChange={(e) => setSettings(prev => ({ ...prev, api_key: e.target.value }))}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Keep this key secure. It's used to authenticate payment requests.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bitcoin className="h-5 w-5 text-primary" />
                Payment Settings
              </CardTitle>
              <CardDescription>
                Configure payment limits and enable/disable crypto payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Enable Crypto Payments
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Toggle Cryptomus payment gateway
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
