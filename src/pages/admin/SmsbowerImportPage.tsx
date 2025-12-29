import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { ArrowLeft, Key, Check, Globe, Loader2, AlertTriangle, Settings, Sparkles, Server, RefreshCw, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import localServiceCodes from '@/data/service-codes.json';
import { fiveSimCountries } from '@/data/fiveSimCountries';
import { getServiceLogoUrl, DEFAULT_SERVICE_ICON } from '@/lib/logoUtils';
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

interface CountryData {
  code: string;
  name: string;
  flag: string;
}

interface ProviderData {
  count: number;
  price: number;
  provider_id: number;
}

interface ServiceData {
  code: string;
  name: string;
  shortCode: string | null;
  logoUrl: string | null;
  providers: { providerId: number; price: number; count: number }[];
}

interface ServiceCodeEntry {
  code: string | null;
  name: string;
}

// Cache for API fetched service codes
let smsbowerServiceCache: ServiceCodeEntry[] | null = null;

// Country code to flag emoji and dial code mapping
const countryCodeToInfo: Record<string, { flag: string; dialCode: string; name?: string }> = {
  '0': { flag: '🇷🇺', dialCode: '+7', name: 'Russia' },
  '1': { flag: '🇺🇦', dialCode: '+380', name: 'Ukraine' },
  '2': { flag: '🇰🇿', dialCode: '+7', name: 'Kazakhstan' },
  '3': { flag: '🇨🇳', dialCode: '+86', name: 'China' },
  '4': { flag: '🇵🇭', dialCode: '+63', name: 'Philippines' },
  '5': { flag: '🇲🇲', dialCode: '+95', name: 'Myanmar' },
  '6': { flag: '🇮🇩', dialCode: '+62', name: 'Indonesia' },
  '7': { flag: '🇲🇾', dialCode: '+60', name: 'Malaysia' },
  '8': { flag: '🇰🇪', dialCode: '+254', name: 'Kenya' },
  '9': { flag: '🇹🇿', dialCode: '+255', name: 'Tanzania' },
  '10': { flag: '🇻🇳', dialCode: '+84', name: 'Vietnam' },
  '11': { flag: '🇰🇬', dialCode: '+996', name: 'Kyrgyzstan' },
  '12': { flag: '🇺🇸', dialCode: '+1', name: 'USA' },
  '13': { flag: '🇮🇱', dialCode: '+972', name: 'Israel' },
  '14': { flag: '🇭🇰', dialCode: '+852', name: 'Hong Kong' },
  '15': { flag: '🇵🇱', dialCode: '+48', name: 'Poland' },
  '16': { flag: '🇬🇧', dialCode: '+44', name: 'United Kingdom' },
  '17': { flag: '🇲🇩', dialCode: '+373', name: 'Moldova' },
  '18': { flag: '🇹🇷', dialCode: '+90', name: 'Turkey' },
  '19': { flag: '🇳🇬', dialCode: '+234', name: 'Nigeria' },
  '20': { flag: '🇪🇬', dialCode: '+20', name: 'Egypt' },
  '21': { flag: '🇮🇳', dialCode: '+91', name: 'India' },
  '22': { flag: '🇮🇪', dialCode: '+353', name: 'Ireland' },
  '23': { flag: '🇨🇦', dialCode: '+1', name: 'Canada' },
  '24': { flag: '🇲🇦', dialCode: '+212', name: 'Morocco' },
  '25': { flag: '🇸🇪', dialCode: '+46', name: 'Sweden' },
  '26': { flag: '🇦🇫', dialCode: '+93', name: 'Afghanistan' },
  '27': { flag: '🇦🇱', dialCode: '+355', name: 'Albania' },
  '28': { flag: '🇩🇿', dialCode: '+213', name: 'Algeria' },
  '29': { flag: '🇦🇴', dialCode: '+244', name: 'Angola' },
  '30': { flag: '🇦🇶', dialCode: '+672', name: 'Antarctica' },
  '31': { flag: '🇦🇷', dialCode: '+54', name: 'Argentina' },
  '32': { flag: '🇦🇲', dialCode: '+374', name: 'Armenia' },
  '33': { flag: '🇦🇺', dialCode: '+61', name: 'Australia' },
  '34': { flag: '🇧🇩', dialCode: '+880', name: 'Bangladesh' },
  '35': { flag: '🇧🇾', dialCode: '+375', name: 'Belarus' },
  '36': { flag: '🇧🇪', dialCode: '+32', name: 'Belgium' },
  '37': { flag: '🇧🇿', dialCode: '+501', name: 'Belize' },
  '38': { flag: '🇧🇯', dialCode: '+229', name: 'Benin' },
  '39': { flag: '🇧🇴', dialCode: '+591', name: 'Bolivia' },
  '40': { flag: '🇧🇦', dialCode: '+387', name: 'Bosnia' },
  '41': { flag: '🇧🇼', dialCode: '+267', name: 'Botswana' },
  '42': { flag: '🇧🇷', dialCode: '+55', name: 'Brazil' },
  '43': { flag: '🇧🇬', dialCode: '+359', name: 'Bulgaria' },
  '44': { flag: '🇧🇫', dialCode: '+226', name: 'Burkina Faso' },
  '45': { flag: '🇧🇮', dialCode: '+257', name: 'Burundi' },
  '46': { flag: '🇰🇭', dialCode: '+855', name: 'Cambodia' },
  '47': { flag: '🇨🇲', dialCode: '+237', name: 'Cameroon' },
  '48': { flag: '🇨🇻', dialCode: '+238', name: 'Cape Verde' },
  '49': { flag: '🇹🇩', dialCode: '+235', name: 'Chad' },
  '50': { flag: '🇨🇱', dialCode: '+56', name: 'Chile' },
  '51': { flag: '🇨🇴', dialCode: '+57', name: 'Colombia' },
  '52': { flag: '🇨🇩', dialCode: '+243', name: 'DR Congo' },
  '53': { flag: '🇨🇷', dialCode: '+506', name: 'Costa Rica' },
  '54': { flag: '🇭🇷', dialCode: '+385', name: 'Croatia' },
  '55': { flag: '🇨🇾', dialCode: '+357', name: 'Cyprus' },
  '56': { flag: '🇨🇿', dialCode: '+420', name: 'Czech Republic' },
  '57': { flag: '🇩🇰', dialCode: '+45', name: 'Denmark' },
  '58': { flag: '🇩🇴', dialCode: '+1809', name: 'Dominican Republic' },
  '59': { flag: '🇪🇨', dialCode: '+593', name: 'Ecuador' },
  '60': { flag: '🇸🇻', dialCode: '+503', name: 'El Salvador' },
  '61': { flag: '🇪🇪', dialCode: '+372', name: 'Estonia' },
  '62': { flag: '🇪🇹', dialCode: '+251', name: 'Ethiopia' },
  '63': { flag: '🇫🇮', dialCode: '+358', name: 'Finland' },
  '64': { flag: '🇫🇷', dialCode: '+33', name: 'France' },
  '65': { flag: '🇬🇲', dialCode: '+220', name: 'Gambia' },
  '66': { flag: '🇬🇪', dialCode: '+995', name: 'Georgia' },
  '67': { flag: '🇩🇪', dialCode: '+49', name: 'Germany' },
  '68': { flag: '🇬🇭', dialCode: '+233', name: 'Ghana' },
  '69': { flag: '🇬🇷', dialCode: '+30', name: 'Greece' },
  '70': { flag: '🇬🇹', dialCode: '+502', name: 'Guatemala' },
  '71': { flag: '🇬🇳', dialCode: '+224', name: 'Guinea' },
  '72': { flag: '🇭🇹', dialCode: '+509', name: 'Haiti' },
  '73': { flag: '🇭🇳', dialCode: '+504', name: 'Honduras' },
  '74': { flag: '🇭🇺', dialCode: '+36', name: 'Hungary' },
  '75': { flag: '🇮🇶', dialCode: '+964', name: 'Iraq' },
  '76': { flag: '🇮🇹', dialCode: '+39', name: 'Italy' },
  '77': { flag: '🇨🇮', dialCode: '+225', name: 'Ivory Coast' },
  '78': { flag: '🇯🇲', dialCode: '+1876', name: 'Jamaica' },
  '79': { flag: '🇯🇵', dialCode: '+81', name: 'Japan' },
  '80': { flag: '🇯🇴', dialCode: '+962', name: 'Jordan' },
  '81': { flag: '🇰🇼', dialCode: '+965', name: 'Kuwait' },
  '82': { flag: '🇱🇦', dialCode: '+856', name: 'Laos' },
  '83': { flag: '🇱🇻', dialCode: '+371', name: 'Latvia' },
  '84': { flag: '🇱🇹', dialCode: '+370', name: 'Lithuania' },
  '85': { flag: '🇲🇬', dialCode: '+261', name: 'Madagascar' },
  '86': { flag: '🇲🇼', dialCode: '+265', name: 'Malawi' },
  '87': { flag: '🇲🇱', dialCode: '+223', name: 'Mali' },
  '88': { flag: '🇲🇷', dialCode: '+222', name: 'Mauritania' },
  '89': { flag: '🇲🇽', dialCode: '+52', name: 'Mexico' },
  '90': { flag: '🇲🇳', dialCode: '+976', name: 'Mongolia' },
  '91': { flag: '🇲🇿', dialCode: '+258', name: 'Mozambique' },
  '92': { flag: '🇳🇦', dialCode: '+264', name: 'Namibia' },
  '93': { flag: '🇳🇵', dialCode: '+977', name: 'Nepal' },
  '94': { flag: '🇳🇱', dialCode: '+31', name: 'Netherlands' },
  '95': { flag: '🇳🇿', dialCode: '+64', name: 'New Zealand' },
  '96': { flag: '🇳🇮', dialCode: '+505', name: 'Nicaragua' },
  '97': { flag: '🇳🇪', dialCode: '+227', name: 'Niger' },
  '98': { flag: '🇳🇴', dialCode: '+47', name: 'Norway' },
  '99': { flag: '🇴🇲', dialCode: '+968', name: 'Oman' },
  '100': { flag: '🇵🇰', dialCode: '+92', name: 'Pakistan' },
  '101': { flag: '🇵🇦', dialCode: '+507', name: 'Panama' },
  '102': { flag: '🇵🇬', dialCode: '+675', name: 'Papua New Guinea' },
  '103': { flag: '🇵🇾', dialCode: '+595', name: 'Paraguay' },
  '104': { flag: '🇵🇪', dialCode: '+51', name: 'Peru' },
  '105': { flag: '🇵🇹', dialCode: '+351', name: 'Portugal' },
  '106': { flag: '🇵🇷', dialCode: '+1787', name: 'Puerto Rico' },
  '107': { flag: '🇷🇴', dialCode: '+40', name: 'Romania' },
  '108': { flag: '🇷🇼', dialCode: '+250', name: 'Rwanda' },
  '109': { flag: '🇸🇦', dialCode: '+966', name: 'Saudi Arabia' },
  '110': { flag: '🇸🇳', dialCode: '+221', name: 'Senegal' },
  '111': { flag: '🇷🇸', dialCode: '+381', name: 'Serbia' },
  '112': { flag: '🇸🇱', dialCode: '+232', name: 'Sierra Leone' },
  '113': { flag: '🇸🇬', dialCode: '+65', name: 'Singapore' },
  '114': { flag: '🇸🇰', dialCode: '+421', name: 'Slovakia' },
  '115': { flag: '🇿🇦', dialCode: '+27', name: 'South Africa' },
  '116': { flag: '🇰🇷', dialCode: '+82', name: 'South Korea' },
  '117': { flag: '🇪🇸', dialCode: '+34', name: 'Spain' },
  '118': { flag: '🇱🇰', dialCode: '+94', name: 'Sri Lanka' },
  '119': { flag: '🇸🇩', dialCode: '+249', name: 'Sudan' },
  '120': { flag: '🇸🇿', dialCode: '+268', name: 'Swaziland' },
  '121': { flag: '🇨🇭', dialCode: '+41', name: 'Switzerland' },
  '122': { flag: '🇹🇯', dialCode: '+992', name: 'Tajikistan' },
  '123': { flag: '🇹🇼', dialCode: '+886', name: 'Taiwan' },
  '124': { flag: '🇹🇭', dialCode: '+66', name: 'Thailand' },
  '125': { flag: '🇹🇬', dialCode: '+228', name: 'Togo' },
  '126': { flag: '🇹🇳', dialCode: '+216', name: 'Tunisia' },
  '127': { flag: '🇹🇲', dialCode: '+993', name: 'Turkmenistan' },
  '128': { flag: '🇺🇬', dialCode: '+256', name: 'Uganda' },
  '129': { flag: '🇦🇪', dialCode: '+971', name: 'UAE' },
  '130': { flag: '🇺🇾', dialCode: '+598', name: 'Uruguay' },
  '131': { flag: '🇺🇿', dialCode: '+998', name: 'Uzbekistan' },
  '132': { flag: '🇻🇪', dialCode: '+58', name: 'Venezuela' },
  '133': { flag: '🇾🇪', dialCode: '+967', name: 'Yemen' },
  '134': { flag: '🇿🇲', dialCode: '+260', name: 'Zambia' },
  '135': { flag: '🇿🇼', dialCode: '+263', name: 'Zimbabwe' },
  '136': { flag: '🇦🇿', dialCode: '+994', name: 'Azerbaijan' },
  '137': { flag: '🇧🇭', dialCode: '+973', name: 'Bahrain' },
  '138': { flag: '🇱🇧', dialCode: '+961', name: 'Lebanon' },
  '139': { flag: '🇱🇾', dialCode: '+218', name: 'Libya' },
  '140': { flag: '🇵🇸', dialCode: '+970', name: 'Palestine' },
  '141': { flag: '🇶🇦', dialCode: '+974', name: 'Qatar' },
  '142': { flag: '🇸🇴', dialCode: '+252', name: 'Somalia' },
  '143': { flag: '🇸🇾', dialCode: '+963', name: 'Syria' },
  '144': { flag: '🇦🇹', dialCode: '+43', name: 'Austria' },
  '145': { flag: '🇸🇮', dialCode: '+386', name: 'Slovenia' },
  '146': { flag: '🇱🇺', dialCode: '+352', name: 'Luxembourg' },
  '147': { flag: '🇲🇹', dialCode: '+356', name: 'Malta' },
  '148': { flag: '🇲🇪', dialCode: '+382', name: 'Montenegro' },
  '149': { flag: '🇲🇰', dialCode: '+389', name: 'North Macedonia' },
};

function SmsbowerImportContent() {
  const navigate = useNavigate();
  const { resolvedTheme } = useAdminTheme();
  const { user } = useAuth();
  const isDark = resolvedTheme === 'dark';
  
  const [step, setStep] = useState<'api-key' | 'countries' | 'services' | 'complete'>('api-key');
  const [apiKey, setApiKey] = useState('');
  const [serverName, setServerName] = useState('');
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [servicesByCountry, setServicesByCountry] = useState<Record<string, ServiceData[]>>({});
  const [activeCountryView, setActiveCountryView] = useState<string>('');
  const [marginPercent, setMarginPercent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [searchCountry, setSearchCountry] = useState('');
  const [visibleServices, setVisibleServices] = useState(50);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 100 });
  const [usdtToInr, setUsdtToInr] = useState<number>(0);
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set());
  const [showMarginConfirm, setShowMarginConfirm] = useState(false);


  // Fetch USDT rate on page load
  useEffect(() => {
    const initUsdtRate = async () => {
      const rate = await fetchUsdtToInr();
      setUsdtToInr(rate);
    };
    initUsdtRate();
    
    return () => {
      if (step !== 'complete') {
        console.log('[smsbower-import] Process cancelled, cleaning up');
      }
    };
  }, []);

  // Handle Enter key for different steps
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        
        if (step === 'api-key' && apiKey.length >= 20 && serverName.trim()) {
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

  // Fetch USDT to INR rate from Binance P2P via edge function
  const fetchUsdtToInr = async (): Promise<number> => {
    try {
      const { data, error } = await supabase.functions.invoke('smsbower-proxy', {
        body: { action: 'getUsdtRate' }
      });
      
      if (error) throw error;
      
      const price = data?.rate || 0;
      console.log('[smsbower] USDT to INR rate:', price);
      return price;
    } catch (error) {
      console.error('Error fetching USDT rate:', error);
      return 85; // Fallback rate
    }
  };

  const validateApiKey = (key: string) => {
    const trimmedKey = key.trim();
    
    // Smsbower API keys are usually 32 characters alphanumeric
    if (trimmedKey.length >= 20 && /^[a-zA-Z0-9]+$/.test(trimmedKey)) {
      setApiKeyError(null);
      return true;
    }
    
    setApiKeyError('invalid');
    return false;
  };

  const fetchCountries = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Smsbower API key first.",
        variant: "destructive",
      });
      return;
    }

    setLoadingCountries(true);
    try {
      const { data: proxyData, error } = await supabase.functions.invoke('smsbower-proxy', {
        body: { action: 'getCountries', apiKey }
      });
      
      if (error) throw error;
      
      const data = proxyData?.data;
      if (!data) throw new Error('No data received');
      
      // Parse countries - format: { "0": { "eng": "Russia", "rus": "...", "vis": 1 }, ... }
      const parsedCountries: CountryData[] = [];
      
      for (const [code, countryData] of Object.entries(data)) {
        const cData = countryData as { eng?: string; visible?: number; vis?: number };
        if (cData.eng && (cData.visible === 1 || cData.vis === 1 || cData.visible === undefined)) {
          // Get flag from fiveSimCountries data (same country codes)
          const countryFromFiveSim = fiveSimCountries.find(c => c.code === parseInt(code));
          const flag = countryFromFiveSim?.flag || countryCodeToInfo[code]?.flag || '🌍';
          
          parsedCountries.push({
            code,
            name: cData.eng,
            flag
          });
        }
      }

      // Sort by code (numeric)
      parsedCountries.sort((a, b) => parseInt(a.code) - parseInt(b.code));
      
      setCountries(parsedCountries);
      
      toast({
        title: "Countries Loaded",
        description: `Found ${parsedCountries.length} countries.`,
      });
    } catch (error) {
      console.error('Error fetching countries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch countries. Please check your API key.",
        variant: "destructive",
      });
    } finally {
      setLoadingCountries(false);
    }
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
      setLoadingCountries(true);
      try {
        // Fetch USDT rate and countries in parallel
        const [rate, countriesCount] = await Promise.all([
          fetchUsdtToInr(),
          (async () => {
            const { data: proxyData, error } = await supabase.functions.invoke('smsbower-proxy', {
              body: { action: 'getCountries', apiKey }
            });
            if (error) throw error;

            const raw = proxyData?.data;
            if (!raw) return 0;

            const parsedCountries: CountryData[] = [];
            for (const [code, countryData] of Object.entries(raw)) {
              const cData = countryData as { eng?: string; visible?: number; vis?: number };
              if (cData.eng && (cData.visible === 1 || cData.vis === 1 || cData.visible === undefined)) {
                const countryFromFiveSim = fiveSimCountries.find(c => c.code === parseInt(code));
                const flag = countryFromFiveSim?.flag || countryCodeToInfo[code]?.flag || '🌍';
                parsedCountries.push({ code, name: cData.eng, flag });
              }
            }
            parsedCountries.sort((a, b) => parseInt(a.code) - parseInt(b.code));
            setCountries(parsedCountries);
            return parsedCountries.length;
          })()
        ]);

        setUsdtToInr(rate);

        toast({
          title: "USDT Rate Updated",
          description: `USDT → INR: ₹${(rate || 0).toFixed(2)}`,
        });

        toast({
          title: "Countries Loaded",
          description: `Found ${countriesCount} countries.`,
        });

        setStep('countries');
      } catch (error) {
        console.error('Error during setup:', error);
        toast({
          title: "Error",
          description: "Failed to fetch data. Please check your API key.",
          variant: "destructive",
        });
      } finally {
        setLoadingCountries(false);
      }
    }
  };

  const toggleCountry = (code: string) => {
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

  // Get logo URL using nested directory structure
  const getLogoUrl = (shortCode: string | null): string | null => {
    if (!shortCode) return null;
    return getServiceLogoUrl(shortCode);
  };

  // Search in local JSON file
  const findCodeInLocalFile = (serviceName: string): string | null => {
    const normalized = serviceName.toLowerCase().trim();
    const localData = localServiceCodes as { status?: string; services?: ServiceCodeEntry[] };
    const servicesData = localData.services || [];
    
    for (const entry of servicesData) {
      if (entry.name && entry.name.toLowerCase().includes(normalized) && entry.code) {
        return entry.code;
      }
      if (entry.name && normalized.includes(entry.name.toLowerCase()) && entry.code) {
        return entry.code;
      }
    }
    return null;
  };

  // Search in smsbower cache
  const findCodeInCache = (serviceName: string): string | null => {
    if (!smsbowerServiceCache) return null;
    const normalized = serviceName.toLowerCase().trim();
    
    for (const entry of smsbowerServiceCache) {
      if (entry.name && entry.name.toLowerCase().includes(normalized) && entry.code) {
        return entry.code;
      }
      if (entry.name && normalized.includes(entry.name.toLowerCase()) && entry.code) {
        return entry.code;
      }
    }
    return null;
  };

  const findShortCode = (serviceName: string): string | null => {
    let code = findCodeInLocalFile(serviceName);
    if (code) return code;
    
    code = findCodeInCache(serviceName);
    if (code) return code;
    
    return null;
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
    try {
      // Fetch service list for caching via edge function
      const { data: servicesListProxyData, error: servicesListError } = await supabase.functions.invoke('smsbower-proxy', {
        body: { action: 'getServicesList', apiKey }
      });
      
      if (servicesListError) throw servicesListError;
      
      const servicesListData = servicesListProxyData?.data;
      if (servicesListData?.services) {
        smsbowerServiceCache = servicesListData.services;
      } else if (Array.isArray(servicesListData)) {
        smsbowerServiceCache = servicesListData;
      }

      // Fetch prices for each selected country - store separately by country
      const allServices: Map<string, ServiceData> = new Map();
      const perCountryServices: Record<string, ServiceData[]> = {};
      
      for (const countryCode of selectedCountries) {
        const { data: pricesProxyData, error: pricesError } = await supabase.functions.invoke('smsbower-proxy', {
          body: { action: 'getPricesV3', apiKey, country: countryCode }
        });
        
        if (pricesError) throw pricesError;
        
        const pricesData = pricesProxyData?.data;
        if (!pricesData) continue;
        
        // Per-country services map
        const countryServicesMap: Map<string, ServiceData> = new Map();
        
        // Parse prices - format: { "22": { "fb": { "2266": { count, price, provider_id }, ... }, ... } }
        // The first key is country code, then service code, then provider ID
        for (const [countryCodeInner, countryServices] of Object.entries(pricesData)) {
          if (typeof countryServices !== 'object') continue;
          
          for (const [serviceCode, providers] of Object.entries(countryServices as Record<string, Record<string, ProviderData>>)) {
            if (typeof providers !== 'object') continue;
            
            const existingService = allServices.get(serviceCode);
            const existingCountryService = countryServicesMap.get(serviceCode);
            const providersList: { providerId: number; price: number; count: number }[] = [];
            
            for (const [providerId, providerData] of Object.entries(providers)) {
              if (typeof providerData === 'object' && providerData.provider_id) {
                providersList.push({
                  providerId: providerData.provider_id,
                  price: providerData.price || 0,
                  count: providerData.count || 0
                });
              }
            }
            
            // Find service name from cache
            let serviceName = serviceCode;
            if (smsbowerServiceCache) {
              const cached = smsbowerServiceCache.find(s => s.code === serviceCode);
              if (cached) serviceName = cached.name;
            }
            
            const shortCode = findShortCode(serviceName);
            const logoUrl = getLogoUrl(shortCode);
            
            // Add to country-specific map
            if (existingCountryService) {
              for (const p of providersList) {
                if (!existingCountryService.providers.find(ep => ep.providerId === p.providerId)) {
                  existingCountryService.providers.push(p);
                }
              }
            } else {
              countryServicesMap.set(serviceCode, {
                code: serviceCode,
                name: serviceName,
                shortCode,
                logoUrl,
                providers: [...providersList]
              });
            }
            
            // Add to merged services map
            if (existingService) {
              for (const p of providersList) {
                if (!existingService.providers.find(ep => ep.providerId === p.providerId)) {
                  existingService.providers.push(p);
                }
              }
            } else {
              allServices.set(serviceCode, {
                code: serviceCode,
                name: serviceName,
                shortCode,
                logoUrl,
                providers: [...providersList]
              });
            }
          }
        }
        
        // Store services for this country
        perCountryServices[countryCode] = Array.from(countryServicesMap.values());
      }
      
      const parsedServices = Array.from(allServices.values());
      setServices(parsedServices);
      setServicesByCountry(perCountryServices);
      setActiveCountryView(selectedCountries.length > 1 ? selectedCountries[0] : '');
      setStep('services');
      
      toast({
        title: "Services Fetched",
        description: `Found ${parsedServices.length} services for ${selectedCountries.length} countries.`,
      });
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: "Error Fetching Services",
        description: error instanceof Error ? error.message : "Failed to fetch services from Smsbower.",
        variant: "destructive",
      });
    } finally {
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

    setLoading(true);
    setImportProgress({ current: 0, total: 100 });
    
    try {
      // Build list of server names that will be created (using country names as suffix)
      const serverNamesToCreate = selectedCountries.length > 1
        ? selectedCountries.map((countryCode) => {
            const country = countries.find(c => c.code === countryCode);
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

      // Prepare server inserts for each country
      const serverInserts = selectedCountries.map((countryCode) => {
        const country = countries.find(c => c.code === countryCode);
        if (!country) return null;
        
        const info = countryCodeToInfo[countryCode] || { flag: '🌍', dialCode: '+0' };
        
        // Add country name when multiple countries selected
        const finalServerName = selectedCountries.length > 1 
          ? `${serverName.trim()} ${country.name}`
          : serverName.trim();
        
        // Smsbower API URLs
        const apiGetNumberUrl = `https://smsbower.online/stubs/handler_api.php?api_key=${apiKey}&action=getNumber&service={service_code}&country=${countryCode}&providerIds={provider_id}&ref=396770`;
        const apiGetMessageUrl = `https://smsbower.online/stubs/handler_api.php?api_key=${apiKey}&action=getStatus&id={id}`;
        const apiNextMessageUrl = `https://smsbower.online/stubs/handler_api.php?api_key=${apiKey}&action=setStatus&status=3&id={id}`;
        const apiCancelUrl = `https://smsbower.online/stubs/handler_api.php?api_key=${apiKey}&action=setStatus&status=8&id={id}`;

        return {
          server_name: finalServerName,
          country_code: countryCode,
          country_name: country.name,
          country_dial_code: info.dialCode,
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
          provider: 'smsbower',
          created_by: user.id
        };
      }).filter(Boolean);

      setImportProgress({ current: 10, total: 100 });

      // Batch insert all servers
      const { data: serversData, error: serversError } = await supabase
        .from('auto_sms_servers')
        .insert(serverInserts)
        .select('id, country_code');

      if (serversError || !serversData) {
        throw new Error('Failed to create servers: ' + serversError?.message);
      }

      setImportProgress({ current: 30, total: 100 });

      // Build server ID map
      const serverIdMap: Record<string, string> = {};
      serversData.forEach(s => {
        serverIdMap[s.country_code] = s.id;
      });

      // Prepare service inserts - each provider as separate entry
      const allServiceInserts: Array<{
        server_id: string;
        service_name: string;
        service_code: string;
        operator: string;
        operator_url: string;
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
        const serverId = serverIdMap[countryCode];
        if (!serverId) continue;

        for (const service of services) {
          // Add each provider as a separate entry
          for (const provider of service.providers) {
            // Convert USD price to INR using Binance rate
            const priceInInr = provider.price * (usdtToInr || 85);
            const margin = marginPercent ? Number(marginPercent) : 0;
            const finalPrice = priceInInr * (1 + margin / 100);
            
            allServiceInserts.push({
              server_id: serverId,
              service_name: service.name,
              service_code: service.shortCode || service.code,
              operator: provider.providerId.toString(),
              logo_url: service.logoUrl || DEFAULT_SERVICE_ICON,
              base_price: priceInInr,
              margin_percentage: margin,
              final_price: finalPrice,
              cancel_disable_time: 0,
              is_popular: false,
              is_active: provider.count > 0,
              created_by: user.id
            } as any);
          }
        }
      }

      setImportProgress({ current: 50, total: 100 });

      // Batch insert with larger chunks
      const BATCH_SIZE = 500;
      const batches = [];
      for (let i = 0; i < allServiceInserts.length; i += BATCH_SIZE) {
        batches.push(allServiceInserts.slice(i, i + BATCH_SIZE));
      }

      // Insert batches in parallel
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

  const filteredCountries = countries.filter(c => 
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

      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 sm:p-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Smsbower Direct Import</h1>
              <p className="text-emerald-100">Import services automatically from Smsbower API</p>
            </div>
          </div>
          
          {/* Progress steps */}
          <div className="mt-6 flex items-center gap-2">
            {['api-key', 'countries', 'services', 'complete'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  step === s ? "bg-white text-emerald-600" :
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

      {/* Main content */}
      <div className={cn(
        "rounded-2xl p-6 sm:p-8",
        isDark ? "bg-gray-900 border border-gray-800" : "bg-white border border-gray-200 shadow-sm"
      )}>
        {/* Step 1: API Key */}
        {step === 'api-key' && (
          <div className="max-w-lg mx-auto space-y-6">
            <div className="text-center">
              <div className={cn(
                "w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4",
                "bg-gradient-to-br from-emerald-500 to-teal-600"
              )}>
                <Key className="w-8 h-8 text-white" />
              </div>
              <h2 className={cn("text-xl font-semibold mb-2", isDark ? "text-white" : "text-gray-900")}>
                Enter Your Smsbower API Key
              </h2>
              <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                Get your API key from Smsbower dashboard
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
                    placeholder="e.g., Smsbower Premium"
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
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
                    placeholder="Enter your Smsbower API key"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setApiKeyError(null);
                    }}
                    className={cn(
                      "h-12 pl-4 pr-12 font-mono text-sm",
                      isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200",
                      apiKeyError === 'invalid' && "border-red-500 focus:ring-red-500",
                      apiKeyError === null && apiKey.length >= 20 && "border-green-500 focus:ring-green-500"
                    )}
                  />
                  {apiKeyError === 'invalid' && (
                    <AlertTriangle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                  )}
                  {apiKeyError === null && apiKey.length >= 20 && (
                    <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                </div>
              </div>

              <Button
                onClick={handleApiKeySubmit}
                disabled={!apiKey || apiKey.length < 20 || !serverName.trim() || loadingCountries}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              >
                {loadingCountries ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading Countries...</>
                ) : (
                  'Continue to Country Selection'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Countries */}
        {step === 'countries' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className={cn("text-xl font-semibold", isDark ? "text-white" : "text-gray-900")}>
                  Select Countries
                </h2>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                  Select up to 5 countries to import ({selectedCountries.length}/5 selected)
                  {usdtToInr > 0 && <span className="ml-2 text-emerald-500">• USDT Rate: ₹{usdtToInr.toFixed(2)}</span>}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Search countries..."
                  value={searchCountry}
                  onChange={(e) => setSearchCountry(e.target.value)}
                  className={cn("w-full sm:w-64", isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200")}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={async () => {
                    setLoadingCountries(true);
                    try {
                      const ratePromise = fetchUsdtToInr()
                        .then((rate) => {
                          setUsdtToInr(rate);
                          return rate;
                        })
                        .catch((e) => {
                          console.error('[smsbower] Failed to refresh USDT rate:', e);
                          return null;
                        });

                      const countriesPromise = (async () => {
                        const { data: proxyData, error } = await supabase.functions.invoke('smsbower-proxy', {
                          body: { action: 'getCountries', apiKey }
                        });
                        if (error) throw error;

                        if (proxyData?.data) {
                          const parsedCountries: CountryData[] = [];
                          for (const [code, countryData] of Object.entries(proxyData.data)) {
                            const cData = countryData as { eng?: string; visible?: number; vis?: number };
                            if (cData.eng && (cData.visible === 1 || cData.vis === 1 || cData.visible === undefined)) {
                              const countryFromFiveSim = fiveSimCountries.find(c => c.code === parseInt(code));
                              const flag = countryFromFiveSim?.flag || countryCodeToInfo[code]?.flag || '🌍';
                              parsedCountries.push({ code, name: cData.eng, flag });
                            }
                          }
                          parsedCountries.sort((a, b) => parseInt(a.code) - parseInt(b.code));
                          setCountries(parsedCountries);
                          return parsedCountries.length;
                        }

                        return 0;
                      })().catch((e) => {
                        console.error('[smsbower] Failed to refresh countries:', e);
                        return null;
                      });

                      const [rate, countriesCount] = await Promise.all([ratePromise, countriesPromise]);

                      const parts: string[] = [];
                      if (typeof rate === 'number' && rate > 0) parts.push(`USDT: ₹${rate.toFixed(2)}`);
                      if (typeof countriesCount === 'number') parts.push(`${countriesCount} countries loaded`);

                      toast({
                        title: "Refreshed",
                        description: parts.join(' • ') || 'Refresh complete',
                      });
                    } finally {
                      setLoadingCountries(false);
                    }
                  }}
                  disabled={loadingCountries}
                  className={isDark ? "border-gray-700" : "border-gray-200"}
                >
                  <RefreshCw className={cn("w-4 h-4", loadingCountries && "animate-spin")} />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto p-1">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => toggleCountry(country.code)}
                  className={cn(
                    "relative p-3 rounded-xl border-2 transition-all text-left",
                    selectedCountries.includes(country.code)
                      ? "border-emerald-500 bg-emerald-500/10"
                      : isDark 
                        ? "border-gray-700 hover:border-gray-600 bg-gray-800/50" 
                        : "border-gray-200 hover:border-gray-300 bg-gray-50"
                  )}
                >
                  {selectedCountries.includes(country.code) && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
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
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
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

        {/* Step 3: Services */}
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
                  Set your margin percentage • USDT Rate: ₹{usdtToInr.toFixed(2)}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>Margin %</span>
                <Input
                  type="number"
                  min={0}
                  max={500}
                  value={marginPercent}
                  onChange={(e) => setMarginPercent(e.target.value)}
                  placeholder="Enter margin %"
                  className={cn("w-32", isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200")}
                />
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
                    const country = countries.find(c => c.code === countryCode);
                    const isActive = activeCountryView === countryCode;
                    const serviceCount = servicesByCountry[countryCode]?.length || 0;
                    
                    return (
                      <div key={countryCode} className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setActiveCountryView(countryCode);
                            setVisibleServices(50);
                          }}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
                            isActive
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                              : isDark
                                ? "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"
                                : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                          )}
                        >
                          <span className="text-lg">{country?.flag || '🌍'}</span>
                          <span className="text-sm font-medium">{country?.name || countryCode}</span>
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded-full",
                            isActive ? "bg-emerald-500/20" : isDark ? "bg-gray-700" : "bg-gray-200"
                          )}>
                            {serviceCount}
                          </span>
                        </button>
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
                
                return (
                  <>
                    {displayServices.slice(0, visibleServices).map((service) => {
                      const bestProvider = service.providers.find(p => p.count > 0) || service.providers[0];
                      const basePrice = bestProvider ? bestProvider.price * (usdtToInr || 85) : 0;
                      const margin = marginPercent ? Number(marginPercent) : 0;
                      const finalPrice = margin > 0 ? (basePrice * (1 + margin / 100)).toFixed(2) : basePrice.toFixed(2);
                      const totalStock = service.providers.reduce((sum, p) => sum + p.count, 0);
                      
                      return (
                        <div
                          key={service.code}
                          className={cn(
                            "p-4 rounded-xl border flex items-center justify-between gap-4",
                            isDark ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"
                          )}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {service.logoUrl ? (
                              <img src={service.logoUrl} alt={service.name} className="w-8 h-8 rounded-lg object-cover" />
                            ) : (
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                                isDark ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-500"
                              )}>
                                {service.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={cn("font-medium truncate", isDark ? "text-gray-200" : "text-gray-800")}>
                                {service.name}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(expandedProviders.has(service.code) ? service.providers : service.providers.slice(0, 3)).map(p => (
                                  <span
                                    key={p.providerId}
                                    className={cn(
                                      "text-xs px-2 py-0.5 rounded-full",
                                      p.count > 0 ? "bg-green-500/10 text-green-500" : "bg-gray-500/10 text-gray-500"
                                    )}
                                  >
                                    #{p.providerId}: {p.count}
                                  </span>
                                ))}
                                {service.providers.length > 3 && !expandedProviders.has(service.code) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedProviders(prev => new Set([...prev, service.code]));
                                    }}
                                    className={cn(
                                      "text-xs px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity",
                                      isDark ? "bg-gray-700 text-gray-400 hover:bg-gray-600" : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                                    )}
                                  >
                                    +{service.providers.length - 3} more
                                  </button>
                                )}
                                {service.providers.length > 3 && expandedProviders.has(service.code) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedProviders(prev => {
                                        const next = new Set(prev);
                                        next.delete(service.code);
                                        return next;
                                      });
                                    }}
                                    className={cn(
                                      "text-xs px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity",
                                      isDark ? "bg-gray-700 text-gray-400 hover:bg-gray-600" : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                                    )}
                                  >
                                    Show less
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
                              Stock: {totalStock}
                            </p>
                            <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                              Base: ₹{basePrice.toFixed(2)}
                            </p>
                            <p className="text-sm font-semibold text-green-500">Final: ₹{finalPrice}</p>
                          </div>
                        </div>
                      );
                    })}
                    {visibleServices < displayServices.length && (
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
                    )}
                  </>
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
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
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

        {/* Step 4: Complete */}
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
                Successfully imported {services.length} services for {selectedCountries.length} countries from Smsbower.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/services/direct-import')}
                className={isDark ? "border-gray-700" : "border-gray-200"}
              >
                Import More
              </Button>
              <Button
                onClick={() => navigate('/admin/services')}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              >
                Go to Services
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SmsbowerImportPage() {
  return (
    <AdminLayout title="Smsbower Import">
      <SmsbowerImportContent />
    </AdminLayout>
  );
}
