import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Copy, Check, Phone, ArrowRight, X } from 'lucide-react';
import { ResponsivePagination } from '@/components/ui/ResponsivePagination';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AutoCancelCountdown, CancelCountdown } from '@/components/ui/CancelCountdown';
import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface NumberHistoryItem {
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
  server_id: string;
  service_id: string;
  cancel_disable_time?: number;
}

import { DEFAULT_SERVICE_ICON } from '@/lib/logoUtils';

export default function NumberHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [numbers, setNumbers] = useState<NumberHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'received' | 'not_received'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  
  // SMS Dialog state
  const [selectedNumber, setSelectedNumber] = useState<NumberHistoryItem | null>(null);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    if (user?.id) {
      fetchNumberHistory();
      fetchBalance();
    }
  }, [user?.id]);

  const fetchBalance = async () => {
    if (!user?.id) return;
    const result = await supabase.rpc('get_user_dashboard_stats', { p_user_id: user.id });
    if (result.data) {
      setBalance((result.data as any).balance || 0);
    }
  };

  const fetchNumberHistory = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // Fetch all activations for the user using secure RPC function
      const { data: activationsData, error } = await supabase.rpc('get_user_number_history', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error fetching activations:', error);
        toast({ description: 'Failed to load number history', variant: 'destructive' });
        return;
      }

      const activations = activationsData as Array<{
        id: string;
        activation_id: string;
        phone_number: string;
        price: number;
        status: string;
        messages: any;
        has_otp_received: boolean;
        created_at: string;
        server_id: string;
        service_id: string;
      }> | null;

      if (!activations || activations.length === 0) {
        setNumbers([]);
        setLoading(false);
        return;
      }

      // Get unique server and service IDs
      const serverIds = [...new Set(activations.map(a => a.server_id))];
      const serviceIds = [...new Set(activations.map(a => a.service_id))];

      // Fetch servers and services using secure RPC functions
      const [serversResult, servicesResult] = await Promise.all([
        supabase.rpc('get_server_details', { p_server_ids: serverIds }),
        supabase.rpc('get_service_details', { p_service_ids: serviceIds }),
      ]);

      const serversMap = new Map();
      const serversData = serversResult.data as Array<{ id: string; server_name: string; country_dial_code: string }> | null;
      (serversData || []).forEach((s) => {
        serversMap.set(s.id, s);
      });

      const servicesMap = new Map();
      const servicesData = servicesResult.data as Array<{ id: string; service_name: string; logo_url: string | null; cancel_disable_time: number }> | null;
      (servicesData || []).forEach((s) => {
        servicesMap.set(s.id, s);
      });

      // Map activations with server and service details
      const mappedNumbers: NumberHistoryItem[] = activations.map(activation => {
        const server = serversMap.get(activation.server_id);
        const service = servicesMap.get(activation.service_id);

        return {
          id: activation.id,
          activation_id: activation.activation_id,
          phone_number: activation.phone_number,
          price: activation.price,
          status: activation.status,
          messages: Array.isArray(activation.messages) 
            ? activation.messages.map((msg: any) => ({
                text: typeof msg === 'string' ? msg : msg?.text || msg?.message || '',
                received_at: typeof msg === 'string' ? new Date().toISOString() : msg?.received_at || new Date().toISOString()
              }))
            : [],
          has_otp_received: activation.has_otp_received,
          created_at: activation.created_at,
          server_name: server?.server_name || 'Unknown Server',
          country_dial_code: server?.country_dial_code || '+91',
          service_name: service?.service_name || 'Unknown Service',
          service_logo: service?.logo_url || null,
          server_id: activation.server_id,
          service_id: activation.service_id,
          cancel_disable_time: service?.cancel_disable_time || 0,
        };
      });

      setNumbers(mappedNumbers);
    } catch (err) {
      console.error('Error:', err);
      toast({ description: 'Failed to load number history', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredNumbers = numbers.filter(num => {
    if (filter === 'all') return true;
    if (filter === 'received') return num.has_otp_received;
    if (filter === 'not_received') return !num.has_otp_received;
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredNumbers.length / itemsPerPage);
  const paginatedNumbers = filteredNumbers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast({ description: 'Copied to clipboard' });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast({ description: 'Failed to copy', variant: 'destructive' });
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'h:mm a dd/MM');
  };

  const getLatestMessage = (messages: { text: string; received_at: string }[]) => {
    if (!messages || messages.length === 0) return null;
    const lastMsg = messages[messages.length - 1];
    return lastMsg?.text || null;
  };

  // Check if number is still within 20 min active window
  const isNumberActive = (num: NumberHistoryItem) => {
    if (num.status !== 'active') return false;
    const createdAt = new Date(num.created_at).getTime();
    const now = Date.now();
    const twentyMinutes = 20 * 60 * 1000;
    return now - createdAt < twentyMinutes;
  };

  // Start polling for SMS
  const startPolling = useCallback((activationId: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    
    const checkMessage = async () => {
      if (!user?.id) return;
      
      try {
        const response = await supabase.functions.invoke("sms-api", {
          body: { action: "get_message", userId: user.id, activationId },
        });
        
        if (!response.data?.success) {
          if (response.data?.errorType === 'NO_ACTIVATION') {
            toast({ description: "Activation not found", variant: "destructive" });
            stopPolling();
            setSmsDialogOpen(false);
          }
          return;
        }
        
        // Handle auto-cancelled
        if (response.data?.auto_cancelled) {
          stopPolling();
          setNumbers(prev => prev.map(n => 
            n.activation_id === activationId ? { ...n, status: 'cancelled' } : n
          ));
          setSelectedNumber(prev => prev ? { ...prev, status: 'cancelled' } : null);
          if (response.data?.new_balance !== undefined) {
            setBalance(response.data.new_balance);
          }
          toast({ description: "Number expired - Refunded" });
          return;
        }
        
        // Handle cancelled
        if (response.data?.cancelled) {
          stopPolling();
          setNumbers(prev => prev.map(n => 
            n.activation_id === activationId ? { ...n, status: 'cancelled' } : n
          ));
          setSelectedNumber(prev => prev ? { ...prev, status: 'cancelled' } : null);
          return;
        }
        
        // Handle OTP received
        if (response.data?.has_otp) {
          const newMessage = { text: response.data.message, received_at: new Date().toISOString() };
          
          setNumbers(prev => prev.map(n => {
            if (n.activation_id === activationId) {
              return { 
                ...n, 
                messages: [...n.messages, newMessage], 
                has_otp_received: true 
              };
            }
            return n;
          }));
          
          setSelectedNumber(prev => {
            if (prev?.activation_id === activationId) {
              return { 
                ...prev, 
                messages: [...prev.messages, newMessage], 
                has_otp_received: true 
              };
            }
            return prev;
          });
          
          stopPolling();
          toast({ description: "SMS received!" });
        }
      } catch (error) {
        console.error("Error checking message:", error);
      }
    };
    
    // Check immediately
    checkMessage();
    // Then poll every 5 seconds
    pollingRef.current = setInterval(checkMessage, 5000);
  }, [user?.id, toast]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Handle opening SMS dialog
  const handleOpenSmsDialog = (num: NumberHistoryItem) => {
    setSelectedNumber(num);
    setSmsDialogOpen(true);
    if (!num.has_otp_received && num.status === 'active') {
      startPolling(num.activation_id);
    }
  };

  // Handle closing SMS dialog
  const handleCloseSmsDialog = () => {
    stopPolling();
    setSmsDialogOpen(false);
    setSelectedNumber(null);
  };

  // Handle Next SMS
  const handleNextSms = async (activationId: string) => {
    if (!user?.id) return;
    setLoadingActions(prev => new Set(prev).add(`next-${activationId}`));
    
    try {
      const response = await supabase.functions.invoke("sms-api", {
        body: { action: "next_sms", userId: user.id, activationId },
      });
      
      if (response.data?.success) {
        toast({ description: "Waiting for next SMS..." });
        startPolling(activationId);
      } else {
        toast({ description: response.data?.error || "Failed to request next SMS", variant: "destructive" });
      }
    } catch (error) {
      toast({ description: "Failed to request next SMS", variant: "destructive" });
    } finally {
      setLoadingActions(prev => {
        const next = new Set(prev);
        next.delete(`next-${activationId}`);
        return next;
      });
    }
  };

  // Handle Cancel Number
  const handleCancelNumber = async (activationId: string) => {
    if (!user?.id) return;
    setLoadingActions(prev => new Set(prev).add(`cancel-${activationId}`));
    
    try {
      const response = await supabase.functions.invoke("sms-api", {
        body: { action: "cancel_number", userId: user.id, activationId },
      });
      
      if (response.data?.success) {
        toast({ description: "Number cancelled" });
        
        // Update local state
        setNumbers(prev => prev.map(n => 
          n.activation_id === activationId ? { ...n, status: 'cancelled' } : n
        ));
        
        if (response.data?.new_balance !== undefined) {
          setBalance(response.data.new_balance);
        }
        
        handleCloseSmsDialog();
      } else {
        toast({ description: response.data?.error || "Failed to cancel number", variant: "destructive" });
      }
    } catch (error) {
      toast({ description: "Failed to cancel number", variant: "destructive" });
    } finally {
      setLoadingActions(prev => {
        const next = new Set(prev);
        next.delete(`cancel-${activationId}`);
        return next;
      });
    }
  };

  // Handle Next Number - get new number for same service
  const handleNextNumber = async (currentNumber: NumberHistoryItem) => {
    if (!user?.id || !currentNumber.server_id || !currentNumber.service_id) {
      toast({ description: "Cannot get next number - missing service info", variant: "destructive" });
      return;
    }
    
    if (balance < currentNumber.price) {
      toast({ description: "Insufficient balance", variant: "destructive" });
      return;
    }
    
    setLoadingActions(prev => new Set(prev).add(`next-number-${currentNumber.activation_id}`));
    
    try {
      const response = await supabase.functions.invoke("sms-api", {
        body: { action: "get_number", userId: user.id, serverId: currentNumber.server_id, serviceId: currentNumber.service_id },
      });
      
      // Show API status toast
      if (response.data?.apiStatus) {
        toast({ 
          description: `API: ${response.data.apiStatus}`, 
          variant: response.data?.success ? "default" : "destructive" 
        });
      }
      
      if (response.data?.success) {
        const activation = response.data.activation;
        
        // Add the new number to local state
        const newNumber: NumberHistoryItem = {
          id: activation.id,
          activation_id: activation.activation_id,
          phone_number: activation.phone_number,
          price: activation.price,
          status: "active",
          messages: [],
          has_otp_received: false,
          created_at: new Date().toISOString(),
          server_name: currentNumber.server_name,
          country_dial_code: currentNumber.country_dial_code,
          service_name: currentNumber.service_name,
          service_logo: currentNumber.service_logo,
          server_id: currentNumber.server_id,
          service_id: currentNumber.service_id,
          cancel_disable_time: currentNumber.cancel_disable_time,
        };
        
        setNumbers(prev => [newNumber, ...prev]);
        setBalance(response.data.new_balance);
        setSelectedNumber(newNumber);
        startPolling(activation.activation_id);
        
        const displayNumber = `+${activation.phone_number}`;
        toast({ description: `Number acquired: ${displayNumber}` });
      } else {
        // Number not available - redirect to GetNumber page to show other options
        toast({ description: response.data?.error || "Number not available - showing other options", variant: "destructive" });
        setSmsDialogOpen(false);
        navigate(`/get-number?service=${encodeURIComponent(currentNumber.service_name)}`);
      }
    } catch (error) {
      console.error("Error getting next number:", error);
      toast({ description: "API: TIMEOUT", variant: "destructive" });
      toast({ description: "Failed to get number", variant: "destructive" });
    } finally {
      setLoadingActions(prev => {
        const next = new Set(prev);
        next.delete(`next-number-${currentNumber.activation_id}`);
        return next;
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return (
    <DashboardLayout balance={balance}>
      <div className="px-[var(--page-padding-x)] max-w-6xl mx-auto space-y-4 xs:space-y-6">
        {/* Header with Filter */}
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-4">
          <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-foreground">Number History</h1>
          <div className="relative self-start xs:self-auto">
            <span className="absolute -top-2.5 left-3 bg-background px-1 text-[10px] xs:text-xs text-muted-foreground">Type</span>
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="w-auto min-w-[90px] xs:min-w-[100px] h-9 xs:h-10 sm:h-11 bg-background border-border text-xs xs:text-sm sm:text-base font-medium px-2.5 xs:px-3 pt-1">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="min-w-0 w-[var(--radix-select-trigger-width)] bg-background z-50">
                <SelectItem value="all" className="py-2 xs:py-2.5 text-xs xs:text-sm sm:text-base font-medium hover:bg-accent data-[state=checked]:bg-accent/50">All</SelectItem>
                <SelectItem value="received" className="py-2 xs:py-2.5 text-xs xs:text-sm sm:text-base font-medium hover:bg-accent data-[state=checked]:bg-accent/50">Received</SelectItem>
                <SelectItem value="not_received" className="py-2 xs:py-2.5 text-xs xs:text-sm sm:text-base font-medium hover:bg-accent data-[state=checked]:bg-accent/50">Not Received</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredNumbers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Phone className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Numbers Found</h3>
            <p className="text-sm text-muted-foreground">
              {filter === 'all' 
                ? "You haven't purchased any numbers yet." 
                : `No numbers with ${filter === 'received' ? 'received' : 'pending'} messages.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 xs:gap-3 sm:gap-4">
            {paginatedNumbers.map((num) => {
              const message = getLatestMessage(num.messages);
              const displayNumber = num.phone_number;

              return (
                <div
                  key={num.id}
                  className="bg-card rounded-lg xs:rounded-xl p-2.5 xs:p-3 sm:p-4 border border-border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-2.5 xs:gap-3 sm:gap-4">
                    {/* Service Icon */}
                    <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-lg flex-shrink-0 overflow-hidden shadow-sm">
                      <OptimizedImage
                        src={num.service_logo || DEFAULT_SERVICE_ICON}
                        alt={num.service_name}
                        width={40}
                        height={40}
                        objectFit="cover"
                        className="w-full h-full rounded-lg"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm xs:text-base sm:text-lg text-foreground">
                        {displayNumber}
                      </p>
                      <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground break-words">
                        {num.status} - ₹{num.price} (S: {num.server_name.slice(0, 8)}) {formatDateTime(num.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Message Row */}
                  <div className="mt-2 xs:mt-2.5 pt-2 xs:pt-2.5 border-t border-border/50 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] xs:text-xs text-muted-foreground mb-0.5">Message</p>
                      {message ? (
                        <p className="text-xs xs:text-sm font-medium text-emerald-600 truncate">
                          {message}
                        </p>
                      ) : (
                        <p className="text-xs xs:text-sm text-muted-foreground">
                          Message Not Received.
                        </p>
                      )}
                    </div>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleOpenSmsDialog(num)}
                      className={`flex-shrink-0 h-7 xs:h-8 px-2.5 xs:px-3 text-[10px] xs:text-xs font-medium ${
                        isNumberActive(num) ? 'bg-emerald-500 hover:bg-emerald-600' : ''
                      }`}
                    >
                      {isNumberActive(num) ? (
                        <>
                          <ArrowRight className="w-3 h-3 xs:w-3.5 xs:h-3.5 mr-1" />
                          Go
                        </>
                      ) : (
                        <>
                          View{num.messages.length > 0 ? ` (${num.messages.length})` : ''}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && (
          <ResponsivePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* SMS Waiting Dialog */}
      <Dialog open={smsDialogOpen} onOpenChange={(open) => !open && handleCloseSmsDialog()}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
          {selectedNumber && (
            <>
              {/* Header */}
              <DialogHeader className="p-4 border-b border-border bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    <img
                      src={selectedNumber.service_logo || DEFAULT_SERVICE_ICON}
                      alt={selectedNumber.service_name}
                      className="w-7 h-7 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_SERVICE_ICON;
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-base font-semibold truncate">
                      {selectedNumber.service_name}
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedNumber.server_name}
                    </p>
                  </div>
                  {selectedNumber.status !== 'cancelled' && (
                    <AutoCancelCountdown 
                      createdAt={selectedNumber.created_at} 
                      hasOtpReceived={selectedNumber.has_otp_received}
                    />
                  )}
                </div>
              </DialogHeader>

              {/* Phone Number */}
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-card border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Phone Number</p>
                    <span className="text-base font-semibold text-foreground font-mono tracking-wide">
                      {selectedNumber.phone_number}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(
                      selectedNumber.phone_number, 
                      `dialog-phone-${selectedNumber.id}`
                    )}
                    className="shrink-0"
                  >
                    {copiedId === `dialog-phone-${selectedNumber.id}` ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 min-h-[200px] max-h-[300px] bg-muted/20">
                <div className="px-4 pt-3 pb-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Messages</p>
                </div>
                <ScrollArea className="h-[250px]">
                  <div className="px-4 pb-4">
                    {selectedNumber.messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-3 ${
                          selectedNumber.status === 'cancelled'
                            ? "bg-rose-50 border border-rose-200"
                            : selectedNumber.has_otp_received 
                              ? "bg-emerald-50 border border-emerald-200" 
                              : "bg-primary/10 border border-primary/20"
                        }`}>
                          {selectedNumber.status === 'cancelled' ? (
                            <X className="w-7 h-7 text-rose-500" />
                          ) : selectedNumber.has_otp_received ? (
                            <Check className="w-7 h-7 text-emerald-500" />
                          ) : (
                            <div className="relative">
                              <Phone className="w-7 h-7 text-primary" />
                              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
                            </div>
                          )}
                        </div>
                        <p className="text-foreground font-semibold text-sm mb-0.5">
                          {selectedNumber.status === 'cancelled' 
                            ? "Number Cancelled" 
                            : selectedNumber.has_otp_received 
                              ? "Waiting for more messages" 
                              : "Waiting for OTP"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedNumber.status === 'cancelled' 
                            ? "No messages were received" 
                            : "Messages will appear here"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {selectedNumber.messages.map((msg, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3.5 rounded-xl bg-card border border-emerald-200 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-foreground font-medium break-words text-sm">{msg.text}</p>
                                <p className="text-[10px] text-muted-foreground mt-2">
                                  {new Date(msg.received_at).toLocaleTimeString()}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopy(msg.text, `dialog-msg-${idx}`)}
                                className={`shrink-0 ${
                                  copiedId === `dialog-msg-${idx}` ? "bg-emerald-500 text-white border-emerald-500" : ""
                                }`}
                              >
                                {copiedId === `dialog-msg-${idx}` ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Action Buttons - Match GetNumber style */}
              {isNumberActive(selectedNumber) && (
                <div className="shrink-0 p-4 border-t border-border bg-card">
                  <div className="flex items-center justify-center gap-3">
                    {!selectedNumber.has_otp_received && (
                      <button
                        onClick={() => handleNextSms(selectedNumber.activation_id)}
                        disabled={loadingActions.size > 0}
                        aria-label="Request next SMS"
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        {loadingActions.has(`next-${selectedNumber.activation_id}`) ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                            Next SMS
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSmsDialogOpen(false);
                        navigate(`/get-number?service=${encodeURIComponent(selectedNumber.service_name)}`);
                      }}
                      aria-label="Get next number for same service"
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-all duration-200"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Next
                    </button>
                    <button
                      onClick={() => handleCancelNumber(selectedNumber.activation_id)}
                      disabled={loadingActions.size > 0}
                      aria-label="Cancel number"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-50 text-rose-600 font-medium text-sm hover:bg-rose-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-rose-200"
                    >
                      {loadingActions.has(`cancel-${selectedNumber.activation_id}`) ? (
                        <div className="w-4 h-4 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel
                          {(selectedNumber.cancel_disable_time ?? 0) > 0 && (
                            <CancelCountdown createdAt={selectedNumber.created_at} waitMinutes={selectedNumber.cancel_disable_time} />
                          )}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
