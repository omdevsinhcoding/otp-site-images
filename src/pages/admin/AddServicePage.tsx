import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { 
  ArrowLeft, Package, ChevronDown, Check, Server, 
  Image, Tag, IndianRupee, Clock, Star, Loader2, Wand2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LogoFinderDialog } from '@/components/admin/LogoFinderDialog';
import { ServiceMatchDialog } from '@/components/admin/ServiceMatchDialog';
import { DEFAULT_SERVICE_ICON } from '@/lib/logoUtils';

interface SmsServer {
  id: string;
  server_name: string;
  country_name: string;
  country_flag: string | null;
  country_code: string;
  is_active: boolean;
  source_table?: 'sms_servers' | 'auto_sms_servers';
}

interface ServiceFormData {
  serverId: string;
  serviceName: string;
  logoUrl: string;
  serviceCode: string;
  basePrice: number;
  marginPercentage: number;
  cancelDisableTime: number;
  isPopular: boolean;
}

function AddServiceContent() {
  const navigate = useNavigate();
  const { resolvedTheme } = useAdminTheme();
  const isDark = resolvedTheme === 'dark';
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingServers, setIsLoadingServers] = useState(true);
  const [servers, setServers] = useState<SmsServer[]>([]);
  const [serverOpen, setServerOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<SmsServer | null>(null);
  const [isAutoLogo, setIsAutoLogo] = useState(false);
  const [logoFinderOpen, setLogoFinderOpen] = useState(false);
  const [serviceMatchOpen, setServiceMatchOpen] = useState(false);
  const [serverCountryCode, setServerCountryCode] = useState<string>('0');
  
  const [formData, setFormData] = useState<ServiceFormData>({
    serverId: '',
    serviceName: '',
    logoUrl: '',
    serviceCode: '',
    basePrice: 0,
    marginPercentage: 0,
    cancelDisableTime: 0,
    isPopular: false,
  });

  // Fetch servers on mount
  useEffect(() => {
    const fetchServers = async () => {
      try {
        const { data, error } = await supabase.rpc('get_all_sms_servers');
        if (error) throw error;
        const serverList = (data as unknown as SmsServer[]) || [];
        setServers(serverList);
      } catch (err: any) {
        toast({ title: 'Error', description: 'Failed to load servers', variant: 'destructive' });
      } finally {
        setIsLoadingServers(false);
      }
    };
    fetchServers();
  }, [toast]);

  const handleInputChange = (field: keyof ServiceFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleServerSelect = async (server: SmsServer) => {
    setSelectedServer(server);
    setFormData((prev) => ({ ...prev, serverId: server.id }));
    setServerOpen(false);
    
    // Use country_code directly from server object (already fetched from RPC)
    if (server.country_code) {
      setServerCountryCode(server.country_code);
    }
  };

  // Handle service match selection from SmsBower
  const handleServiceMatchConfirm = (service: { code: string; name: string; price: number }) => {
    setFormData((prev) => ({
      ...prev,
      serviceCode: service.code,
      basePrice: service.price,
    }));
    toast({ 
      title: `Service matched: ${service.name}`,
      description: service.price > 0 ? `Base price: ₹${service.price.toFixed(2)}` : 'Set margin to calculate final price'
    });
  };

  // Open Logo Finder dialog
  const handleAutoLogo = () => {
    if (!formData.serviceName.trim()) {
      toast({ title: 'Enter service name first', variant: 'destructive' });
      return;
    }
    setLogoFinderOpen(true);
  };

  // Handle logo selection from dialog - also update service name if provided
  const handleLogoConfirm = (logoUrl: string, serviceName?: string, serviceCode?: string) => {
    setFormData((prev) => ({
      ...prev,
      logoUrl,
      ...(serviceName && { serviceName }),
      ...(serviceCode && { serviceCode }),
    }));
    setIsAutoLogo(true);
    if (serviceName) {
      toast({ title: `Updated: ${serviceName}` });
    } else {
      toast({ title: 'Logo set!' });
    }
  };

  // Calculate final price
  const finalPrice = formData.basePrice + (formData.basePrice * formData.marginPercentage / 100);

  const handleSubmit = async () => {
    if (!user?.id) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      return;
    }

    if (!selectedServer) {
      toast({ title: 'Select Server', description: 'Please select a server first', variant: 'destructive' });
      return;
    }

    if (!formData.serviceName.trim()) {
      toast({ title: 'Service Name Required', variant: 'destructive' });
      return;
    }

    if (!formData.serviceCode.trim()) {
      toast({ title: 'Service Code Required', variant: 'destructive' });
      return;
    }

    if (formData.basePrice <= 0) {
      toast({ title: 'Set Pricing', description: 'Base price must be greater than 0', variant: 'destructive' });
      return;
    }

    if (finalPrice <= 0) {
      toast({ title: 'Invalid Price', description: 'Final selling price must be positive', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    try {
      const { data, error } = await supabase.rpc('admin_add_service', {
        p_admin_id: user.id,
        p_server_id: formData.serverId,
        p_service_name: formData.serviceName,
        p_service_code: formData.serviceCode,
        p_logo_url: formData.logoUrl || null,
        p_base_price: formData.basePrice,
        p_margin_percentage: formData.marginPercentage,
        p_cancel_disable_time: formData.cancelDisableTime,
        p_is_popular: formData.isPopular,
      });

      if (error) throw error;

      const result = data as { success: boolean; data?: any; error?: string };
      
      if (!result.success) {
        toast({ title: 'Error', description: result.error || 'Failed to add service', variant: 'destructive' });
        return;
      }

      toast({ title: 'Success', description: `Service "${result.data?.service_name}" added successfully` });
      navigate('/admin/services');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'An error occurred', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = cn(
    "h-12 rounded-xl border-2 transition-all duration-200 focus:ring-0",
    isDark 
      ? "bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:bg-gray-800" 
      : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500"
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/admin/services')}
          className={cn(
            "flex items-center gap-2 text-sm font-medium transition-colors",
            isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Title Card */}
      <div className={cn(
        "rounded-2xl p-6 mb-6 relative overflow-hidden",
        isDark ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20" 
               : "bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100"
      )}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Package className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
              Add New Service
            </h1>
            <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
              Configure a new service with pricing and settings
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className={cn(
        "rounded-2xl p-6 lg:p-8 shadow-sm",
        isDark ? "bg-gray-800/40 border border-gray-700/50" : "bg-white border border-gray-100"
      )}>
        <div className="space-y-6">
          {/* Server Selection */}
          <div className="space-y-2">
            <Label className={cn("text-sm font-semibold flex items-center gap-2", isDark ? "text-gray-300" : "text-gray-700")}>
              <Server className="w-4 h-4 text-emerald-500" />
              Select Server
            </Label>
            <Popover open={serverOpen} onOpenChange={setServerOpen}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "w-full h-14 px-4 rounded-xl border-2 flex items-center justify-between transition-all",
                    isDark 
                      ? "bg-gray-800/50 border-gray-700 hover:border-gray-600" 
                      : "bg-white border-gray-200 hover:border-gray-300",
                    serverOpen && "border-emerald-500"
                  )}
                  disabled={isLoadingServers}
                >
                  {isLoadingServers ? (
                    <span className={cn("text-sm flex items-center gap-2", isDark ? "text-gray-500" : "text-gray-400")}>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading servers...
                    </span>
                  ) : selectedServer ? (
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{selectedServer.country_flag || '🌍'}</span>
                      <div className="text-left">
                        <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>
                          {selectedServer.server_name}
                        </p>
                        <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                          {selectedServer.country_name}
                        </p>
                      </div>
                      {selectedServer.is_active && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400">
                          Active
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className={cn("text-sm", isDark ? "text-gray-500" : "text-gray-400")}>
                      Select a server...
                    </span>
                  )}
                  <ChevronDown className={cn(
                    "w-5 h-5 transition-transform",
                    serverOpen && "rotate-180",
                    isDark ? "text-gray-400" : "text-gray-500"
                  )} />
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className={cn(
                  "w-[400px] p-0 rounded-xl overflow-hidden shadow-xl",
                  isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                )} 
                align="start"
              >
                <Command className={cn("bg-transparent", isDark ? "bg-gray-800" : "bg-white")}>
                  <CommandList className="max-h-[300px] overflow-y-auto p-2">
                    <CommandEmpty className={cn("py-6 text-center text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                      No servers found. Add a server first.
                    </CommandEmpty>
                    <CommandGroup>
                      {servers.map((server) => (
                        <CommandItem
                          key={server.id}
                          value={server.server_name}
                          onSelect={() => handleServerSelect(server)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer",
                            isDark 
                              ? "hover:bg-gray-700 aria-selected:bg-gray-700" 
                              : "hover:bg-gray-50 aria-selected:bg-gray-50"
                          )}
                        >
                          <span className="text-xl">{server.country_flag || '🌍'}</span>
                          <div className="flex-1">
                            <p className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                              {server.server_name}
                            </p>
                            <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                              {server.country_name}
                            </p>
                          </div>
                          {server.is_active && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400">
                              Active
                            </span>
                          )}
                          {selectedServer?.id === server.id && (
                            <Check className="w-4 h-4 text-emerald-500" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Service Name */}
          <div className="space-y-2">
            <Label className={cn("text-sm font-semibold flex items-center gap-2", isDark ? "text-gray-300" : "text-gray-700")}>
              <Tag className="w-4 h-4 text-emerald-500" />
              Service Name
            </Label>
            <Input
              placeholder="e.g., WhatsApp, Telegram, Instagram"
              value={formData.serviceName}
              onChange={(e) => handleInputChange('serviceName', e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Logo URL with Auto Generate */}
          <div className="space-y-2">
            <Label className={cn("text-sm font-semibold flex items-center gap-2", isDark ? "text-gray-300" : "text-gray-700")}>
              <Image className="w-4 h-4 text-emerald-500" />
              Service Logo URL
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/logo.png"
                value={formData.logoUrl}
                onChange={(e) => {
                  handleInputChange('logoUrl', e.target.value);
                  setIsAutoLogo(false);
                }}
                className={cn(inputClass, "flex-1")}
              />
              <Button
                type="button"
                onClick={handleAutoLogo}
                className={cn(
                  "h-12 px-4 rounded-xl font-medium transition-all",
                  "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/20"
                )}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Auto
              </Button>
            </div>
            {formData.logoUrl && (
              <div className={cn(
                "mt-2 p-2 rounded-lg flex items-center gap-3",
                isDark ? "bg-gray-800/50 border border-gray-700/50" : "bg-gray-50 border border-gray-100"
              )}>
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img 
                    src={formData.logoUrl} 
                    alt="Logo" 
                    className="w-full h-full object-contain p-1"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_SERVICE_ICON;
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-medium truncate", isDark ? "text-gray-300" : "text-gray-700")}>
                    {formData.serviceName || 'Preview'}
                  </p>
                  {formData.serviceCode && (
                    <p className={cn("text-[10px] truncate", isDark ? "text-gray-500" : "text-gray-400")}>
                      {formData.serviceCode}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Service Code */}
          <div className="space-y-2">
            <Label className={cn("text-sm font-semibold flex items-center gap-2", isDark ? "text-gray-300" : "text-gray-700")}>
              <Tag className="w-4 h-4 text-emerald-500" />
              Service Code
            </Label>
            <Input
              placeholder="e.g., wa, tg, ig"
              value={formData.serviceCode}
              onChange={(e) => handleInputChange('serviceCode', e.target.value.toLowerCase().replace(/\s+/g, ''))}
              className={inputClass}
            />
            <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
              Unique identifier for this service (lowercase, no spaces)
            </p>
          </div>

          {/* Pricing Section */}
          <div className={cn(
            "p-5 rounded-xl space-y-4",
            isDark ? "bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20" 
                   : "bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100"
          )}>
            <h3 className={cn("font-semibold flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
              <IndianRupee className="w-4 h-4 text-amber-500" />
              Pricing Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                  Base Price (₹)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.basePrice || ''}
                  onChange={(e) => handleInputChange('basePrice', parseFloat(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                  Margin (%)
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={formData.marginPercentage || ''}
                  onChange={(e) => handleInputChange('marginPercentage', parseFloat(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Final Price Display */}
            <div className={cn(
              "p-4 rounded-lg flex items-center justify-between",
              isDark ? "bg-gray-800/50" : "bg-white"
            )}>
              <span className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                Final Selling Price
              </span>
              <span className={cn(
                "text-2xl font-bold",
                "bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent"
              )}>
                ₹{finalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Cancel/Disable Time */}
          <div className="space-y-2">
            <Label className={cn("text-sm font-semibold flex items-center gap-2", isDark ? "text-gray-300" : "text-gray-700")}>
              <Clock className="w-4 h-4 text-emerald-500" />
              Cancel/Disable Time (minutes)
            </Label>
            <Input
              type="number"
              min="0"
              placeholder="0 (disabled)"
              value={formData.cancelDisableTime || ''}
              onChange={(e) => handleInputChange('cancelDisableTime', parseInt(e.target.value) || 0)}
              className={inputClass}
            />
            <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
              Time after which cancel option is disabled. Set 0 to never disable.
            </p>
          </div>

          {/* Mark as Popular */}
          <div className={cn(
            "p-4 rounded-xl flex items-center justify-between",
            isDark ? "bg-gray-800/50 border border-gray-700" : "bg-gray-50 border border-gray-100"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                formData.isPopular 
                  ? "bg-gradient-to-br from-yellow-400 to-orange-500" 
                  : isDark ? "bg-gray-700" : "bg-gray-200"
              )}>
                <Star className={cn("w-5 h-5", formData.isPopular ? "text-white" : isDark ? "text-gray-400" : "text-gray-500")} />
              </div>
              <div>
                <p className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                  Mark as Popular
                </p>
                <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  Show this service in the popular section
                </p>
              </div>
            </div>
            <Checkbox
              checked={formData.isPopular}
              onCheckedChange={(checked) => handleInputChange('isPopular', checked === true)}
              className={cn(
                "w-6 h-6 rounded-md border-2",
                formData.isPopular 
                  ? "bg-gradient-to-br from-yellow-400 to-orange-500 border-yellow-400" 
                  : isDark ? "border-gray-600" : "border-gray-300"
              )}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className={cn(
              "w-full h-14 rounded-xl font-semibold text-base transition-all",
              "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white",
              "shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
            )}
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Package className="w-5 h-5 mr-2" />
            )}
            {isSaving ? 'Adding Service...' : 'Add Service'}
          </Button>
        </div>
      </div>

      {/* Logo Finder Dialog */}
      <LogoFinderDialog
        open={logoFinderOpen}
        onOpenChange={setLogoFinderOpen}
        serviceName={formData.serviceName}
        isDark={isDark}
        onConfirm={handleLogoConfirm}
      />

      {/* Service Match Dialog for SmsBower */}
      <ServiceMatchDialog
        open={serviceMatchOpen}
        onOpenChange={setServiceMatchOpen}
        isDark={isDark}
        serviceName={formData.serviceName}
        countryCode={serverCountryCode}
        onConfirm={handleServiceMatchConfirm}
      />
    </div>
  );
}

export default function AddServicePage() {
  return (
    <AdminLayout title="Add Service">
      <AddServiceContent />
    </AdminLayout>
  );
}
