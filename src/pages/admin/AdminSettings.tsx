import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Smartphone, Chrome, MessageCircle, Shield, Key, 
  Bell, Globe, Mail, Save, ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminSettings() {
  const navigate = useNavigate();
  const { resolvedTheme } = useAdminTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <AdminLayout title="Settings">
      <div className="max-w-4xl space-y-8">
        {/* Back Button - Premium Style */}
        <button
          onClick={() => navigate('/admin')}
          className={cn(
            "group flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300",
            isDark 
              ? "bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700/50 hover:border-gray-600 shadow-lg shadow-black/20" 
              : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 shadow-lg shadow-gray-200/50 hover:shadow-xl"
          )}
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Admin Console
        </button>
        {/* Login Options */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Login Options
            </CardTitle>
            <CardDescription>Configure authentication methods for users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <Chrome className="w-5 h-5" />
                </div>
                <div>
                  <Label className="text-base">Google Login</Label>
                  <p className="text-sm text-muted-foreground">Allow users to login with Google</p>
                </div>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-100 text-sky-600">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <Label className="text-base">Telegram Login</Label>
                  <p className="text-sm text-muted-foreground">Allow users to login with Telegram</p>
                </div>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <Label className="text-base">Multi-device Login</Label>
                  <p className="text-sm text-muted-foreground">Allow users to login from multiple devices</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Settings
            </CardTitle>
            <CardDescription>Configure security options for the platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Session Timeout</Label>
                <p className="text-sm text-muted-foreground">Auto logout after inactivity</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">IP Whitelisting</Label>
                <p className="text-sm text-muted-foreground">Restrict admin access to specific IPs</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Telegram Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates via Telegram bot</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Browser push notifications</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Website Settings */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Website Settings
            </CardTitle>
            <CardDescription>General website configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Website Name</Label>
              <Input placeholder="OTP Buy" className="mt-1.5" />
            </div>
            <div>
              <Label>Support Email</Label>
              <Input type="email" placeholder="support@example.com" className="mt-1.5" />
            </div>
            <div>
              <Label>Contact Number</Label>
              <Input placeholder="+91 9876543210" className="mt-1.5" />
            </div>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 mt-4">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
