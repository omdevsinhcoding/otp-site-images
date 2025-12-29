import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { ArrowLeft, ArrowRight, Server, ChevronDown, Check, Search, Globe, Link2, Settings, Zap, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { countries, Country } from '@/data/countries';
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
import { useDatabase } from '@/hooks/useDatabase';

interface ServerFormData {
  serverName: string;
  countryCode: string;
  apiResponseType: 'text' | 'json';
  usesHeaders: boolean;
  headerKeyName: string;
  headerValue: string;
  apiGetNumberUrl: string;
  numberIdPath: string;
  phoneNumberPath: string;
  apiGetMessage: string;
  otpPathInJson: string;
  apiActivateNextMessageUrl: string;
  apiCancelNumberUrl: string;
  autoCancelMinutes: number;
  apiRetryCount: number;
}

const steps = [
  { id: 1, title: 'Server Info', icon: Server },
  { id: 2, title: 'API Setup', icon: Link2 },
  { id: 3, title: 'Settings', icon: Settings },
];

function AddServerContent() {
  const navigate = useNavigate();
  const { resolvedTheme } = useAdminTheme();
  const isDark = resolvedTheme === 'dark';
  const { toast } = useToast();
  const { user } = useAuth();
  const db = useDatabase();
  const [isSaving, setIsSaving] = useState(false);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [countryOpen, setCountryOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(
    countries.find(c => c.code === 'IN') || null
  );
  const [countrySearch, setCountrySearch] = useState('');
  
  const [formData, setFormData] = useState<ServerFormData>({
    serverName: '',
    countryCode: '',
    apiResponseType: 'text',
    usesHeaders: false,
    headerKeyName: '',
    headerValue: '',
    apiGetNumberUrl: '',
    numberIdPath: '',
    phoneNumberPath: '',
    apiGetMessage: '',
    otpPathInJson: '',
    apiActivateNextMessageUrl: '',
    apiCancelNumberUrl: '',
    autoCancelMinutes: 20,
    apiRetryCount: 3,
  });

  const filteredCountries = useMemo(() => {
    if (!countrySearch) return countries;
    const search = countrySearch.toLowerCase();
    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(search) ||
        country.dialCode.includes(search) ||
        country.code.toLowerCase().includes(search)
    );
  }, [countrySearch]);

  const handleInputChange = (field: keyof ServerFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setCountryOpen(false);
    setCountrySearch('');
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      return;
    }

    if (!formData.serverName.trim()) {
      toast({ title: 'Error', description: 'Server name is required', variant: 'destructive' });
      setCurrentStep(1);
      return;
    }
    
    if (!selectedCountry) {
      toast({ title: 'Error', description: 'Please select a country', variant: 'destructive' });
      setCurrentStep(1);
      return;
    }
    
    if (!formData.apiGetNumberUrl.trim()) {
      toast({ title: 'Error', description: 'API Get Number URL is required', variant: 'destructive' });
      setCurrentStep(2);
      return;
    }

    setIsSaving(true);
    
    try {
      const result = await db.admin.addSmsServer(user.id, {
        server_name: formData.serverName,
        country_code: formData.countryCode,
        country_name: selectedCountry.name,
        country_dial_code: selectedCountry.dialCode,
        country_flag: selectedCountry.flag,
        api_response_type: formData.apiResponseType,
        uses_headers: formData.usesHeaders,
        header_key_name: formData.headerKeyName || undefined,
        header_value: formData.headerValue || undefined,
        api_get_number_url: formData.apiGetNumberUrl,
        api_get_message_url: formData.apiGetMessage || undefined,
        api_activate_next_message_url: formData.apiActivateNextMessageUrl || undefined,
        api_cancel_number_url: formData.apiCancelNumberUrl || undefined,
        number_id_path: formData.numberIdPath || undefined,
        phone_number_path: formData.phoneNumberPath || undefined,
        otp_path_in_json: formData.otpPathInJson || undefined,
        auto_cancel_minutes: formData.autoCancelMinutes,
        api_retry_count: formData.apiRetryCount,
      });

      if (!result.success) {
        toast({ title: 'Error', description: result.error || 'Failed to add server', variant: 'destructive' });
        return;
      }

      toast({ title: 'Success', description: `Server "${result.data?.server_name}" added successfully` });
      navigate('/admin/services');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'An error occurred', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const validateStep1 = (): boolean => {
    if (!formData.serverName.trim() || !selectedCountry) {
      toast({ title: 'Complete Server Info First', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.apiGetNumberUrl.trim()) {
      toast({ title: 'Complete API Setup First', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleStepClick = (stepId: number) => {
    // Validate step 1 before going to step 2 or 3
    if (stepId > 1 && currentStep === 1 && !validateStep1()) {
      return;
    }
    // Validate step 2 before going to step 3
    if (stepId === 3 && currentStep === 2 && !validateStep2()) {
      return;
    }
    // If jumping from step 1 directly to step 3, validate both
    if (stepId === 3 && currentStep === 1) {
      if (!validateStep1()) return;
      toast({ title: 'Complete API Setup First', variant: 'destructive' });
      return;
    }
    setCurrentStep(stepId);
  };

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep < 3) setCurrentStep(currentStep + 1);
    else handleSubmit();
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const inputClass = cn(
    "h-12 rounded-lg border-2 transition-all duration-200 focus:ring-0",
    isDark 
      ? "bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:bg-gray-800" 
      : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500"
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={() => navigate('/admin/services')}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-colors",
            isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
          )}
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Back
        </button>
        
        <div className={cn(
          "px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium",
          isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-500/10 text-blue-600"
        )}>
          Step {currentStep} of 3
        </div>
      </div>

      {/* Step Indicators - Horizontal on mobile/tablet */}
      <div className="flex items-center justify-center mb-4 sm:mb-6 xl:hidden">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => handleStepClick(step.id)}
                className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all shadow-sm",
                  isActive && "bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-blue-500/30",
                  isCompleted && "bg-green-500 text-white shadow-green-500/30",
                  !isActive && !isCompleted && (isDark ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-500")
                )}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : step.id}
              </button>
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-8 xs:w-12 sm:w-16 md:w-24 h-0.5 mx-1.5 sm:mx-2 rounded-full",
                  isCompleted ? "bg-green-500" : (isDark ? "bg-gray-700" : "bg-gray-200")
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Step Title */}
      <div className="xl:hidden mb-4 sm:mb-6 text-center">
        <p className={cn("text-sm sm:text-base font-semibold", isDark ? "text-white" : "text-gray-900")}>
          {steps[currentStep - 1].title}
        </p>
        <p className={cn("text-xs sm:text-sm mt-0.5", isDark ? "text-gray-400" : "text-gray-500")}>
          {currentStep === 1 && "Name & Country"}
          {currentStep === 2 && "API Endpoints"}
          {currentStep === 3 && "Final Config"}
        </p>
      </div>

      {/* Main Content */}
      <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
        {/* Left Side - Steps (Desktop only) */}
        <div className="hidden xl:block w-72 2xl:w-80 shrink-0">
          <div className={cn(
            "sticky top-6 rounded-2xl p-6 shadow-sm",
            isDark ? "bg-gray-800/60 border border-gray-700/50" : "bg-white border border-gray-100"
          )}>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-dashed" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={cn("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>
                  New Server
                </h1>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                  SMS Configuration
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {steps.map((step, index) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                const Icon = step.icon;
                
                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(step.id)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 text-left",
                      isActive && (isDark ? "bg-blue-500/20 border border-blue-500/30" : "bg-blue-500/10 border border-blue-500/20"),
                      !isActive && "border border-transparent",
                      !isActive && (isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50")
                    )}
                  >
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0",
                      isActive && "bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/20",
                      isCompleted && "bg-green-500 text-white shadow-md shadow-green-500/20",
                      !isActive && !isCompleted && (isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500")
                    )}>
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className={cn(
                        "font-semibold text-[15px]",
                        isActive && "text-blue-500",
                        isCompleted && (isDark ? "text-green-400" : "text-green-600"),
                        !isActive && !isCompleted && (isDark ? "text-gray-300" : "text-gray-700")
                      )}>
                        {step.title}
                      </p>
                      <p className={cn("text-sm mt-0.5", isDark ? "text-gray-500" : "text-gray-400")}>
                        {index === 0 && "Name & Country"}
                        {index === 1 && "API Endpoints"}
                        {index === 2 && "Final Config"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className={cn(
            "flex-1 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm",
            isDark ? "bg-gray-800/40 border border-gray-700/50" : "bg-white border border-gray-100"
          )}>
            {/* Step 1: Server Info */}
            {currentStep === 1 && (
              <div className="space-y-5 sm:space-y-6 animate-fade-in">
                <div>
                  <h2 className={cn("text-lg sm:text-xl lg:text-2xl font-bold mb-1", isDark ? "text-white" : "text-gray-900")}>
                    Server Information
                  </h2>
                  <p className={cn("text-xs sm:text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                    Enter the basic details for your SMS server
                  </p>
                </div>

                <div className="space-y-4 sm:space-y-5">
                  <div className="space-y-1.5">
                    <Label className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                      Server Name
                    </Label>
                    <Input
                      placeholder="My SMS Server"
                      value={formData.serverName}
                      onChange={(e) => handleInputChange('serverName', e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                      Country
                    </Label>
                    <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            "w-full h-12 px-4 rounded-lg border-2 flex items-center justify-between transition-all",
                            isDark 
                              ? "bg-gray-800/50 border-gray-700 hover:border-gray-600" 
                              : "bg-white border-gray-200 hover:border-gray-300",
                            countryOpen && "border-blue-500"
                          )}
                        >
                          {selectedCountry ? (
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{selectedCountry.flag}</span>
                              <span className={cn("text-sm", isDark ? "text-white" : "text-gray-900")}>
                                {selectedCountry.name}
                              </span>
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded",
                                isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                              )}>
                                +{selectedCountry.dialCode}
                              </span>
                            </div>
                          ) : (
                            <span className={cn("text-sm", isDark ? "text-gray-500" : "text-gray-400")}>
                              Select a country...
                            </span>
                          )}
                          <ChevronDown className={cn(
                            "w-4 h-4 transition-transform",
                            countryOpen && "rotate-180",
                            isDark ? "text-gray-400" : "text-gray-500"
                          )} />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent 
                        className={cn(
                          "w-[320px] p-0 rounded-lg overflow-hidden shadow-xl",
                          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                        )} 
                        align="start"
                      >
                        <div className={cn(
                          "flex items-center gap-2 px-3 py-2.5 border-b",
                          isDark ? "border-gray-700" : "border-gray-100"
                        )}>
                          <Search className={cn("w-4 h-4", isDark ? "text-gray-400" : "text-gray-500")} />
                          <input
                            placeholder="Search country..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className={cn(
                              "flex-1 bg-transparent outline-none text-sm",
                              isDark ? "text-white placeholder:text-gray-500" : "text-gray-900 placeholder:text-gray-400"
                            )}
                          />
                        </div>
                        <Command className={cn("bg-transparent", isDark ? "bg-gray-800" : "bg-white")}>
                          <CommandList className="max-h-[250px] overflow-y-auto p-1.5">
                            <CommandEmpty className={cn("py-4 text-center text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                              No country found.
                            </CommandEmpty>
                            <CommandGroup>
                              {filteredCountries.map((country) => (
                                <CommandItem
                                  key={country.code}
                                  value={country.name}
                                  onSelect={() => handleCountrySelect(country)}
                                  className={cn(
                                    "flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-pointer text-sm",
                                    isDark 
                                      ? "hover:bg-gray-700 aria-selected:bg-gray-700" 
                                      : "hover:bg-gray-50 aria-selected:bg-gray-50"
                                  )}
                                >
                                  <span className="text-lg">{country.flag}</span>
                                  <span className={cn("flex-1", isDark ? "text-white" : "text-gray-900")}>
                                    {country.name}
                                  </span>
                                  <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                                    +{country.dialCode}
                                  </span>
                                  {selectedCountry?.code === country.code && (
                                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Country Code Input */}
                  <div className="space-y-1.5">
                    <Label className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                      Country Code
                    </Label>
                    <Input
                      placeholder="Enter country code (e.g. 22)"
                      value={formData.countryCode}
                      onChange={(e) => handleInputChange('countryCode', e.target.value.replace(/\D/g, ''))}
                      className={inputClass}
                    />
                    <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
                      Enter the country dial code manually
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: API Setup */}
            {currentStep === 2 && (
              <div className="space-y-5 sm:space-y-6 animate-fade-in">
                <div>
                  <h2 className={cn("text-lg sm:text-xl lg:text-2xl font-bold mb-1", isDark ? "text-white" : "text-gray-900")}>
                    API Configuration
                  </h2>
                  <p className={cn("text-xs sm:text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                    Configure API endpoints and response handling
                  </p>
                </div>

                <div className="space-y-4 sm:space-y-5">
                  {/* Response Type */}
                  <div className="space-y-1.5">
                    <Label className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                      Response Format
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['text', 'json'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleInputChange('apiResponseType', type)}
                          className={cn(
                            "h-11 rounded-lg font-medium transition-all flex items-center justify-center gap-2 border-2 text-sm",
                            formData.apiResponseType === type
                              ? "bg-gradient-to-r from-blue-500 to-cyan-500 border-blue-500 text-white"
                              : isDark
                                ? "bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-600"
                                : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                          )}
                        >
                          {type.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Headers Toggle */}
                  <div className={cn(
                    "p-3 rounded-lg flex items-center justify-between",
                    isDark ? "bg-gray-800/50" : "bg-gray-50"
                  )}>
                    <div>
                      <p className={cn("font-medium text-sm", isDark ? "text-white" : "text-gray-900")}>
                        API Headers
                      </p>
                      <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                        Enable if API requires auth headers
                      </p>
                    </div>
                    <Switch
                      checked={formData.usesHeaders}
                      onCheckedChange={(checked) => handleInputChange('usesHeaders', checked)}
                    />
                  </div>

                  {formData.usesHeaders && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
                      <div className="space-y-1.5">
                        <Label className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                          Header Key
                        </Label>
                        <Input
                          placeholder="Authorization"
                          value={formData.headerKeyName}
                          onChange={(e) => handleInputChange('headerKeyName', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                          Header Value
                        </Label>
                        <Input
                          placeholder="Bearer your_token"
                          value={formData.headerValue}
                          onChange={(e) => handleInputChange('headerValue', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  )}

                  {/* Get Number URL */}
                  <div className="space-y-1.5">
                    <Label className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                      Get Number URL
                    </Label>
                    <Input
                      placeholder="https://api.example.com/get-number"
                      value={formData.apiGetNumberUrl}
                      onChange={(e) => handleInputChange('apiGetNumberUrl', e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  {formData.apiResponseType === 'json' && (
                    <div className={cn(
                      "p-4 rounded-lg space-y-3 animate-fade-in",
                      isDark ? "bg-blue-500/10 border border-blue-500/20" : "bg-blue-50 border border-blue-100"
                    )}>
                      <p className={cn("text-xs font-medium", isDark ? "text-blue-300" : "text-blue-700")}>
                        JSON Path Configuration
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className={cn("text-xs", isDark ? "text-blue-300/70" : "text-blue-600")}>
                            Number ID Path
                          </Label>
                          <Input
                            placeholder="data.id"
                            value={formData.numberIdPath}
                            onChange={(e) => handleInputChange('numberIdPath', e.target.value)}
                            className={cn(inputClass, "font-mono text-sm")}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className={cn("text-xs", isDark ? "text-blue-300/70" : "text-blue-600")}>
                            Phone Number Path
                          </Label>
                          <Input
                            placeholder="data.phone"
                            value={formData.phoneNumberPath}
                            onChange={(e) => handleInputChange('phoneNumberPath', e.target.value)}
                            className={cn(inputClass, "font-mono text-sm")}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Get Message URL */}
                  <div className="space-y-1.5">
                    <Label className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                      Get Message URL
                    </Label>
                    <Input
                      placeholder="https://api.example.com/get-message"
                      value={formData.apiGetMessage}
                      onChange={(e) => handleInputChange('apiGetMessage', e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  {formData.apiResponseType === 'json' && (
                    <div className={cn(
                      "p-4 rounded-lg space-y-3 animate-fade-in",
                      isDark ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-emerald-50 border border-emerald-100"
                    )}>
                      <p className={cn("text-xs font-medium", isDark ? "text-emerald-300" : "text-emerald-700")}>
                        OTP Response Path
                      </p>
                      <div className="space-y-1.5">
                        <Label className={cn("text-xs", isDark ? "text-emerald-300/70" : "text-emerald-600")}>
                          OTP Path in JSON
                        </Label>
                        <Input
                          placeholder="data.otp"
                          value={formData.otpPathInJson}
                          onChange={(e) => handleInputChange('otpPathInJson', e.target.value)}
                          className={cn(inputClass, "font-mono text-sm")}
                        />
                      </div>
                    </div>
                  )}

                  {/* Activate Next Message URL */}
                  <div className="space-y-1.5">
                    <Label className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                      Activate Next Message URL
                    </Label>
                    <Input
                      placeholder="https://api.example.com/activate-next"
                      value={formData.apiActivateNextMessageUrl}
                      onChange={(e) => handleInputChange('apiActivateNextMessageUrl', e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  {/* API Cancel Number URL */}
                  <div className="space-y-1.5">
                    <Label className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                      API Cancel Number URL
                    </Label>
                    <Input
                      placeholder="https://api.example.com/cancel-number"
                      value={formData.apiCancelNumberUrl}
                      onChange={(e) => handleInputChange('apiCancelNumberUrl', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Settings */}
            {currentStep === 3 && (
              <div className="space-y-5 sm:space-y-6 animate-fade-in">
                <div>
                  <h2 className={cn("text-lg sm:text-xl lg:text-2xl font-bold mb-1", isDark ? "text-white" : "text-gray-900")}>
                    Server Settings
                  </h2>
                  <p className={cn("text-xs sm:text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                    Configure timeout and retry settings
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className={cn(
                    "p-4 rounded-lg",
                    isDark ? "bg-gray-800/50" : "bg-gray-50"
                  )}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center",
                        isDark ? "bg-amber-500/20" : "bg-amber-100"
                      )}>
                        <Settings className={cn("w-4 h-4", isDark ? "text-amber-400" : "text-amber-600")} />
                      </div>
                      <div>
                        <Label className={cn("font-medium text-sm", isDark ? "text-white" : "text-gray-900")}>
                          Auto Cancel
                        </Label>
                        <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                          Minutes before auto-cancel
                        </p>
                      </div>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      value={formData.autoCancelMinutes}
                      onChange={(e) => handleInputChange('autoCancelMinutes', parseInt(e.target.value) || 20)}
                      className={inputClass}
                    />
                  </div>

                  <div className={cn(
                    "p-4 rounded-lg",
                    isDark ? "bg-gray-800/50" : "bg-gray-50"
                  )}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center",
                        isDark ? "bg-rose-500/20" : "bg-rose-100"
                      )}>
                        <Zap className={cn("w-4 h-4", isDark ? "text-rose-400" : "text-rose-600")} />
                      </div>
                      <div>
                        <Label className={cn("font-medium text-sm", isDark ? "text-white" : "text-gray-900")}>
                          Retry Count
                        </Label>
                        <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                          Retries on API failure
                        </p>
                      </div>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={formData.apiRetryCount}
                      onChange={(e) => handleInputChange('apiRetryCount', parseInt(e.target.value) || 3)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className={cn(
                  "p-3 sm:p-4 rounded-xl",
                  isDark ? "bg-blue-500/10 border border-blue-500/20" : "bg-blue-500/5 border border-blue-500/10"
                )}>
                  <h3 className={cn("font-semibold text-sm mb-3", isDark ? "text-white" : "text-gray-900")}>
                    Summary
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs">
                    <div>
                      <p className={isDark ? "text-gray-400" : "text-gray-500"}>Server</p>
                      <p className={cn("font-medium mt-0.5", isDark ? "text-white" : "text-gray-900")}>
                        {formData.serverName || '—'}
                      </p>
                    </div>
                    <div>
                      <p className={isDark ? "text-gray-400" : "text-gray-500"}>Country</p>
                      <p className={cn("font-medium mt-0.5", isDark ? "text-white" : "text-gray-900")}>
                        {selectedCountry ? `${selectedCountry.flag} +${selectedCountry.dialCode}` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className={isDark ? "text-gray-400" : "text-gray-500"}>Format</p>
                      <p className={cn("font-medium mt-0.5", isDark ? "text-white" : "text-gray-900")}>
                        {formData.apiResponseType.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className={isDark ? "text-gray-400" : "text-gray-500"}>Headers</p>
                      <p className={cn("font-medium mt-0.5", isDark ? "text-white" : "text-gray-900")}>
                        {formData.usesHeaders ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center mt-4 sm:mt-5 pt-4 sm:pt-5 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={cn(
                "gap-1 sm:gap-1.5 text-xs sm:text-sm h-9 sm:h-10 px-2.5 sm:px-4",
                currentStep === 1 && "opacity-0 pointer-events-none"
              )}
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Previous</span>
              <span className="xs:hidden">Back</span>
            </Button>

            <Button
              size="sm"
              onClick={nextStep}
              disabled={isSaving}
              className="gap-1 sm:gap-1.5 px-4 sm:px-6 text-xs sm:text-sm h-9 sm:h-10 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-md shadow-blue-500/20 disabled:opacity-70"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                  Saving...
                </>
              ) : currentStep === 3 ? (
                'Create Server'
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AddServerPage() {
  return (
    <AdminLayout>
      <AddServerContent />
    </AdminLayout>
  );
}
