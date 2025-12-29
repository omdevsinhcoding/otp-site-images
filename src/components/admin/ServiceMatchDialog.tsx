import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Search, Loader2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// SmsBower API endpoint for services list
const SMSBOWER_SERVICES_API = "https://smsbower.online/stubs/handler_api.php?api_key=52HXRrbl4si3LsU6TTIy31MMlJXkUvvv&action=getServicesList";
const SMSBOWER_PRICES_API = "https://smsbower.online/stubs/handler_api.php?api_key=52HXRrbl4si3LsU6TTIy31MMlJXkUvvv&action=getPrices";

interface SmsBowerService {
  code: string;
  name: string;
}

interface ServiceMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDark: boolean;
  serviceName: string;
  countryCode: string;
  onConfirm: (service: { code: string; name: string; price: number }) => void;
}

export function ServiceMatchDialog({
  open,
  onOpenChange,
  isDark,
  serviceName,
  countryCode,
  onConfirm,
}: ServiceMatchDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [matchedServices, setMatchedServices] = useState<SmsBowerService[]>([]);
  const [selectedService, setSelectedService] = useState<SmsBowerService | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch and match services when dialog opens
  useEffect(() => {
    if (open && serviceName.trim()) {
      fetchAndMatchServices();
    } else if (!open) {
      // Reset state when dialog closes
      setMatchedServices([]);
      setSelectedService(null);
      setError(null);
    }
  }, [open, serviceName]);

  const fetchAndMatchServices = async () => {
    setIsLoading(true);
    setError(null);
    setMatchedServices([]);

    try {
      const response = await fetch(SMSBOWER_SERVICES_API);
      
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }

      const data = await response.json();
      
      // SmsBower returns { "service_code": "Service Name", ... }
      // Convert to array and filter by search term
      const searchTerm = serviceName.toLowerCase().trim();
      const services: SmsBowerService[] = [];

      for (const [code, name] of Object.entries(data)) {
        if (typeof name === 'string') {
          const nameLower = name.toLowerCase();
          const codeLower = code.toLowerCase();
          
          // Match if service name or code contains search term
          if (nameLower.includes(searchTerm) || codeLower.includes(searchTerm) || searchTerm.includes(nameLower) || searchTerm.includes(codeLower)) {
            services.push({ code, name: name as string });
          }
        }
      }

      // Sort by relevance (exact matches first)
      services.sort((a, b) => {
        const aExact = a.name.toLowerCase() === searchTerm || a.code.toLowerCase() === searchTerm;
        const bExact = b.name.toLowerCase() === searchTerm || b.code.toLowerCase() === searchTerm;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return a.name.localeCompare(b.name);
      });

      setMatchedServices(services);

      if (services.length === 0) {
        toast({
          title: 'No matches found',
          description: 'Enter details manually',
        });
      }
    } catch (err: any) {
      console.error('Error fetching services:', err);
      setError('Failed to fetch services from SmsBower');
      toast({
        title: 'Error',
        description: 'Failed to fetch services. Enter manually.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAndFetchPrice = async (service: SmsBowerService) => {
    setSelectedService(service);
    setIsFetchingPrice(true);

    try {
      // Fetch price for the selected service
      const priceUrl = `${SMSBOWER_PRICES_API}&service=${service.code}&country=${countryCode}`;
      const response = await fetch(priceUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch price');
      }

      const data = await response.json();
      
      // SmsBower price response format: { "country_code": { "service_code": { "cost": X, "count": Y } } }
      // or direct: { "cost": X, "count": Y }
      let price = 0;
      
      if (typeof data === 'object') {
        // Try different response structures
        if (data.cost !== undefined) {
          price = parseFloat(data.cost) || 0;
        } else if (data[countryCode]?.[service.code]?.cost !== undefined) {
          price = parseFloat(data[countryCode][service.code].cost) || 0;
        } else {
          // Try to find price in nested structure
          for (const countryData of Object.values(data)) {
            if (typeof countryData === 'object' && countryData !== null) {
              const serviceData = (countryData as Record<string, any>)[service.code];
              if (serviceData?.cost !== undefined) {
                price = parseFloat(serviceData.cost) || 0;
                break;
              }
            }
          }
        }
      }

      onConfirm({ code: service.code, name: service.name, price });
      onOpenChange(false);
      
      toast({
        title: `Selected: ${service.name}`,
        description: price > 0 ? `Price: ₹${price.toFixed(2)}` : 'Price fetched',
      });
    } catch (err: any) {
      console.error('Error fetching price:', err);
      // Still confirm selection but without price
      onConfirm({ code: service.code, name: service.name, price: 0 });
      onOpenChange(false);
      
      toast({
        title: `Selected: ${service.name}`,
        description: 'Set price manually',
      });
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const handleManualEntry = () => {
    onOpenChange(false);
    toast({
      title: 'Manual Entry',
      description: 'Enter service details manually',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-md",
          isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        )}
      >
        <DialogHeader>
          <DialogTitle className={cn(
            "flex items-center gap-2",
            isDark ? "text-white" : "text-gray-900"
          )}>
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600">
              <Search className="w-4 h-4 text-white" />
            </div>
            SmsBower Services
          </DialogTitle>
          <DialogDescription className={isDark ? "text-gray-400" : "text-gray-500"}>
            {matchedServices.length > 0 
              ? `Found ${matchedServices.length} matching services for "${serviceName}"`
              : `Searching for "${serviceName}"...`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
            <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
              Searching SmsBower services...
            </span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <p className={cn("text-sm text-center mb-4", isDark ? "text-gray-400" : "text-gray-500")}>
              {error}
            </p>
            <Button
              onClick={handleManualEntry}
              variant="outline"
              className={isDark ? "bg-gray-800 border-gray-700" : ""}
            >
              Enter Manually
            </Button>
          </div>
        ) : matchedServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
              <Search className="w-6 h-6 text-amber-500" />
            </div>
            <p className={cn("text-sm text-center mb-4", isDark ? "text-gray-400" : "text-gray-500")}>
              No matching services found for "{serviceName}"
            </p>
            <Button
              onClick={handleManualEntry}
              variant="outline"
              className={isDark ? "bg-gray-800 border-gray-700" : ""}
            >
              Enter Manually
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[320px] pr-2">
              <div className="grid grid-cols-2 gap-2 p-1">
                {matchedServices.map((service) => {
                  const isSelected = selectedService?.code === service.code;
                  
                  return (
                    <button
                      key={service.code}
                      type="button"
                      onClick={() => handleSelectAndFetchPrice(service)}
                      disabled={isFetchingPrice}
                      className={cn(
                        "relative flex items-center gap-2 p-3 rounded-xl transition-all duration-200 text-left",
                        isFetchingPrice && !isSelected && "opacity-50 pointer-events-none",
                        isDark
                          ? isSelected
                            ? "bg-emerald-500/20 border-2 border-emerald-500"
                            : "bg-gray-800 border-2 border-transparent hover:bg-gray-700 hover:border-gray-600"
                          : isSelected
                            ? "bg-emerald-50 border-2 border-emerald-500"
                            : "bg-gray-50 border-2 border-transparent hover:bg-gray-100 hover:border-gray-200"
                      )}
                    >
                      {/* Service Icon */}
                      <div className={cn(
                        "w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0"
                      )}>
                        {service.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Service Info */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className={cn(
                          "font-medium truncate text-xs",
                          isDark ? "text-gray-200" : "text-gray-700"
                        )}>
                          {service.name}
                        </span>
                        <span className={cn(
                          "text-[10px] truncate",
                          isDark ? "text-gray-500" : "text-gray-400"
                        )}>
                          {service.code}
                        </span>
                      </div>

                      {/* Loading/Selected indicator */}
                      {isSelected && isFetchingPrice && (
                        <div className="absolute top-1.5 right-1.5">
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                        </div>
                      )}
                      {isSelected && !isFetchingPrice && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleManualEntry}
                disabled={isFetchingPrice}
                className={cn(
                  "flex-1",
                  isDark && "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                )}
              >
                <X className="w-4 h-4 mr-1.5" />
                Manual
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
