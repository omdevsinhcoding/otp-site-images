import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { ArrowLeft, Key, Check, Globe, Loader2, AlertTriangle, Settings, Sparkles, Server, ArrowLeftRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { fiveSimCountries, getDialCodeForCountry } from '@/data/fiveSimCountries';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import localServiceCodes from '@/data/service-codes.json';
import { getServiceLogoUrl, DEFAULT_SERVICE_ICON } from '@/lib/logoUtils';

interface ServiceData {
  code: string;
  name: string;
  shortCode: string | null;
  logoUrl: string; // Always has a value (falls back to DEFAULT_SERVICE_ICON)
  operators: { name: string; cost: number; count: number }[];
}

interface ServiceCodeEntry {
  code: string | null;
  name: string;
}

// Cache for API fetched service codes - maps service name (lowercase) to short code
let smsbowerCache: Map<string, string> | null = null;
let smsActivateCache: Map<string, string> | null = null;

function FiveSimImportContent() {
  const navigate = useNavigate();
  const { resolvedTheme } = useAdminTheme();
  const { user } = useAuth();
  const isDark = resolvedTheme === 'dark';
  
  const [step, setStep] = useState<'api-key' | 'countries' | 'services' | 'complete'>('api-key');
  const [apiKey, setApiKey] = useState('');
  const [serverName, setServerName] = useState('');
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [selectedCountries, setSelectedCountries] = useState<number[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [servicesByCountry, setServicesByCountry] = useState<Record<number, ServiceData[]>>({});
  const [activeCountryView, setActiveCountryView] = useState<number | null>(null);
  const [marginPercent, setMarginPercent] = useState<string>('');
  const [cancelDisableTime, setCancelDisableTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchCountry, setSearchCountry] = useState('');
  const [visibleServices, setVisibleServices] = useState(50);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [showMarginConfirm, setShowMarginConfirm] = useState(false);
  const [showPatiencePopup, setShowPatiencePopup] = useState(false);
  const patienceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (step !== 'complete') {
        console.log('[5sim-import] Process cancelled, cleaning up');
      }
    };
  }, [step]);

  // Handle Enter key for different steps
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        
        if (step === 'api-key' && apiKey.length >= 32 && serverName.trim()) {
          handleApiKeySubmit();
        } else if (step === 'countries') {
          if (selectedCountries.length === 0) {
            toast({
              title: "Select Country",
              description: "Please select at least one country to proceed.",
              variant: "destructive",
            });
          } else {
            fetchServices();
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, apiKey, serverName, selectedCountries]);

  const validateApiKey = (key: string) => {
    const trimmedKey = key.trim();
    
    if (trimmedKey.length > 100 && trimmedKey.includes('.')) {
      setApiKeyError('jwt');
      toast({
        title: "Invalid API Key Format",
        description: "We don't accept 5SIM Protocol API key. Please enter 5sim API1 protocol (Deprecated API)",
        variant: "destructive",
      });
      return false;
    }
    
    if (/^[a-f0-9]{32}$/i.test(trimmedKey)) {
      setApiKeyError(null);
      toast({
        title: "Valid API Key",
        description: "API1 protocol key accepted. Proceeding to country selection.",
      });
      return true;
    }
    
    setApiKeyError('invalid');
    return false;
  };

  const handleApiKeySubmit = async () => {
    if (!serverName.trim()) {
      toast({
        title: "Server Name Required",
        description: "Please enter a name for this server.",
        variant: "destructive",
      });
      return;
    }

    // Check if server name already exists
    const { data: existingServer } = await supabase
      .from('auto_sms_servers')
      .select('id')
      .eq('server_name', serverName.trim())
      .maybeSingle();

    if (existingServer) {
      toast({
        title: "Name already taken",
        description: "Use a different server name.",
        variant: "destructive",
      });
      return;
    }

    if (validateApiKey(apiKey)) {
      setStep('countries');
    }
  };

  const toggleCountry = (code: number) => {
    if (selectedCountries.includes(code)) {
      setSelectedCountries(prev => prev.filter(c => c !== code));
    } else {
      if (selectedCountries.length >= 5) {
        toast({
          title: "Maximum Countries Reached",
          description: "You can only select up to 5 countries at a time.",
          variant: "destructive",
        });
        return;
      }
      setSelectedCountries(prev => [...prev, code]);
    }
  };


  // Step 1: Search in local JSON file (case-insensitive)
  const findCodeInLocalFile = (serviceName: string): string | null => {
    const normalized = serviceName.toLowerCase().trim();
    const localData = localServiceCodes as { status?: string; services?: ServiceCodeEntry[] };
    const services = localData.services || [];
    
    // Exact match first (case-insensitive)
    for (const entry of services) {
      if (entry.name && entry.code && entry.name.toLowerCase().trim() === normalized) {
        console.log(`[5sim-import] Local exact match: "${serviceName}" -> ${entry.code}`);
        return entry.code;
      }
    }
    
    // Then partial match (case-insensitive)
    for (const entry of services) {
      const entryName = entry.name?.toLowerCase().trim() || '';
      if (entry.code && entryName && (entryName.includes(normalized) || normalized.includes(entryName))) {
        console.log(`[5sim-import] Local partial match: "${serviceName}" -> ${entry.code}`);
        return entry.code;
      }
    }
    return null;
  };

  // Step 2: Search in smsbower API cache by service name
  const findCodeInSmsbower = (serviceName: string): string | null => {
    if (!smsbowerCache || smsbowerCache.size === 0) return null;
    const normalized = serviceName.toLowerCase().trim();
    
    // Try exact match first
    const exactCode = smsbowerCache.get(normalized);
    if (exactCode) {
      console.log(`[5sim-import] smsbower exact match: "${serviceName}" -> ${exactCode}`);
      return exactCode;
    }
    
    // Try partial match (service name contains or is contained by API name)
    for (const [name, code] of smsbowerCache.entries()) {
      if (name.includes(normalized) || normalized.includes(name)) {
        console.log(`[5sim-import] smsbower partial match: "${serviceName}" matches "${name}" -> ${code}`);
        return code;
      }
    }
    return null;
  };

  // Step 3: Search in sms-activate API cache by service name
  const findCodeInSmsActivate = (serviceName: string): string | null => {
    if (!smsActivateCache || smsActivateCache.size === 0) return null;
    const normalized = serviceName.toLowerCase().trim();
    
    // Try exact match first
    const exactCode = smsActivateCache.get(normalized);
    if (exactCode) {
      console.log(`[5sim-import] sms-activate exact match: "${serviceName}" -> ${exactCode}`);
      return exactCode;
    }
    
    // Try partial match
    for (const [name, code] of smsActivateCache.entries()) {
      if (name.includes(normalized) || normalized.includes(name)) {
        console.log(`[5sim-import] sms-activate partial match: "${serviceName}" matches "${name}" -> ${code}`);
        return code;
      }
    }
    return null;
  };

  // Get logo URL using nested directory structure - ALWAYS returns a valid URL
  const getLogoUrl = (shortCode: string | null): string => {
    if (!shortCode || shortCode.trim() === '') {
      return DEFAULT_SERVICE_ICON;
    }
    return getServiceLogoUrl(shortCode);
  };

  // 4-step lookup: local file -> smsbower API -> sms-activate API -> null (will use default logo)
  const findShortCode = (serviceName: string): string | null => {
    // Step 1: Local file
    let code = findCodeInLocalFile(serviceName);
    if (code) {
      console.log(`[5sim-import] "${serviceName}" found in local file: ${code}`);
      return code;
    }

    // Step 2: smsbower cache
    code = findCodeInSmsbower(serviceName);
    if (code) return code;

    // Step 3: sms-activate cache  
    code = findCodeInSmsActivate(serviceName);
    if (code) return code;

    // Not found - will use default logo
    console.log(`[5sim-import] "${serviceName}" not found in any source, will use default logo`);
    return null;
  };

  // Fetch API caches via edge function (avoids CORS issues)
  const fetchServiceCodeCaches = async () => {
    // Only skip if both caches are populated with data
    if (smsbowerCache && smsbowerCache.size > 0 && smsActivateCache && smsActivateCache.size > 0) {
      console.log(`[5sim-import] Using cached data: smsbower=${smsbowerCache.size}, smsActivate=${smsActivateCache.size}`);
      return;
    }
    
    try {
      console.log('[5sim-import] Fetching service codes via edge function...');
      const response = await supabase.functions.invoke('service-code-lookup', {
        body: { serviceName: '' }
      });
      
      if (response.data?.success) {
        // Convert response objects to Maps
        if (response.data.smsbower && Object.keys(response.data.smsbower).length > 0) {
          smsbowerCache = new Map(Object.entries(response.data.smsbower));
          console.log(`[5sim-import] Loaded ${smsbowerCache.size} services from smsbower`);
        }
        if (response.data.smsActivate && Object.keys(response.data.smsActivate).length > 0) {
          smsActivateCache = new Map(Object.entries(response.data.smsActivate));
          console.log(`[5sim-import] Loaded ${smsActivateCache.size} services from sms-activate`);
        }
      } else {
        console.error('[5sim-import] Edge function error:', response.data?.error);
      }
    } catch (err) {
      console.error('[5sim-import] Error fetching service codes:', err);
    }
  };

  const fetchServices = async () => {
    if (selectedCountries.length === 0) {
      toast({
        title: "No Countries Selected",
        description: "Please select at least one country.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setShowPatiencePopup(false);
    
    // Show patience popup after 2 seconds
    patienceTimerRef.current = setTimeout(() => {
      setShowPatiencePopup(true);
    }, 2000);
    
    try {
      // PARALLEL: Fetch service code caches AND 5sim prices simultaneously
      const [, priceResponse] = await Promise.all([
        fetchServiceCodeCaches(),
        supabase.functions.invoke('fivesim-proxy', {
          body: { apiKey, action: 'getPrices' }
        })
      ]);

      if (priceResponse.error || !priceResponse.data?.success) {
        throw new Error(priceResponse.data?.error || 'Failed to fetch prices');
      }

      const priceData = priceResponse.data.data;

      const parsedServices: ServiceData[] = [];
      const servicesByCountryMap: Record<number, ServiceData[]> = {};
      
      for (const countryCode of selectedCountries) {
        const country = fiveSimCountries.find(c => c.code === countryCode);
        const countryName = country?.name.toLowerCase().replace(/\s+/g, '') || '';
        const countryData = priceData[countryName];
        
        if (countryData) {
          const countryServices: ServiceData[] = [];
          
          for (const [serviceCode, serviceData] of Object.entries(countryData)) {
            const operators: { name: string; cost: number; count: number }[] = [];
            
            for (const [operatorName, opData] of Object.entries(serviceData as Record<string, unknown>)) {
              const op = opData as { cost?: number; count?: number };
              operators.push({
                name: operatorName,
                cost: op.cost || 0,
                count: op.count || 0,
              });
            }
            
            // Use 3-step lookup: local file -> smsbower -> sms-activate -> 5sim code
            const shortCode = findShortCode(serviceCode);
            const logoUrl = getLogoUrl(shortCode);

            const serviceEntry: ServiceData = {
              code: serviceCode,
              name: serviceCode,
              shortCode,
              logoUrl, // Always has a value (falls back to DEFAULT_SERVICE_ICON)
              operators,
            };
            
            countryServices.push(serviceEntry);
            
            // Also add to combined list
            const existingService = parsedServices.find(s => s.code === serviceCode);
            if (existingService) {
              for (const op of operators) {
                if (!existingService.operators.find(o => o.name === op.name)) {
                  existingService.operators.push(op);
                }
              }
            } else {
              parsedServices.push({ ...serviceEntry });
            }
          }
          
          servicesByCountryMap[countryCode] = countryServices;
        }
      }
      
      setServices(parsedServices);
      setServicesByCountry(servicesByCountryMap);
      // Set first country as active view if multiple countries selected
      if (selectedCountries.length >= 2) {
        setActiveCountryView(selectedCountries[0]);
      }
      setStep('services');
      
      toast({
        title: "Services Fetched",
        description: `Found ${parsedServices.length} services for ${selectedCountries.length} countries.`,
      });
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: "Error Fetching Services",
        description: error instanceof Error ? error.message : "Failed to fetch services from 5sim. Please check your API key.",
        variant: "destructive",
      });
    } finally {
      // Clear timer and hide popup
      if (patienceTimerRef.current) {
        clearTimeout(patienceTimerRef.current);
        patienceTimerRef.current = null;
      }
      setShowPatiencePopup(false);
      setLoading(false);
    }
  };

  const completeSetup = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please login to complete setup.",
        variant: "destructive",
      });
      return;
    }

    if (!serverName.trim()) {
      toast({
        title: "Server Name Required",
        description: "Please enter a name for this server.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setImportProgress({ current: 0, total: 100 });
    
    try {
      // Build list of server names that will be created (using country names as suffix when multiple countries)
      const serverNamesToCreate = selectedCountries.length > 1
        ? selectedCountries.map((countryCode) => {
            const country = fiveSimCountries.find(c => c.code === countryCode);
            return `${serverName.trim()} ${country?.name || countryCode}`;
          })
        : [serverName.trim()];
      
      // Check if any of the server names already exist
      const { data: existingServers } = await supabase
        .from('auto_sms_servers')
        .select('server_name')
        .in('server_name', serverNamesToCreate);

      if (existingServers && existingServers.length > 0) {
        setLoading(false);
        const existingNames = existingServers.map(s => s.server_name).join(', ');
        toast({
          title: "Server name exists",
          description: `These names are taken: ${existingNames}`,
          variant: "destructive",
        });
        return;
      }
      
      // Step 1: Prepare all server inserts
      const serverInserts = selectedCountries.map(countryCode => {
        const country = fiveSimCountries.find(c => c.code === countryCode);
        if (!country) return null;
        
        const dialCode = getDialCodeForCountry(countryCode);
        const apiGetNumberUrl = `http://api1.5sim.net/stubs/handler_api.php?api_key=${apiKey}&action=getNumber&service={service_code}&operator={operator}&country=${countryCode}`;
        const apiGetMessageUrl = `http://api1.5sim.net/stubs/handler_api.php?api_key=${apiKey}&action=getStatus&id={id}`;
        const apiNextMessageUrl = `http://api1.5sim.net/stubs/handler_api.php?api_key=${apiKey}&action=setStatus&status=3&id={id}`;
        const apiCancelUrl = `http://api1.5sim.net/stubs/handler_api.php?api_key=${apiKey}&action=setStatus&status=8&id={id}`;

        // Add country name when multiple countries selected
        const finalServerName = selectedCountries.length > 1 
          ? `${serverName.trim()} ${country.name}`
          : serverName.trim();

        return {
          server_name: finalServerName,
          country_code: countryCode.toString(),
          country_name: country.name,
          country_dial_code: dialCode,
          country_flag: country.flag,
          api_key: apiKey,
          api_response_type: 'json',
          uses_headers: false,
          header_key_name: null,
          header_value: null,
          api_get_number_url: apiGetNumberUrl,
          api_get_message_url: apiGetMessageUrl,
          api_activate_next_message_url: apiNextMessageUrl,
          api_cancel_number_url: apiCancelUrl,
          number_id_path: null,
          phone_number_path: null,
          otp_path_in_json: null,
          auto_cancel_minutes: 20,
          api_retry_count: 5,
          is_active: true,
          provider: '5sim',
          created_by: user.id
        };
      }).filter(Boolean);

      setImportProgress({ current: 10, total: 100 });

      // Step 2: Batch insert ALL servers at once
      const { data: serversData, error: serversError } = await supabase
        .from('auto_sms_servers')
        .insert(serverInserts)
        .select('id, country_code');

      if (serversError || !serversData) {
        throw new Error('Failed to create servers: ' + serversError?.message);
      }

      setImportProgress({ current: 30, total: 100 });

      // Step 3: Build server ID map
      const serverIdMap: Record<string, string> = {};
      serversData.forEach(s => {
        serverIdMap[s.country_code] = s.id;
      });

      // Step 4: Prepare ALL service inserts at once
      const allServiceInserts: Array<{
        server_id: string;
        service_name: string;
        service_code: string;
        operator: string;
        logo_url: string | null;
        base_price: number;
        margin_percentage: number;
        final_price: number;
        cancel_disable_time: number;
        is_popular: boolean;
        is_active: boolean;
        created_by: string;
      }> = [];

      for (const countryCode of selectedCountries) {
        const serverId = serverIdMap[countryCode.toString()];
        if (!serverId) continue;

        for (const service of services) {
          // Add each operator as a separate entry (e.g., betfair with virtual21 and virtual4 = 2 rows)
          for (const op of service.operators) {
            const basePrice = op.cost || 0;
            const margin = marginPercent ? Number(marginPercent) : 0;
            const finalPrice = basePrice * (1 + margin / 100);
            
            const cancelTime = cancelDisableTime ? Number(cancelDisableTime) : 0;
            
            allServiceInserts.push({
              server_id: serverId,
              service_name: service.name,
              service_code: service.shortCode || service.name, // Use shortCode or fallback to service name
              operator: op.name,
              logo_url: service.logoUrl, // Always has a valid URL
              base_price: basePrice,
              margin_percentage: margin,
              final_price: finalPrice,
              cancel_disable_time: cancelTime,
              is_popular: false,
              is_active: op.count > 0, // Mark as inactive if count is 0
              created_by: user.id
            } as any);
          }
        }
      }

      setImportProgress({ current: 50, total: 100 });

      // Step 5: Parallel batch insert with larger chunks
      const BATCH_SIZE = 500;
      const batches = [];
      for (let i = 0; i < allServiceInserts.length; i += BATCH_SIZE) {
        batches.push(allServiceInserts.slice(i, i + BATCH_SIZE));
      }

      // Insert batches in parallel (max 5 concurrent)
      const CONCURRENT_LIMIT = 5;
      for (let i = 0; i < batches.length; i += CONCURRENT_LIMIT) {
        const concurrentBatches = batches.slice(i, i + CONCURRENT_LIMIT);
        await Promise.all(
          concurrentBatches.map(batch => supabase.from('auto_services').insert(batch))
        );
        const progress = 50 + Math.round((i / batches.length) * 50);
        setImportProgress({ current: Math.min(progress, 99), total: 100 });
      }

      setImportProgress({ current: 100, total: 100 });

      toast({
        title: "Setup Complete",
        description: `Imported ${serversData.length} servers and ${allServiceInserts.length} services.`,
      });
      
      setStep('complete');
    } catch (error) {
      console.error('Error completing setup:', error);
      toast({
        title: "Setup Failed",
        description: error instanceof Error ? error.message : "An error occurred while completing the setup.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCountries = fiveSimCountries.filter(c => 
    c.name.toLowerCase().includes(searchCountry.toLowerCase())
  );

  const stepIndex = ['api-key', 'countries', 'services', 'complete'].indexOf(step);

  return (
    <div className="space-y-6">
      <Button
        variant="outline"
        onClick={() => navigate('/admin/services/direct-import')}
        className={cn(
          "group flex items-center gap-2",
          isDark 
            ? "border-gray-700 text-gray-300 hover:bg-gray-800" 
            : "border-gray-200 text-gray-700 hover:bg-gray-50"
        )}
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Providers
      </Button>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 sm:p-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">5sim Direct Import</h1>
              <p className="text-blue-100">Import services automatically from 5sim API</p>
            </div>
          </div>
          
          <div className="mt-6 flex items-center gap-2">
            {['api-key', 'countries', 'services', 'complete'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  step === s ? "bg-white text-blue-600" :
                  stepIndex > i ? "bg-white/30 text-white" : "bg-white/10 text-white/50"
                )}>
                  {stepIndex > i ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < 3 && (
                  <div className={cn(
                    "w-8 sm:w-12 h-0.5 mx-1",
                    stepIndex > i ? "bg-white/30" : "bg-white/10"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={cn(
        "rounded-2xl p-6 sm:p-8",
        isDark ? "bg-gray-900 border border-gray-800" : "bg-white border border-gray-200 shadow-sm"
      )}>
        {step === 'api-key' && (
          <div className="max-w-lg mx-auto space-y-6">
            <div className="text-center">
              <div className={cn(
                "w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4",
                "bg-gradient-to-br from-blue-500 to-indigo-600"
              )}>
                <Key className="w-8 h-8 text-white" />
              </div>
              <h2 className={cn("text-xl font-semibold mb-2", isDark ? "text-white" : "text-gray-900")}>
                Enter Your 5sim API Key
              </h2>
              <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                Use the API1 protocol (Deprecated API) key from 5sim
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                  Server Name
                </label>
                <div className="relative">
                  <Server className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isDark ? "text-gray-500" : "text-gray-400")} />
                  <Input
                    type="text"
                    placeholder="e.g., 5sim Premium"
                    value={serverName}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      const cleanValue = rawValue.replace(/[^a-zA-Z0-9\s]/g, '');
                      // Show toast if symbols were removed
                      if (rawValue !== cleanValue) {
                        toast({
                          title: "Symbols not allowed",
                          description: "Server name can only contain letters, numbers, and spaces.",
                          variant: "destructive",
                        });
                      }
                      setServerName(cleanValue);
                    }}
                    className={cn(
                      "h-12 pl-10 pr-4",
                      isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                  API Key
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter your API1 key (e.g., 1161c073eb7b4ds1dtdf75178462t58)"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setApiKeyError(null);
                    }}
                    className={cn(
                      "h-12 pl-4 pr-12 font-mono text-sm",
                      isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200",
                      apiKeyError === 'jwt' && "border-red-500 focus:ring-red-500",
                      apiKeyError === null && apiKey.length === 32 && "border-green-500 focus:ring-green-500"
                    )}
                  />
                  {apiKeyError === 'jwt' && (
                    <AlertTriangle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                  )}
                  {apiKeyError === null && apiKey.length === 32 && (
                    <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                </div>
              </div>

              {apiKeyError === 'jwt' && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-500 font-medium">
                    ⚠️ We don't accept 5SIM Protocol API key
                  </p>
                  <p className="text-sm text-green-500 mt-1">
                    ✓ Please enter 5sim API1 protocol (Deprecated API)
                  </p>
                </div>
              )}

              <Button
                onClick={handleApiKeySubmit}
                disabled={!apiKey || apiKey.length < 32 || !serverName.trim()}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                Continue to Country Selection
              </Button>
            </div>
          </div>
        )}

        {step === 'countries' && (
          <div className="space-y-6">
            {/* Info message about valid API key */}
            <div className={cn(
              "p-4 rounded-xl border flex items-start gap-3",
              isDark 
                ? "bg-emerald-500/10 border-emerald-500/20" 
                : "bg-emerald-50 border-emerald-200"
            )}>
              <Sparkles className={cn("w-5 h-5 flex-shrink-0 mt-0.5", isDark ? "text-emerald-400" : "text-emerald-600")} />
              <div>
                <p className={cn("text-sm font-medium", isDark ? "text-emerald-400" : "text-emerald-700")}>
                  ✓ Valid API key detected! Auto-import is ready to use.
                </p>
                <p className={cn("text-xs mt-1", isDark ? "text-emerald-400/70" : "text-emerald-600/80")}>
                  Make sure you have sufficient balance in your 5sim account for the import to work properly.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className={cn("text-xl font-semibold", isDark ? "text-white" : "text-gray-900")}>
                  Select Countries
                </h2>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                  Select up to 5 countries to import ({selectedCountries.length}/5 selected)
                </p>
              </div>
              
              <Input
                placeholder="Search countries..."
                value={searchCountry}
                onChange={(e) => setSearchCountry(e.target.value)}
                className={cn("w-full sm:w-64", isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200")}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto p-1">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => toggleCountry(country.code)}
                  className={cn(
                    "relative p-3 rounded-xl border-2 transition-all text-left",
                    selectedCountries.includes(country.code)
                      ? "border-blue-500 bg-blue-500/10"
                      : isDark 
                        ? "border-gray-700 hover:border-gray-600 bg-gray-800/50" 
                        : "border-gray-200 hover:border-gray-300 bg-gray-50"
                  )}
                >
                  {selectedCountries.includes(country.code) && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <span className="text-2xl mb-1 block">{country.flag}</span>
                  <span className={cn("text-xs font-medium line-clamp-1", isDark ? "text-gray-300" : "text-gray-700")}>
                    {country.name}
                  </span>
                  <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
                    Code: {country.code}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep('api-key')}
                className={isDark ? "border-gray-700" : "border-gray-200"}
              >
                Back
              </Button>
              <Button
                onClick={fetchServices}
                disabled={selectedCountries.length === 0 || loading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Fetching Services...</>
                ) : (
                  <><Globe className="w-4 h-4 mr-2" />Fetch Services</>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'services' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className={cn("text-xl font-semibold", isDark ? "text-white" : "text-gray-900")}>
                  Services Found: {activeCountryView && servicesByCountry[activeCountryView] 
                    ? servicesByCountry[activeCountryView].length 
                    : services.length}
                </h2>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                  Set your margin percentage to apply to all services
                </p>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>Margin %</span>
                  <Input
                    type="number"
                    min={0}
                    max={500}
                    value={marginPercent}
                    onChange={(e) => setMarginPercent(e.target.value)}
                    placeholder="0"
                    className={cn("w-20", isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200")}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>Cancel Freeze (min)</span>
                  <Input
                    type="number"
                    min={0}
                    max={5}
                    value={cancelDisableTime}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && Number(val) > 5) {
                        toast({
                          title: "Max 5 minutes",
                          description: "Cancel button can be frozen for max 5 min.",
                          variant: "destructive",
                        });
                        setCancelDisableTime('5');
                      } else {
                        setCancelDisableTime(val);
                      }
                    }}
                    placeholder="0"
                    className={cn("w-20", isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200")}
                  />
                </div>
              </div>
            </div>

            {/* Country Switcher - only show when 2+ countries selected */}
            {selectedCountries.length >= 2 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("text-sm font-medium", isDark ? "text-gray-400" : "text-gray-500")}>
                  View by country:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedCountries.map((countryCode, index) => {
                    const country = fiveSimCountries.find(c => c.code === countryCode);
                    const isActive = activeCountryView === countryCode;
                    const serviceCount = servicesByCountry[countryCode]?.length || 0;
                    
                    return (
                      <div key={countryCode} className="flex items-center gap-1">
                        <div className="relative group">
                          <button
                            onClick={() => {
                              setActiveCountryView(countryCode);
                              setVisibleServices(50);
                            }}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all pr-8",
                              isActive
                                ? "border-blue-500 bg-blue-500/10 text-blue-500"
                                : isDark
                                  ? "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"
                                  : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                            )}
                          >
                            <span className="text-lg">{country?.flag || '🌍'}</span>
                            <span className="text-sm font-medium">{country?.name || countryCode}</span>
                            <span className={cn(
                              "text-xs px-1.5 py-0.5 rounded-full",
                              isActive ? "bg-blue-500/20" : isDark ? "bg-gray-700" : "bg-gray-200"
                            )}>
                              {serviceCount}
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Remove this country from selected countries
                              setSelectedCountries(prev => prev.filter(c => c !== countryCode));
                              // Remove services for this country
                              setServicesByCountry(prev => {
                                const newServices = { ...prev };
                                delete newServices[countryCode];
                                return newServices;
                              });
                              // If this was the active view, switch to another or null
                              if (activeCountryView === countryCode) {
                                const remaining = selectedCountries.filter(c => c !== countryCode);
                                setActiveCountryView(remaining.length > 0 ? remaining[0] : null);
                              }
                              toast({
                                title: "Country Removed",
                                description: `${country?.name || 'Country'} will not be added to database.`,
                              });
                            }}
                            className={cn(
                              "absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full transition-all opacity-0 group-hover:opacity-100",
                              isDark 
                                ? "hover:bg-red-500/20 text-red-400" 
                                : "hover:bg-red-100 text-red-500"
                            )}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {index < selectedCountries.length - 1 && (
                          <ArrowLeftRight className={cn(
                            "w-4 h-4 mx-1",
                            isDark ? "text-gray-600" : "text-gray-400"
                          )} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="max-h-[500px] overflow-y-auto space-y-2">
              {(() => {
                const displayServices = activeCountryView && servicesByCountry[activeCountryView]
                  ? servicesByCountry[activeCountryView]
                  : services;
                
                return displayServices.slice(0, visibleServices).map((service) => {
                const bestOperator = service.operators.find(op => op.count > 0) || service.operators[0];
                const basePrice = bestOperator?.cost || 0;
                const margin = marginPercent ? Number(marginPercent) : 0;
                const finalPrice = margin > 0 ? (basePrice * (1 + margin / 100)).toFixed(2) : basePrice.toFixed(2);
                
                return (
                  <div
                    key={service.code}
                    className={cn(
                      "p-4 rounded-xl border flex items-center justify-between gap-4",
                      isDark ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <img 
                        src={service.logoUrl || DEFAULT_SERVICE_ICON} 
                        alt={service.name} 
                        className="w-8 h-8 rounded-lg object-cover"
                        onError={(e) => {
                          // Prevent infinite loop - only change if not already default
                          if (e.currentTarget.src !== DEFAULT_SERVICE_ICON && !e.currentTarget.src.endsWith('/service-icons/o/other.webp')) {
                            e.currentTarget.src = DEFAULT_SERVICE_ICON;
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-medium truncate", isDark ? "text-gray-200" : "text-gray-800")}>
                          {service.name}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {service.operators.slice(0, 3).map(op => (
                            <span
                              key={op.name}
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full",
                                op.count > 0 ? "bg-green-500/10 text-green-500" : "bg-gray-500/10 text-gray-500"
                              )}
                            >
                              {op.name}: {op.count}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                        Base: ₹{basePrice}
                      </p>
                      <p className="text-sm font-semibold text-green-500">Final: ₹{finalPrice}</p>
                    </div>
                  </div>
                );
              });
              })()}
              {(() => {
                const displayServices = activeCountryView && servicesByCountry[activeCountryView]
                  ? servicesByCountry[activeCountryView]
                  : services;
                
                return visibleServices < displayServices.length && (
                <div className="flex flex-col items-center gap-2 py-4">
                  <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                    Showing {visibleServices} of {displayServices.length} services
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVisibleServices(prev => Math.min(prev + 100, displayServices.length))}
                    className={isDark ? "border-gray-700" : "border-gray-200"}
                  >
                    Load 100 More
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVisibleServices(displayServices.length)}
                    className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}
                  >
                    Load All ({displayServices.length})
                  </Button>
                </div>
              );
              })()}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep('countries')}
                className={isDark ? "border-gray-700" : "border-gray-200"}
              >
                Back
              </Button>
              <Button
                onClick={() => {
                  if (!marginPercent || parseFloat(marginPercent) === 0) {
                    setShowMarginConfirm(true);
                  } else {
                    completeSetup();
                  }
                }}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing {importProgress.current}/{importProgress.total}...</>
                ) : (
                  <><Settings className="w-4 h-4 mr-2" />Complete Setup</>
                )}
              </Button>
            </div>

            {/* Margin Confirmation Dialog */}
            <AlertDialog open={showMarginConfirm} onOpenChange={setShowMarginConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Proceed without margin?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You haven't set a margin percentage. Are you sure you want to proceed with 0% margin?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {
                    setShowMarginConfirm(false);
                    completeSetup();
                  }}>
                    Yes, proceed
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Patience Popup - Shows after 5 seconds of loading */}
        <AlertDialog open={showPatiencePopup}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              </div>
              <AlertDialogTitle className="text-center">Import in Progress</AlertDialogTitle>
              <AlertDialogDescription className="text-center space-y-3">
                <p>
                  Our servers are currently fetching and processing service data from multiple sources. 
                  This may take <strong>1-2 minutes</strong> to complete.
                </p>
                <div className={cn(
                  "p-3 rounded-lg text-sm",
                  isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-700"
                )}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      <strong>Please do not refresh or navigate away.</strong> Interrupting this process may result in incomplete data import.
                    </span>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>

        {step === 'complete' && (
          <div className="max-w-lg mx-auto text-center space-y-6 py-8">
            <div className="w-20 h-20 rounded-full bg-green-500/10 mx-auto flex items-center justify-center">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <div>
              <h2 className={cn("text-2xl font-bold mb-2", isDark ? "text-white" : "text-gray-900")}>
                Import Complete!
              </h2>
              <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                Successfully imported {services.length} services for {selectedCountries.length} countries from 5sim.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/services/direct-import')}
                className={isDark ? "border-gray-700" : "border-gray-200"}
              >
                Import More Providers
              </Button>
              <Button
                onClick={() => navigate('/admin/services')}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                Go to Services Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FiveSimImportPage() {
  return (
    <AdminLayout title="5sim Import">
      <FiveSimImportContent />
    </AdminLayout>
  );
}
