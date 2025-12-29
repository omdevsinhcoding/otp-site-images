import { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { BannedUserOverlay } from "@/components/ui/BannedUserOverlay";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { RoughUnderlineStatus } from "@/components/ui/RoughUnderlineStatus";
import { CancelCountdown, AutoCancelCountdown } from "@/components/ui/CancelCountdown";
import { isToastEnabled } from "@/data/toastRegistry";

interface Server {
  id: string;
  server_name: string;
  country_flag: string;
  country_name: string;
  country_code: string;
  country_dial_code: string;
  is_active: boolean;
}

interface Service {
  id: string;
  service_name: string;
  service_code: string;
  final_price: number;
  logo_url: string | null;
  server_id: string;
  is_popular: boolean;
  cancel_disable_time: number;
  operator?: string; // For auto_services - different operators on same server
}

interface GroupedService {
  service_name: string;
  logo_url: string | null;
  servers: { server: Server; service: Service }[];
  minPrice: number;
  maxPrice: number;
  is_popular: boolean;
}

interface ActiveNumber {
  id: string;
  activation_id: string;
  phone_number: string;
  price: number;
  status: string;
  messages: { text: string; received_at: string }[];
  has_otp_received: boolean;
  created_at: string;
  server_name: string;
  country_dial_code: string;
  service_name: string;
  service_logo: string | null;
  server_id?: string;
  service_id?: string;
  cancel_disable_time?: number;
}

import { DEFAULT_SERVICE_ICON } from "@/lib/logoUtils";

// Memoized mobile service item - Clean row design like 5sim
const MobileServiceItem = memo(({ 
  groupedService, 
  isFavorited, 
  stock, 
  isGettingNumber, 
  toggleFavorite, 
  handleSelectService 
}: { 
  groupedService: GroupedService; 
  isFavorited: boolean; 
  stock: number | null; 
  isGettingNumber: boolean; 
  toggleFavorite: (name: string, e: React.MouseEvent) => void; 
  handleSelectService: (s: GroupedService) => void; 
}) => {
  const formattedStock = stock !== null && stock > 0 
    ? (stock >= 10000 ? `${(stock / 1000).toFixed(0)}K+` : `${stock}`)
    : null;

  const stockText = stock !== null && stock > 0 
    ? (stock >= 10000 ? `${(stock / 1000).toFixed(0)}K+ available` : `${stock} available`)
    : stock === 0 ? 'Out of stock' : null;

  return (
    <button
      onClick={() => handleSelectService(groupedService)}
      disabled={isGettingNumber || (stock !== null && stock === 0)}
      className="w-full flex items-center gap-3 py-3.5 px-4 bg-card hover:bg-muted/50 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed text-left active:bg-muted/70"
    >
      {/* Favorite star */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(groupedService.service_name, e);
        }}
        disabled={isGettingNumber}
        className="shrink-0 p-1 -m-1 disabled:opacity-50"
        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill={isFavorited ? "#f59e0b" : "none"}
          stroke={isFavorited ? "#f59e0b" : "#d1d5db"}
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
        </svg>
      </button>

      {/* Service icon - circular */}
      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-muted">
        <OptimizedImage
          src={groupedService.logo_url || DEFAULT_SERVICE_ICON}
          alt=""
          width={40}
          height={40}
          className="w-full h-full object-cover"
          fallbackSrc={DEFAULT_SERVICE_ICON}
        />
      </div>

      {/* Service info - name + availability */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[15px] font-medium text-foreground truncate">
          {groupedService.service_name}
        </h3>
        {stockText && (
          <span className={`text-xs ${stock === 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {stockText}
          </span>
        )}
      </div>

      {/* Blue pill price badge */}
      <div className="shrink-0 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-semibold">
        ₹{groupedService.minPrice.toFixed(2)}
      </div>
    </button>
  );
});
MobileServiceItem.displayName = 'MobileServiceItem';

// Virtualized mobile list
const MobileServiceList = memo(({
  services,
  favorites,
  serviceStockCache,
  isGettingNumber,
  toggleFavorite,
  handleSelectService
}: {
  services: GroupedService[];
  favorites: Set<string>;
  serviceStockCache: Map<string, number | null>;
  isGettingNumber: boolean;
  toggleFavorite: (name: string, e: React.MouseEvent) => void;
  handleSelectService: (s: GroupedService) => void;
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: services.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  return (
    <div 
      ref={parentRef} 
      className="max-h-[calc(100dvh-220px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const groupedService = services[virtualItem.index];
          return (
            <div
              key={groupedService.service_name}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className="border-b border-border"
            >
              <MobileServiceItem
                groupedService={groupedService}
                isFavorited={favorites.has(groupedService.service_name)}
                stock={serviceStockCache.get(groupedService.service_name) ?? null}
                isGettingNumber={isGettingNumber}
                toggleFavorite={toggleFavorite}
                handleSelectService={handleSelectService}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});
MobileServiceList.displayName = 'MobileServiceList';

// Memoized desktop service card
const DesktopServiceCard = memo(({ 
  groupedService, 
  isFavorited, 
  stock, 
  isGettingNumber, 
  toggleFavorite, 
  handleSelectService 
}: { 
  groupedService: GroupedService; 
  isFavorited: boolean; 
  stock: number | null; 
  isGettingNumber: boolean; 
  toggleFavorite: (name: string, e: React.MouseEvent) => void; 
  handleSelectService: (s: GroupedService) => void; 
}) => (
  <div className="group relative text-left p-4 rounded-xl bg-card border border-border shadow-sm transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md hover:border-primary/40">
    <button
      onClick={(e) => toggleFavorite(groupedService.service_name, e)}
      disabled={isGettingNumber}
      className="absolute top-2 right-2 z-10 p-1 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <svg
        className={`w-4 h-4 transition-colors ${isFavorited ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-muted-foreground hover:text-yellow-400"}`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </button>
    
    {groupedService.is_popular && (
      <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold shadow-sm">
        HOT
      </span>
    )}
    
    <button
      onClick={() => handleSelectService(groupedService)}
      disabled={isGettingNumber}
      className="w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={`Select ${groupedService.service_name} service, ₹${groupedService.minPrice}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-muted">
          <OptimizedImage
            src={groupedService.logo_url || DEFAULT_SERVICE_ICON}
            alt=""
            width={44}
            height={44}
            className="w-full h-full object-cover"
            fallbackSrc={DEFAULT_SERVICE_ICON}
          />
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <p className="font-semibold text-foreground truncate text-base group-hover:text-primary transition-colors">{groupedService.service_name}</p>
          <p className="text-xs text-muted-foreground">{groupedService.servers.length} server{groupedService.servers.length > 1 ? "s" : ""}</p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          {stock !== null ? (
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
              stock > 0 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-red-100 text-red-600'
            }`}>
              {stock > 0 ? `${stock >= 10000 ? `${(stock / 1000).toFixed(1)}K` : stock} in stock` : 'Out of stock'}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
        <span className="text-lg font-bold text-primary">₹{groupedService.minPrice.toFixed(2)}</span>
      </div>
    </button>
  </div>
));
DesktopServiceCard.displayName = 'DesktopServiceCard';

// Virtualized desktop grid using chunked rows
const DesktopServiceGrid = memo(({
  services,
  favorites,
  serviceStockCache,
  isGettingNumber,
  toggleFavorite,
  handleSelectService
}: {
  services: GroupedService[];
  favorites: Set<string>;
  serviceStockCache: Map<string, number | null>;
  isGettingNumber: boolean;
  toggleFavorite: (name: string, e: React.MouseEvent) => void;
  handleSelectService: (s: GroupedService) => void;
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Calculate columns based on screen size (approximation, will be 2-4 cols)
  const columnsPerRow = 3; // Average for virtualization
  const rowCount = Math.ceil(services.length / columnsPerRow);
  
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 160,
    overscan: 3,
  });

  return (
    <div 
      ref={parentRef}
      className="hidden md:block max-h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-2"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const startIdx = virtualRow.index * columnsPerRow;
          const rowServices = services.slice(startIdx, startIdx + columnsPerRow);
          
          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-4"
            >
              {rowServices.map((groupedService) => (
                <DesktopServiceCard
                  key={groupedService.service_name}
                  groupedService={groupedService}
                  isFavorited={favorites.has(groupedService.service_name)}
                  stock={serviceStockCache.get(groupedService.service_name) ?? null}
                  isGettingNumber={isGettingNumber}
                  toggleFavorite={toggleFavorite}
                  handleSelectService={handleSelectService}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
});
DesktopServiceGrid.displayName = 'DesktopServiceGrid';

export default function GetNumber() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Helper function to show API status toast if enabled
  const showApiStatusToast = useCallback((apiStatus: string, variant?: "default" | "destructive") => {
    const statusToastMap: Record<string, string> = {
      'ACCESS_NUMBER': 'api_status_access_number',
      'NO_NUMBER': 'api_status_no_number',
      'STATUS_WAIT_CODE': 'api_status_wait_code',
      'STATUS_OK': 'api_status_ok',
      'STATUS_CANCEL': 'api_status_cancel',
      'ACCESS_CANCEL': 'api_status_cancel',
      'BAD_KEY': 'api_status_bad_key',
      'BAD_ACTION': 'api_status_bad_action',
      'NO_ACTIVATION': 'api_status_no_activation',
      'BAD_STATUS': 'api_status_bad_status',
      'STATUS_WAIT_RETRY': 'api_status_wait_retry',
      'EARLY_CANCEL_DENIED': 'api_status_early_cancel',
      'STILL_ACTIVE': 'api_status_still_active',
      'ACCESS_RETRY_GET': 'api_status_success',
      'TIMEOUT': 'api_status_timeout',
      'ERROR': 'api_status_error',
    };
    
    const toastId = statusToastMap[apiStatus];
    if (toastId && isToastEnabled(toastId)) {
      toast({ description: `API: ${apiStatus}`, variant });
    }
  }, [toast]);

  const [servers, setServers] = useState<Server[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedGroupedService, setSelectedGroupedService] = useState<GroupedService | null>(null);
  const [selectedServerService, setSelectedServerService] = useState<{ server: Server; service: Service } | null>(null);

  const [activeNumbers, setActiveNumbers] = useState<ActiveNumber[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<ActiveNumber | null>(null);
  const [isGettingNumber, setIsGettingNumber] = useState(false);
  const [pollingIntervals, setPollingIntervals] = useState<Map<string, NodeJS.Timeout>>(new Map());

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  const [balance, setBalance] = useState<number>(0);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const [refreshAnimationKey, setRefreshAnimationKey] = useState(0);
  const MOBILE_VISIBLE_COUNT = 10;

  // Stock data for 5sim services: { serverId: { "servicecode_0": "stockCount" } }
  const [stockData, setStockData] = useState<Record<string, Record<string, string>>>({});
  const [fiveSimServerIds, setFiveSimServerIds] = useState<string[]>([]);
  
  // Stock data for smsbower services: { serverId: { "serviceCode_operator": count } }
  const [smsbowerStockData, setSmsbowerStockData] = useState<Record<string, Record<string, number>>>({});
  const [smsbowerServerIds, setSmsbowerServerIds] = useState<string[]>([]);
  
  // App settings
  const [showOperator, setShowOperator] = useState(true);

  // Fetch favorites from Supabase
  const fetchFavorites = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('user_favorite_services')
      .select('service_name')
      .eq('user_id', user.id);
    
    if (data && !error) {
      setFavorites(new Set(data.map(f => f.service_name)));
    }
  };

  // Fetch 5sim stock data
  const fetchStockData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fivesim-stock');
      if (error) {
        console.error('Error fetching stock data:', error);
        return;
      }
      if (data?.success && data?.stockData) {
        setStockData(data.stockData);
        setFiveSimServerIds(data.serverIds || []);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
    }
  };

  // Fetch smsbower stock data for all smsbower servers (uses secure edge function)
  const fetchSmsbowerStockData = async () => {
    try {
      // Use the secure edge function that fetches API keys from DB
      const { data: stockResponse, error } = await supabase.functions.invoke('smsbower-proxy', {
        body: { action: 'getAllStock' }
      });
      
      if (error || !stockResponse?.success) {
        return;
      }
      
      setSmsbowerStockData(stockResponse.stockData || {});
      setSmsbowerServerIds(stockResponse.serverIds || []);
    } catch (error) {
      console.error('Error fetching smsbower stock data:', error);
    }
  };

  // Fetch operator visibility setting
  const fetchOperatorSetting = async () => {
    try {
      const { data } = await supabase.rpc('get_app_setting', { p_setting_key: 'show_operator_in_get_number' });
      if (data !== null) {
        setShowOperator(data === true || data === 'true');
      }
    } catch (error) {
      console.error('Error fetching operator setting:', error);
    }
  };

  useEffect(() => {
    fetchAllData();
    fetchStockData(); // Fetch 5sim stock data on mount
    fetchSmsbowerStockData(); // Fetch smsbower stock data on mount
    fetchOperatorSetting(); // Fetch operator visibility setting
    if (user?.id) {
      fetchActiveNumbers();
      fetchBalance();
      fetchFavorites();
    }
    return () => {
      pollingIntervals.forEach((interval) => clearInterval(interval));
    };
  }, [user?.id]);

  const fetchBalance = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase.rpc("get_wallet_balance", { p_user_id: user.id });
      setBalance(data || 0);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // Use SECURITY DEFINER functions to fetch combined data securely
      const [serversRes, servicesRes] = await Promise.all([
        supabase.rpc("get_public_servers"),
        supabase.rpc("get_public_services"),
      ]);
      
      if (serversRes.error) console.error("get_public_servers error:", serversRes.error);
      if (servicesRes.error) console.error("get_public_services error:", servicesRes.error);
      
      const allServers = (serversRes.data || []) as unknown as Server[];
      const allServices = (servicesRes.data || []) as unknown as Service[];
      
      setServers(allServers);
      setServices(allServices);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ description: "Failed to load data" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActiveNumbers = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase.rpc("get_user_active_numbers", { p_user_id: user.id });
      if (error) throw error;
      const numbers = (Array.isArray(data) ? data : []) as unknown as ActiveNumber[];
      
      // Preserve existing order - update data for existing numbers, remove cancelled ones, add new ones at top
      setActiveNumbers((prev) => {
        const existingIds = new Set(prev.map(n => n.activation_id));
        const fetchedIds = new Set(numbers.map(n => n.activation_id));
        
        // Update existing numbers with fresh data while keeping their position
        const updatedPrev = prev
          .filter(n => fetchedIds.has(n.activation_id)) // Remove numbers no longer in database
          .map(existing => {
            const updated = numbers.find(n => n.activation_id === existing.activation_id);
            return updated || existing;
          });
        
        // Add any new numbers at the top (shouldn't happen on refresh, but handles edge cases)
        const newNumbers = numbers.filter(n => !existingIds.has(n.activation_id));
        return [...newNumbers, ...updatedPrev];
      });
      
      numbers.forEach((num) => {
        if (!pollingIntervals.has(num.activation_id) && !num.has_otp_received && num.status === 'active') {
          startPolling(num.activation_id, num.status);
        }
      });
    } catch (error) {
      console.error("Error fetching active numbers:", error);
    }
  };

  const startPolling = (activationId: string, status: string = 'active') => {
    // Only start polling for active numbers
    if (status !== 'active') return;
    if (pollingIntervals.has(activationId)) return; // Already polling
    
    const interval = setInterval(() => {
      checkForMessage(activationId);
    }, 5000);
    setPollingIntervals((prev) => new Map(prev).set(activationId, interval));
  };

  const stopPolling = (activationId: string) => {
    const interval = pollingIntervals.get(activationId);
    if (interval) {
      clearInterval(interval);
      setPollingIntervals((prev) => {
        const newMap = new Map(prev);
        newMap.delete(activationId);
        return newMap;
      });
    }
  };

  const checkForMessage = async (activationId: string) => {
    if (!user?.id) return;
    
    // Check if this activation is still in our active numbers list before polling
    const isStillActive = activeNumbers.some(n => n.activation_id === activationId && n.status === 'active');
    if (!isStillActive) {
      stopPolling(activationId);
      return;
    }
    
    try {
      const response = await supabase.functions.invoke("sms-api", {
        body: { action: "get_message", userId: user.id, activationId },
      });
      
      // Handle error responses
      if (!response.data?.success) {
        const errorType = response.data?.errorType;
        if (errorType === 'BAD_KEY') {
          toast({ description: "Invalid API key", variant: "destructive" });
          stopPolling(activationId);
        } else if (errorType === 'BAD_ACTION') {
          toast({ description: "Invalid action", variant: "destructive" });
          stopPolling(activationId);
        } else if (errorType === 'NO_ACTIVATION') {
          stopPolling(activationId);
          setActiveNumbers((prev) => prev.filter((n) => n.activation_id !== activationId));
          if (selectedNumber?.activation_id === activationId) {
            setSelectedNumber(null);
          }
        }
        return;
      }
      
      // Handle auto-cancelled (20 min timeout)
      if (response.data?.auto_cancelled) {
        stopPolling(activationId);
        setActiveNumbers((prev) => prev.filter((n) => n.activation_id !== activationId));
        if (selectedNumber?.activation_id === activationId) {
          setSelectedNumber(null);
        }
        if (response.data?.new_balance !== undefined) {
          setBalance(response.data.new_balance);
        }
        toast({ description: "Number expired - Refunded" });
        return;
      }
      
      // Handle cancelled status - stop polling silently (no repeated toasts)
      if (response.data?.cancelled) {
        stopPolling(activationId);
        setActiveNumbers((prev) => prev.filter((n) => n.activation_id !== activationId));
        if (selectedNumber?.activation_id === activationId) {
          setSelectedNumber(null);
        }
        return;
      }
      
      // Handle OTP received
      if (response.data?.has_otp) {
        setActiveNumbers((prev) =>
          prev.map((num) => {
            if (num.activation_id === activationId) {
              const newMessages = [...num.messages, { text: response.data.message, received_at: new Date().toISOString() }];
              return { ...num, messages: newMessages, has_otp_received: true };
            }
            return num;
          })
        );
        setSelectedNumber((prev) => {
          if (prev?.activation_id === activationId) {
            return { ...prev, messages: [...prev.messages, { text: response.data.message, received_at: new Date().toISOString() }], has_otp_received: true };
          }
          return prev;
        });
        stopPolling(activationId);
        toast({ description: "SMS received!" });
      }
    } catch (error) {
      console.error("Error checking message:", error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshAnimationKey(prev => prev + 1); // Trigger underline animation
    await Promise.all([
      fetchAllData(),
      fetchStockData(), // Refresh stock data
      user?.id ? fetchActiveNumbers() : Promise.resolve(),
      user?.id ? fetchBalance() : Promise.resolve(),
    ]);
    setIsRefreshing(false);
  };

  const groupedServices = useMemo(() => {
    const groups = new Map<string, GroupedService>();
    services.forEach((service) => {
      const server = servers.find((s) => s.id === service.server_id);
      if (!server) return;
      const key = service.service_name.toLowerCase();
      if (groups.has(key)) {
        const existing = groups.get(key)!;
        existing.servers.push({ server, service });
        existing.minPrice = Math.min(existing.minPrice, service.final_price || 0);
        existing.maxPrice = Math.max(existing.maxPrice, service.final_price || 0);
        if (service.is_popular) existing.is_popular = true;
      } else {
        groups.set(key, {
          service_name: service.service_name,
          logo_url: service.logo_url,
          servers: [{ server, service }],
          minPrice: service.final_price || 0,
          maxPrice: service.final_price || 0,
          is_popular: service.is_popular,
        });
      }
    });
    return Array.from(groups.values()).sort((a, b) => {
      if (a.is_popular !== b.is_popular) return a.is_popular ? -1 : 1;
      return a.service_name.localeCompare(b.service_name);
    });
  }, [services, servers]);

  // Auto-select service from URL query parameter
  useEffect(() => {
    const serviceName = searchParams.get('service');
    if (serviceName && groupedServices.length > 0 && !selectedGroupedService) {
      const matchedService = groupedServices.find(
        (s) => s.service_name.toLowerCase() === serviceName.toLowerCase()
      );
      if (matchedService) {
        setSelectedGroupedService(matchedService);
        // Clear the query param after selecting
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, groupedServices, selectedGroupedService, setSearchParams]);

  const filteredServices = useMemo(() => {
    let result = groupedServices;
    
    // Filter favorites only if toggle is active
    if (showFavoritesOnly) {
      result = result.filter((s) => favorites.has(s.service_name));
    }
    
    if (searchQuery.trim()) {
      result = result.filter((s) => s.service_name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    // Sort favorites to top
    return result.sort((a, b) => {
      const aFav = favorites.has(a.service_name);
      const bFav = favorites.has(b.service_name);
      if (aFav !== bFav) return aFav ? -1 : 1;
      if (a.is_popular !== b.is_popular) return a.is_popular ? -1 : 1;
      return a.service_name.localeCompare(b.service_name);
    });
  }, [groupedServices, searchQuery, favorites, showFavoritesOnly]);

  // Helper function to normalize service name for matching
  const normalizeServiceName = useCallback((name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
  }, []);

  // Build aggregated stock index from raw API response (removes _0/_1 suffix and sums)
  const aggregatedStock = useMemo(() => {
    const result: Record<string, Record<string, number>> = {};
    
    for (const serverId of Object.keys(stockData)) {
      const serverData = stockData[serverId];
      const aggregated: Record<string, number> = {};
      
      for (const [key, value] of Object.entries(serverData)) {
        // Remove _0, _1, _2 etc suffix to get base service name
        const baseName = key.replace(/_\d+$/, '').toLowerCase();
        const stockValue = parseInt(value, 10);
        
        if (!isNaN(stockValue)) {
          aggregated[baseName] = (aggregated[baseName] || 0) + stockValue;
        }
      }
      
      result[serverId] = aggregated;
    }
    
    return result;
  }, [stockData]);

  // Pre-compute stock for all grouped services at once (much faster than per-item lookup)
  const stockMap = useMemo(() => {
    const has5simStock = Object.keys(aggregatedStock).length > 0;
    const hasSmsbowerStock = Object.keys(smsbowerStockData).length > 0;
    
    if (!has5simStock && !hasSmsbowerStock) return new Map<string, number | null>();
    
    const result = new Map<string, number | null>();
    
    // Build lookup index from aggregatedStock for faster matching
    const stockLookup = new Map<string, Map<string, number>>();
    for (const serverId of Object.keys(aggregatedStock)) {
      const normalized = new Map<string, number>();
      for (const [key, value] of Object.entries(aggregatedStock[serverId])) {
        normalized.set(normalizeServiceName(key), value);
      }
      stockLookup.set(serverId, normalized);
    }
    
    return result;
  }, [aggregatedStock, smsbowerStockData, normalizeServiceName]);

  // Helper function to get total stock for a grouped service from 5sim and smsbower servers
  const getServiceStock = useCallback((groupedService: GroupedService): number | null => {
    const has5simStock = Object.keys(aggregatedStock).length > 0;
    const hasSmsbowerStock = Object.keys(smsbowerStockData).length > 0;
    
    if (!has5simStock && !hasSmsbowerStock) return null;
    
    let totalStock = 0;
    let hasStock = false;
    
    // Normalize the service name for matching
    const normalizedServiceName = normalizeServiceName(groupedService.service_name);
    
    for (const { server, service } of groupedService.servers) {
      // Check if this server is a 5sim server
      if (fiveSimServerIds.includes(server.id) && aggregatedStock[server.id]) {
        const serverStock = aggregatedStock[server.id];
        
        // Try matching by service_code first (lowercase)
        const serviceCode = service.service_code.toLowerCase();
        if (serverStock[serviceCode] !== undefined) {
          totalStock += serverStock[serviceCode];
          hasStock = true;
          continue;
        }
        
        // Try matching by normalized service name
        for (const [stockKey, stockValue] of Object.entries(serverStock)) {
          if (normalizeServiceName(stockKey) === normalizedServiceName) {
            totalStock += stockValue;
            hasStock = true;
            break;
          }
        }
      }
      
      // Check if this server is a smsbower server
      if (smsbowerServerIds.includes(server.id) && smsbowerStockData[server.id]) {
        const serverStock = smsbowerStockData[server.id];
        
        // For smsbower, match by serviceCode_operator
        if (service.operator) {
          const key = `${service.service_code}_${service.operator}`;
          if (serverStock[key] !== undefined) {
            totalStock += serverStock[key];
            hasStock = true;
            continue;
          }
        }
        
        // Fallback: try matching by service_code only (sum all operators)
        const serviceCode = service.service_code;
        for (const [stockKey, stockValue] of Object.entries(serverStock)) {
          if (stockKey.startsWith(`${serviceCode}_`)) {
            totalStock += stockValue;
            hasStock = true;
          }
        }
      }
    }
    
    return hasStock ? totalStock : null;
  }, [aggregatedStock, fiveSimServerIds, smsbowerStockData, smsbowerServerIds, normalizeServiceName]);

  // Pre-compute all service stocks for the filtered list
  const serviceStockCache = useMemo(() => {
    const cache = new Map<string, number | null>();
    for (const service of groupedServices) {
      cache.set(service.service_name, getServiceStock(service));
    }
    return cache;
  }, [groupedServices, getServiceStock]);

  const toggleFavorite = async (serviceName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) return;

    const isFavorited = favorites.has(serviceName);
    
    // Optimistic update
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (isFavorited) {
        newSet.delete(serviceName);
      } else {
        newSet.add(serviceName);
      }
      return newSet;
    });

    if (isFavorited) {
      // Remove from database
      const { error } = await supabase
        .from('user_favorite_services')
        .delete()
        .eq('user_id', user.id)
        .eq('service_name', serviceName);
      
      if (error) {
        // Revert on error
        setFavorites(prev => new Set([...prev, serviceName]));
      }
    } else {
      // Add to database
      const { error } = await supabase
        .from('user_favorite_services')
        .insert({ user_id: user.id, service_name: serviceName });
      
      if (error) {
        // Revert on error
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(serviceName);
          return newSet;
        });
      }
    }
  };

  const mobileVisibleServices = showAllServices 
    ? filteredServices 
    : filteredServices.slice(0, MOBILE_VISIBLE_COUNT);

  const handleSelectService = (groupedService: GroupedService) => {
    setSelectedGroupedService(groupedService);
    if (groupedService.servers.length === 1) {
      setSelectedServerService(groupedService.servers[0]);
    } else {
      setSelectedServerService(null);
    }
  };

  const handleGetNumber = async () => {
    if (!selectedServerService || !user?.id) return;
    const { server, service } = selectedServerService;
    if (balance < (service.final_price || 0)) {
      toast({ description: "Insufficient balance", variant: "destructive" });
      return;
    }
    setIsGettingNumber(true);
    try {
      const response = await supabase.functions.invoke("sms-api", {
        body: { action: "get_number", userId: user.id, serverId: server.id, serviceId: service.id },
      });
      
      // Show API status toast if enabled
      if (response.data?.apiStatus) {
        showApiStatusToast(response.data.apiStatus, response.data?.success ? "default" : "destructive");
      }
      
      if (response.data?.success) {
        const activation = response.data.activation;

        // Ensure the activation is written to DB before showing the success toast
        const isSaved = await (async () => {
          const maxAttempts = 4;
          for (let i = 0; i < maxAttempts; i++) {
            const { data } = await supabase
              .from('number_activations')
              .select('id')
              .eq('user_id', user.id)
              .eq('activation_id', activation.activation_id)
              .maybeSingle();

            if (data?.id) return true;
            await new Promise((r) => setTimeout(r, 250));
          }
          return false;
        })();

        const newNumber: ActiveNumber = {
          id: activation.id,
          activation_id: activation.activation_id,
          phone_number: activation.phone_number,
          price: activation.price,
          status: "active",
          messages: [],
          has_otp_received: false,
          created_at: new Date().toISOString(),
          server_name: server.server_name,
          country_dial_code: server.country_dial_code,
          service_name: service.service_name,
          service_logo: service.logo_url,
          server_id: server.id,
          service_id: service.id,
          cancel_disable_time: service.cancel_disable_time,
        };
        setActiveNumbers((prev) => [newNumber, ...prev]);
        setBalance(response.data.new_balance);
        startPolling(activation.activation_id);
        setSelectedNumber(newNumber);
        setSelectedGroupedService(null);
        setSelectedServerService(null);

        if (!isSaved) {
          toast({
            description: "Number assigned, but failed to save in history. Please try again.",
            variant: "destructive",
          });
          return;
        }

        const displayNumber = `+${activation.phone_number}`;
        toast({ description: `Number acquired: ${displayNumber}` });
      } else {
        toast({ description: response.data?.error || "Number not available" });
      }
    } catch (error) {
      console.error("Error getting number:", error);
      showApiStatusToast("TIMEOUT", "destructive");
      toast({ description: "Failed to get number" });
    } finally {
      setIsGettingNumber(false);
    }
  };

  const handleNextSms = async (activationId: string) => {
    if (!user?.id) return;
    setLoadingActions((prev) => new Set(prev).add(`next-${activationId}`));
    try {
      const response = await supabase.functions.invoke("sms-api", {
        body: { action: "next_sms", userId: user.id, activationId },
      });
      
      // Show API status toast if enabled
      if (response.data?.apiStatus) {
        showApiStatusToast(response.data.apiStatus, response.data?.success ? "default" : "destructive");
      }
      
      if (response.data?.success) {
        toast({ description: "Next SMS requested" });
        stopPolling(activationId);
        startPolling(activationId);
      } else {
        toast({ description: response.data?.error || "Failed" });
      }
    } catch (error) {
      console.error("Error requesting next SMS:", error);
      showApiStatusToast("TIMEOUT", "destructive");
      toast({ description: "Request failed" });
    } finally {
      setLoadingActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(`next-${activationId}`);
        return newSet;
      });
    }
  };

  const handleCancel = async (activationId: string) => {
    if (!user?.id) return;
    setLoadingActions((prev) => new Set(prev).add(`cancel-${activationId}`));
    try {
      const response = await supabase.functions.invoke("sms-api", {
        body: { action: "cancel_number", userId: user.id, activationId },
      });
      
      // Show API status toast if enabled
      if (response.data?.apiStatus) {
        showApiStatusToast(response.data.apiStatus, response.data?.success ? "default" : "destructive");
      }
      
      if (response.data?.success) {
        stopPolling(activationId);
        setActiveNumbers((prev) => prev.filter((n) => n.activation_id !== activationId));
        if (selectedNumber?.activation_id === activationId) {
          setSelectedNumber(null);
        }
        if (response.data.refunded) {
          setBalance(response.data.new_balance);
          toast({ description: `Refunded ₹${response.data.amount}` });
        } else {
          toast({ description: "Number cancelled" });
        }
      } else {
        // Handle specific error types
        const errorType = response.data?.errorType;
        let errorMsg = response.data?.error || "Cancel failed";
        
        if (errorType === 'EARLY_CANCEL_DENIED') {
          errorMsg = "Wait 2 min to cancel";
        } else if (errorType === 'NO_ACTIVATION') {
          errorMsg = "Activation not found";
        } else if (errorType === 'BAD_KEY') {
          errorMsg = "Server error";
        } else if (errorType === 'BAD_STATUS') {
          errorMsg = "Invalid status";
        } else if (errorType === 'STILL_ACTIVE') {
          errorMsg = "Number still active";
        }
        
        toast({ description: errorMsg, variant: "destructive" });
      }
    } catch (error) {
      console.error("Error cancelling:", error);
      showApiStatusToast("TIMEOUT", "destructive");
      toast({ description: "Cancel failed", variant: "destructive" });
    } finally {
      setLoadingActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(`cancel-${activationId}`);
        return newSet;
      });
    }
  };

  const handleNextNumber = async (currentNumber: ActiveNumber) => {
    if (!user?.id || !currentNumber.server_id || !currentNumber.service_id) {
      toast({ description: "Cannot get next number - missing service info" });
      return;
    }
    
    // Find the service price from current services
    const service = services.find(s => s.id === currentNumber.service_id);
    const price = service?.final_price || currentNumber.price;
    
    if (balance < price) {
      toast({ description: "Insufficient balance", variant: "destructive" });
      return;
    }
    
    setLoadingActions((prev) => new Set(prev).add(`next-number-${currentNumber.activation_id}`));
    try {
      const response = await supabase.functions.invoke("sms-api", {
        body: { action: "get_number", userId: user.id, serverId: currentNumber.server_id, serviceId: currentNumber.service_id },
      });
      
      // Show API status toast if enabled
      if (response.data?.apiStatus) {
        showApiStatusToast(response.data.apiStatus, response.data?.success ? "default" : "destructive");
      }
      
      if (response.data?.success) {
        const activation = response.data.activation;
        const server = servers.find(s => s.id === currentNumber.server_id);
        const newNumber: ActiveNumber = {
          id: activation.id,
          activation_id: activation.activation_id,
          phone_number: activation.phone_number,
          price: activation.price,
          status: "active",
          messages: [],
          has_otp_received: false,
          created_at: new Date().toISOString(),
          server_name: server?.server_name || currentNumber.server_name,
          country_dial_code: server?.country_dial_code || currentNumber.country_dial_code,
          service_name: currentNumber.service_name,
          service_logo: currentNumber.service_logo,
          server_id: currentNumber.server_id,
          service_id: currentNumber.service_id,
          cancel_disable_time: currentNumber.cancel_disable_time,
        };
        setActiveNumbers((prev) => [newNumber, ...prev]);
        setBalance(response.data.new_balance);
        startPolling(activation.activation_id);
        setSelectedNumber(newNumber);
        toast({ description: "New number acquired!" });
      } else {
        toast({ description: response.data?.error || "Number not available" });
      }
    } catch (error) {
      console.error("Error getting next number:", error);
      showApiStatusToast("TIMEOUT", "destructive");
      toast({ description: "Failed to get number" });
    } finally {
      setLoadingActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(`next-number-${currentNumber.activation_id}`);
        return newSet;
      });
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCleanNumber = (number: string, dialCode: string) => {
    let clean = number;
    if (clean.startsWith(dialCode)) clean = clean.substring(dialCode.length);
    else if (clean.startsWith("+")) {
      const withoutPlus = clean.substring(1);
      const dialWithoutPlus = dialCode.startsWith("+") ? dialCode.substring(1) : dialCode;
      if (withoutPlus.startsWith(dialWithoutPlus)) clean = withoutPlus.substring(dialWithoutPlus.length);
    }
    return clean;
  };

  const formatDisplayNumber = (number: string, dialCode: string) => {
    // Already has + prefix, return as-is
    if (number.startsWith("+")) return number;
    
    // Clean the dial code (remove + if present)
    const cleanDialCode = dialCode.replace("+", "");
    
    // Check if number already starts with the dial code
    if (number.startsWith(cleanDialCode)) {
      return `+${number}`;
    }
    
    return `+${cleanDialCode}${number}`;
  };

  const goToServicesView = () => {
    setSelectedNumber(null);
    setSelectedGroupedService(null);
    setSelectedServerService(null);
    setMobileSheetOpen(false);
  };

  // Active Numbers Content (shared between sidebar and mobile sheet)
  const ActiveNumbersContent = () => (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header Actions */}
      <div className="p-3 xl:p-4 space-y-2 shrink-0">
        <button
          onClick={goToServicesView}
          aria-label="Buy new number"
          className="w-full flex items-center justify-center gap-2 py-2.5 xl:py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs xl:text-sm font-bold shadow-md hover:shadow-lg transition-all duration-300"
        >
          <svg className="w-4 h-4 xl:w-5 xl:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Buy New Number
        </button>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-label={isRefreshing ? "Refreshing data" : "Refresh data"}
          className="w-full flex items-center justify-center gap-2 py-2 xl:py-2.5 rounded-xl border border-[rgb(230,230,250)] bg-white hover:bg-[rgb(250,250,252)] text-xs xl:text-sm font-medium text-[#1a1a2e] transition-all duration-200"
        >
          <svg className={`w-3.5 h-3.5 xl:w-4 xl:h-4 ${isRefreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Numbers List */}
      <ScrollArea className="flex-1 min-h-0 max-h-[calc(100vh-300px)] lg:max-h-[calc(100vh-220px)] bg-white">
        {activeNumbers.length === 0 ? (
          <div className="p-4 xl:p-6 text-center">
            <div className="w-16 h-16 xl:w-20 xl:h-20 rounded-xl xl:rounded-2xl bg-[rgb(239,239,254)] flex items-center justify-center mx-auto mb-3 xl:mb-4">
              <svg className="w-8 h-8 xl:w-10 xl:h-10 text-[rgb(99,102,241)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <p className="text-[#1a1a2e] font-semibold mb-1 text-sm xl:text-base">No active numbers</p>
            <p className="text-gray-500 text-xs xl:text-sm">Buy a number to get started</p>
          </div>
        ) : (
          <div className="p-3 xl:p-4 space-y-2 xl:space-y-3">
            {activeNumbers.map((num) => (
              <motion.button
                key={num.id}
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => { setSelectedNumber(num); setSelectedGroupedService(null); setMobileSheetOpen(false); }}
                aria-label={`View ${num.service_name} number ${num.phone_number}${num.has_otp_received ? ", OTP received" : ", waiting for OTP"}`}
                className={`w-full text-left p-3 xl:p-4 rounded-xl transition-all duration-300 ${
                  selectedNumber?.id === num.id
                    ? "bg-gradient-to-br from-white via-white to-[rgb(248,248,255)] border-2 border-[rgb(99,102,241)] shadow-[0_4px_15px_rgba(99,102,241,0.15)]"
                    : "bg-white border border-[rgb(230,230,250)] hover:border-[rgb(99,102,241)]/50 hover:shadow-[0_4px_12px_rgba(99,102,241,0.08)]"
                }`}
              >
                <div className="flex items-center gap-2.5 xl:gap-3">
                  <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-lg xl:rounded-xl shrink-0 overflow-hidden shadow-sm">
                    <OptimizedImage
                      src={num.service_logo || DEFAULT_SERVICE_ICON}
                      alt={num.service_name}
                      width={44}
                      height={44}
                      objectFit="cover"
                      className="w-full h-full rounded-lg xl:rounded-xl"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1a1a2e] text-xs xl:text-sm truncate">{num.service_name}</p>
                    <span className="text-[10px] xl:text-xs text-gray-500 font-mono">
                      {formatDisplayNumber(num.phone_number, num.country_dial_code)}
                    </span>
                  </div>
                  <RoughUnderlineStatus 
                    hasOtpReceived={num.has_otp_received}
                    messageCount={num.messages?.length || 0}
                    variant="compact"
                    animationKey={refreshAnimationKey}
                  />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  // View states
  const showServiceSelection = selectedGroupedService !== null;
  const showNumberDetail = selectedNumber !== null && !showServiceSelection;

  return (
    <DashboardLayout balance={balance}>
      {user?.is_banned && <BannedUserOverlay />}

      <div className="h-full min-h-0 flex flex-col lg:flex-row bg-[rgb(250,250,252)] overflow-hidden overscroll-none">
        
        {/* Desktop Sidebar - Hidden on mobile, responsive width */}
        <div className="hidden lg:flex lg:w-72 xl:w-80 2xl:w-96 border-r border-[rgb(230,230,250)] bg-gradient-to-b from-white to-[rgb(250,250,252)] flex-col shrink-0 overflow-hidden">
          {/* Sidebar Header */}
          <div className="p-4 xl:p-5 border-b border-[rgb(230,230,250)] bg-white shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-base xl:text-lg font-bold text-[#1a1a2e]">My Numbers</h2>
              <div className={`relative p-2 rounded-lg transition-all ${
                activeNumbers.length > 0 
                  ? "bg-gradient-to-br from-primary/10 to-primary/5 shadow-[0_2px_8px_rgba(99,102,241,0.15)]" 
                  : "bg-muted"
              }`}>
                <svg 
                  className={`w-5 h-5 ${activeNumbers.length > 0 ? "text-primary" : "text-muted-foreground"}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {activeNumbers.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-sm">
                    {activeNumbers.length}
                  </span>
                )}
              </div>
            </div>
          </div>
          <ActiveNumbersContent />
        </div>

        {/* Mobile Floating Button - Only shown on mobile when there are active numbers */}
        {activeNumbers.length > 0 && (
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger asChild>
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                aria-label={`View my ${activeNumbers.length} active numbers`}
                className="lg:hidden fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-4 xs:right-6 z-50 w-12 h-12 xs:w-14 xs:h-14 rounded-xl xs:rounded-2xl bg-[rgb(99,102,241)] text-white shadow-[0_4px_20px_rgba(99,102,241,0.4)] flex items-center justify-center min-h-[var(--touch-target)] min-w-[var(--touch-target)]"
              >
                <div className="relative">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg" aria-hidden="true">
                    {activeNumbers.length}
                  </span>
                </div>
              </motion.button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[70vh] h-auto rounded-t-2xl xs:rounded-t-3xl p-0 bg-white border-t border-[rgb(230,230,250)]">
              <SheetHeader className="p-5 pb-0 bg-white">
                <SheetTitle className="text-left text-[#1a1a2e]">My Numbers</SheetTitle>
              </SheetHeader>
              <ActiveNumbersContent />
            </SheetContent>
          </Sheet>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {showNumberDetail ? (
              /* NUMBER DETAIL VIEW */
              <motion.div
                key="number-detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                {/* Detail Header - Compact */}
                <div className="shrink-0 p-4 sm:p-5 border-b border-[rgb(230,230,250)] bg-white">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedNumber(null)}
                      aria-label="Go back to services"
                      className="p-2 rounded-lg hover:bg-[rgb(245,245,250)] transition-colors"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#1a1a2e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(99,102,241,0.1)]">
                      <OptimizedImage
                        src={selectedNumber.service_logo || DEFAULT_SERVICE_ICON}
                        alt={selectedNumber.service_name}
                        width={48}
                        height={48}
                        objectFit="cover"
                        className="w-full h-full rounded-xl"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base sm:text-lg font-bold text-[#1a1a2e] truncate">{selectedNumber.service_name}</h2>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{selectedNumber.server_name}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                      <AutoCancelCountdown 
                        createdAt={selectedNumber.created_at} 
                        hasOtpReceived={selectedNumber.has_otp_received}
                      />
                      <RoughUnderlineStatus 
                        hasOtpReceived={selectedNumber.has_otp_received}
                        messageCount={selectedNumber.messages.length}
                        animationKey={refreshAnimationKey}
                      />
                    </div>
                  </div>
                </div>

                {/* Phone Number Display - Compact */}
                <div className="shrink-0 px-4 sm:px-5 py-3 border-b border-[rgb(230,230,250)] bg-white">
                  <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-lg bg-[rgb(250,250,252)] border border-[rgb(235,235,245)]">
                    <div className="flex-1 min-w-0 overflow-visible">
                      <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium uppercase tracking-wider">Phone Number</p>
                      <span className="text-base sm:text-lg font-semibold text-[#1a1a2e] font-mono tracking-wide">
                        {formatDisplayNumber(selectedNumber.phone_number, selectedNumber.country_dial_code)}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(getCleanNumber(selectedNumber.phone_number, selectedNumber.country_dial_code), `phone-${selectedNumber.id}`)}
                      aria-label={copiedId === `phone-${selectedNumber.id}` ? "Phone number copied" : "Copy phone number"}
                      className={`p-2 sm:p-2.5 rounded-lg transition-all duration-300 shrink-0 ${
                        copiedId === `phone-${selectedNumber.id}`
                          ? "bg-emerald-500 text-white"
                          : "bg-[rgb(239,239,254)] hover:bg-[rgb(99,102,241)] text-[rgb(99,102,241)] hover:text-white"
                      }`}
                    >
                      {copiedId === `phone-${selectedNumber.id}` ? (
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* OTP Messages Area - Internal scroll */}
                <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-[rgb(250,250,252)]">
                  <div className="px-4 sm:px-5 pt-4 pb-2 shrink-0">
                    <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Messages</p>
                  </div>
                  <ScrollArea className="flex-1 min-h-0">
                    <div className="px-4 sm:px-5 pb-4">
                      {selectedNumber.messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-3 ${
                            selectedNumber.has_otp_received 
                              ? "bg-emerald-50 border border-emerald-200" 
                              : "bg-primary/10 border border-primary/20"
                          }`}>
                            {selectedNumber.has_otp_received ? (
                              <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <div className="relative">
                                <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                </svg>
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
                              </div>
                            )}
                          </div>
                          <p className="text-foreground font-semibold text-sm mb-0.5">
                            {selectedNumber.has_otp_received ? "Waiting for more messages" : "Waiting for OTP"}
                          </p>
                          <p className="text-xs text-muted-foreground">Messages will appear here</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5 sm:space-y-3">
                          {selectedNumber.messages.map((msg, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-br from-white via-white to-emerald-50/50 border border-emerald-200 shadow-[0_4px_12px_rgba(16,185,129,0.06)]"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-[#1a1a2e] font-medium break-words text-sm sm:text-base">{msg.text}</p>
                                  <p className="text-[10px] sm:text-xs text-gray-500 mt-2">
                                    {new Date(msg.received_at).toLocaleTimeString()}
                                  </p>
                                </div>
                                <button
                                  onClick={() => copyToClipboard(msg.text, `msg-${idx}`)}
                                  aria-label={copiedId === `msg-${idx}` ? "Message copied" : "Copy message"}
                                  className={`p-2.5 sm:p-3 rounded-xl shrink-0 transition-all duration-300 ${
                                    copiedId === `msg-${idx}`
                                      ? "bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
                                      : "bg-[rgb(239,239,254)] hover:bg-[rgb(99,102,241)] text-[rgb(99,102,241)] hover:text-white"
                                  }`}
                                >
                                  {copiedId === `msg-${idx}` ? (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Action Buttons - Aligned */}
                <div className="shrink-0 p-4 sm:p-5 border-t border-[rgb(230,230,250)] bg-white">
                  <div className="flex items-center justify-center gap-3">
                    {!selectedNumber.has_otp_received && (
                      <button
                        onClick={() => handleNextSms(selectedNumber.activation_id)}
                        disabled={loadingActions.size > 0}
                        aria-label="Request next SMS"
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        {loadingActions.has(`next-${selectedNumber.activation_id}`) ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                            Next SMS
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleNextNumber(selectedNumber)}
                      disabled={loadingActions.size > 0}
                      aria-label="Get next number for same service"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {loadingActions.has(`next-number-${selectedNumber.activation_id}`) ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Next Number
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleCancel(selectedNumber.activation_id)}
                      disabled={loadingActions.size > 0}
                      aria-label="Cancel number"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-50 text-rose-600 font-medium text-sm hover:bg-rose-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-rose-200"
                    >
                      {loadingActions.has(`cancel-${selectedNumber.activation_id}`) ? (
                        <div className="w-4 h-4 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin" aria-hidden="true" />
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel
                          {/* Show cancel countdown only if cancel_disable_time > 0 */}
                          {(selectedNumber.cancel_disable_time ?? 0) > 0 && (
                            <CancelCountdown createdAt={selectedNumber.created_at} waitMinutes={selectedNumber.cancel_disable_time} />
                          )}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : showServiceSelection ? (
              /* SERVER SELECTION VIEW */
              <motion.div
                key="server-selection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Header - Compact */}
                <div className="shrink-0 p-4 sm:p-5 border-b border-[rgb(230,230,250)] bg-white">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setSelectedGroupedService(null);
                        setSelectedServerService(null);
                      }}
                      aria-label="Go back to services"
                      className="p-2 rounded-lg hover:bg-[rgb(245,245,250)] transition-colors"
                    >
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-[#1a1a2e]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(99,102,241,0.1)]">
                      <OptimizedImage
                        src={selectedGroupedService.logo_url || DEFAULT_SERVICE_ICON}
                        alt={selectedGroupedService.service_name}
                        width={48}
                        height={48}
                        objectFit="cover"
                        className="w-full h-full rounded-xl"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base sm:text-lg font-bold text-[#1a1a2e] truncate">{selectedGroupedService.service_name}</h2>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {selectedGroupedService.servers.length} server{selectedGroupedService.servers.length > 1 ? "s" : ""}
                        {(() => {
                          const stock = getServiceStock(selectedGroupedService);
                          if (stock !== null) {
                            return <span className="text-emerald-600 font-medium"> • {stock} in stock</span>;
                          }
                          return null;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Server List - Show 8 items then scroll */}
                <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white max-h-[calc(100dvh-220px)] sm:max-h-[calc(100dvh-240px)]">
                  <ScrollArea className="h-full bg-white">
                    <div className="p-4 sm:p-5 grid gap-2.5 sm:gap-3">
                      {selectedGroupedService.servers.map(({ server, service }) => (
                        <motion.button
                          key={service.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => setSelectedServerService({ server, service })}
                          aria-label={`Select ${server.server_name} server for ₹${service.final_price}`}
                          className={`w-full text-left p-3 sm:p-4 rounded-xl transition-all duration-300 ${
                            selectedServerService?.service.id === service.id
                              ? "bg-gradient-to-br from-white via-white to-[rgb(248,248,255)] border-2 border-[rgb(99,102,241)] shadow-[0_4px_15px_rgba(99,102,241,0.15)]"
                              : "bg-white border border-[rgb(230,230,250)] hover:border-[rgb(99,102,241)]/50 hover:shadow-[0_4px_12px_rgba(99,102,241,0.08)]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <span className="text-3xl sm:text-3xl">{server.country_flag}</span>
                              <div>
                                <p className="font-semibold text-foreground text-base sm:text-lg">
                                  {server.server_name}
                                  {showOperator && service.operator && <span className="text-muted-foreground font-normal"> • {service.operator}</span>}
                                </p>
                                <p className="text-sm sm:text-base text-muted-foreground">
                                  {server.country_name} • {server.country_dial_code}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl sm:text-2xl font-bold text-primary">₹{(service.final_price || 0).toFixed(2)}</p>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Buy Button - Compact, centered */}
                {selectedServerService && (
                  <div className="shrink-0 py-4 px-4 border-t border-[rgb(230,230,250)] bg-white flex items-center justify-center">
                    <button
                      onClick={handleGetNumber}
                      disabled={isGettingNumber}
                      aria-label={isGettingNumber ? "Getting number" : `Buy number for ₹${selectedServerService.service.final_price}`}
                      className="py-2.5 px-8 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-sm transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      {isGettingNumber ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Buy — ₹{(selectedServerService.service.final_price || 0).toFixed(2)}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              /* SERVICES GRID VIEW */
              <motion.div
                key="services-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Header with Search */}
                <div className="shrink-0 p-3 xs:p-4 sm:p-5 lg:p-6 border-b border-[rgb(230,230,250)] bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 xs:gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <h1 className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold text-[#1a1a2e]">Get Number</h1>
                      <p className="text-[10px] xs:text-xs sm:text-sm lg:text-base text-gray-500 mt-0.5">Select a service to receive OTP</p>
                    </div>
                    <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3">
                      {/* Favorites Only Toggle */}
                      <button
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className={`relative p-2 rounded-lg border transition-all ${
                          showFavoritesOnly
                            ? 'bg-amber-50 border-amber-300 text-amber-600'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-500'
                        }`}
                        title={showFavoritesOnly ? "Show all services" : "Show favorites only"}
                      >
                        <svg
                          className={`w-4 h-4 ${showFavoritesOnly ? 'fill-amber-500' : 'fill-none'}`}
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        {favorites.size > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold bg-amber-500 text-white rounded-full flex items-center justify-center">
                            {favorites.size}
                          </span>
                        )}
                      </button>
                      
                      <div className="relative w-full sm:w-60 lg:w-72">
                        {/* Search Icon */}
                        <svg 
                          className="absolute left-2.5 xs:left-3 sm:left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 xs:w-5 xs:h-5 text-gray-400" 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"></path>
                          <path d="M21 21l-6 -6"></path>
                        </svg>
                        <input
                          type="text"
                          placeholder="Search Service..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          aria-label="Search services"
                          className="w-full pl-8 xs:pl-10 sm:pl-11 pr-3 xs:pr-4 py-2 xs:py-2.5 sm:py-3 rounded-lg xs:rounded-xl border border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 text-xs xs:text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#2980b9]/20 focus:border-[#2980b9] transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Services Grid - Internal scroll only */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-3 xs:p-4 sm:p-5 lg:p-6">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                          <div className="w-10 h-10 border-3 border-[rgb(230,230,250)] border-t-[rgb(99,102,241)] rounded-full animate-spin" />
                        </div>
                      ) : filteredServices.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="w-16 h-16 rounded-xl bg-[rgb(239,239,254)] flex items-center justify-center mx-auto mb-3">
                            <svg className="w-8 h-8 text-[rgb(99,102,241)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          <p className="text-[#1a1a2e] font-bold text-base mb-1">No services found</p>
                          <p className="text-sm text-gray-500 mb-3">
                            {showFavoritesOnly && favorites.size === 0 
                              ? "You haven't added any favorites yet" 
                              : "Try a different search term"}
                          </p>
                          <button
                            onClick={() => {
                              setSearchQuery("");
                              setShowFavoritesOnly(false);
                            }}
                            aria-label="Clear filters"
                            className="px-4 py-2 rounded-lg bg-[rgb(99,102,241)] hover:bg-[rgb(79,70,229)] text-white text-sm font-medium transition-all duration-200"
                          >
                            {showFavoritesOnly ? "Show all services" : "Clear search"}
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Mobile Compact List View with Scroll - 2-row layout */}
                          <div className="md:hidden">
                            <MobileServiceList 
                              services={filteredServices}
                              favorites={favorites}
                              serviceStockCache={serviceStockCache}
                              isGettingNumber={isGettingNumber}
                              toggleFavorite={toggleFavorite}
                              handleSelectService={handleSelectService}
                            />
                          </div>

                          <DesktopServiceGrid
                            services={filteredServices}
                            favorites={favorites}
                            serviceStockCache={serviceStockCache}
                            isGettingNumber={isGettingNumber}
                            toggleFavorite={toggleFavorite}
                            handleSelectService={handleSelectService}
                          />
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
