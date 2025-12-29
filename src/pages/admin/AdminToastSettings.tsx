import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { useToastSettings } from '@/hooks/useToastSettings';
import { useCustomToast } from '@/components/ui/custom-toast';
import { 
  toastRegistry, 
  toastCategories, 
  getDisabledToasts, 
  setDisabledToasts,
  ToastEntry 
} from '@/data/toastRegistry';
import { 
  ArrowLeft, Bell, Sparkles, Zap, CheckCircle, AlertTriangle, 
  Info, X, Loader2, ToggleLeft, ToggleRight, ChevronDown, ChevronRight,
  Search, ArrowUpAZ
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const typeIcons: Record<string, { icon: React.ElementType; color: string }> = {
  success: { icon: CheckCircle, color: '#34C759' },
  error: { icon: X, color: '#FF3B30' },
  warning: { icon: AlertTriangle, color: '#FF9500' },
  info: { icon: Info, color: '#007AFF' },
  loading: { icon: Loader2, color: '#007AFF' },
};

function ToastSettingsContent() {
  const navigate = useNavigate();
  const { resolvedTheme } = useAdminTheme();
  const isDark = resolvedTheme === 'dark';
  const { animationsEnabled, toggleAnimations } = useToastSettings();
  const { showToast } = useCustomToast();
  
  const [disabledToasts, setDisabledToastsState] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAlphabetically, setSortAlphabetically] = useState(false);

  useEffect(() => {
    setDisabledToastsState(getDisabledToasts());
  }, []);

  const toggleToast = (id: string) => {
    const newDisabled = disabledToasts.includes(id)
      ? disabledToasts.filter(t => t !== id)
      : [...disabledToasts, id];
    setDisabledToastsState(newDisabled);
    setDisabledToasts(newDisabled);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const enableAllInCategory = (category: string) => {
    const categoryToasts = toastRegistry.filter(t => t.category === category);
    const newDisabled = disabledToasts.filter(id => 
      !categoryToasts.some(t => t.id === id)
    );
    setDisabledToastsState(newDisabled);
    setDisabledToasts(newDisabled);
  };

  const disableAllInCategory = (category: string) => {
    const categoryToasts = toastRegistry.filter(t => t.category === category);
    const newDisabled = [...new Set([...disabledToasts, ...categoryToasts.map(t => t.id)])];
    setDisabledToastsState(newDisabled);
    setDisabledToasts(newDisabled);
  };

  const enableAll = () => {
    setDisabledToastsState([]);
    setDisabledToasts([]);
  };

  const disableAll = () => {
    const allIds = toastRegistry.map(t => t.id);
    setDisabledToastsState(allIds);
    setDisabledToasts(allIds);
  };

  const handlePreviewToast = (toast: ToastEntry) => {
    if (disabledToasts.includes(toast.id)) {
      showToast('This toast is disabled', 'info', true);
      return;
    }
    showToast(toast.message, toast.type, true);
  };

  const filteredRegistry = searchQuery 
    ? toastRegistry.filter(t => 
        t.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : toastRegistry;

  // Sort categories based on user preference
  const sortedCategories = [...toastCategories].sort((a, b) => {
    if (sortAlphabetically) {
      return a.localeCompare(b);
    }
    // Default: API Status first
    if (a === 'API Status') return -1;
    if (b === 'API Status') return 1;
    return 0;
  });

  const groupedToasts = sortedCategories.reduce((acc, category) => {
    acc[category] = filteredRegistry.filter(t => t.category === category);
    return acc;
  }, {} as Record<string, ToastEntry[]>);

  const enabledCount = toastRegistry.length - disabledToasts.length;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/users')}
        className={cn(
          "group flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300",
          isDark 
            ? "bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700/50 hover:border-gray-600 shadow-lg shadow-black/20" 
            : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 shadow-lg shadow-gray-200/50 hover:shadow-xl"
        )}
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Users
      </button>

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-6 h-6 sm:w-8 sm:h-8" />
            <h1 className="text-2xl sm:text-3xl font-bold">Toast Settings</h1>
          </div>
          <p className="text-white/80 max-w-xl text-sm sm:text-base">
            Manage all {toastRegistry.length} toast notifications. {enabledCount} enabled, {disabledToasts.length} disabled.
          </p>
        </div>
      </div>

      {/* Animation Toggle */}
      <div className={cn(
        "rounded-xl p-4 border",
        isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200 shadow-md"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                Toast Animations
              </h3>
              <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                {animationsEnabled ? "Smooth slide-in" : "Instant appear"}
              </p>
            </div>
          </div>
          <Switch checked={animationsEnabled} onCheckedChange={toggleAnimations} />
        </div>
      </div>

      {/* Search & Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
            isDark ? "text-gray-400" : "text-gray-500"
          )} />
          <Input
            placeholder="Search toasts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pl-9",
              isDark && "bg-gray-900 border-gray-700"
            )}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortAlphabetically(!sortAlphabetically)}
            className={cn(
              isDark && "border-gray-600 hover:bg-gray-800",
              sortAlphabetically && (isDark ? "bg-gray-800 border-blue-500" : "bg-blue-50 border-blue-500")
            )}
          >
            <ArrowUpAZ className="w-4 h-4 mr-1.5" />
            A-Z
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={enableAll}
            disabled={disabledToasts.length === 0}
            className={cn(isDark && "border-gray-600 hover:bg-gray-800")}
          >
            <ToggleRight className="w-4 h-4 mr-1.5" />
            Enable All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={disableAll}
            disabled={disabledToasts.length === toastRegistry.length}
            className={cn(isDark && "border-gray-600 hover:bg-gray-800")}
          >
            <ToggleLeft className="w-4 h-4 mr-1.5" />
            Disable All
          </Button>
        </div>
      </div>

      {/* Toast Categories */}
      <div className="space-y-3">
        {sortedCategories.map((category) => {
          const categoryToasts = groupedToasts[category] || [];
          if (categoryToasts.length === 0) return null;
          
          const isExpanded = expandedCategories.includes(category);
          const enabledInCategory = categoryToasts.filter(t => !disabledToasts.includes(t.id)).length;

          return (
            <div 
              key={category}
              className={cn(
                "rounded-xl border overflow-hidden",
                isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200 shadow-sm"
              )}
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className={cn(
                  "w-full flex items-center justify-between p-4 transition-colors",
                  isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className={cn("w-5 h-5", isDark ? "text-gray-400" : "text-gray-500")} />
                  ) : (
                    <ChevronRight className={cn("w-5 h-5", isDark ? "text-gray-400" : "text-gray-500")} />
                  )}
                  <span className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
                    {category}
                  </span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"
                  )}>
                    {enabledInCategory}/{categoryToasts.length}
                  </span>
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => enableAllInCategory(category)}
                    className="h-7 text-xs"
                  >
                    All On
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => disableAllInCategory(category)}
                    className="h-7 text-xs"
                  >
                    All Off
                  </Button>
                </div>
              </button>

              {/* Category Toasts */}
              {isExpanded && (
                <div className={cn(
                  "border-t divide-y",
                  isDark ? "border-gray-800 divide-gray-800" : "border-gray-100 divide-gray-100"
                )}>
                  {categoryToasts.map((toast) => {
                    const isEnabled = !disabledToasts.includes(toast.id);
                    const { icon: Icon, color } = typeIcons[toast.type];

                    return (
                      <div
                        key={toast.id}
                        className={cn(
                          "flex items-center justify-between p-3 px-4 transition-opacity",
                          !isEnabled && "opacity-50"
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div 
                            className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${color}20` }}
                          >
                            <Icon 
                              className={cn("w-4 h-4", toast.type === 'loading' && "animate-spin")} 
                              style={{ color }} 
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn(
                              "font-medium text-sm truncate",
                              isDark ? "text-white" : "text-gray-900"
                            )}>
                              {toast.message}
                            </p>
                            <p className={cn(
                              "text-xs truncate",
                              isDark ? "text-gray-500" : "text-gray-400"
                            )}>
                              {toast.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreviewToast(toast)}
                            className="h-7 px-2"
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </Button>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={() => toggleToast(toast.id)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Note */}
      <div className={cn(
        "rounded-xl p-4 border",
        isDark ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200"
      )}>
        <div className="flex gap-3">
          <Info className={cn("w-5 h-5 flex-shrink-0", isDark ? "text-blue-400" : "text-blue-600")} />
          <p className={cn("text-sm", isDark ? "text-blue-300" : "text-blue-700")}>
            Disabled toasts will not appear anywhere in the app. Be careful disabling error or loading toasts as they provide important feedback.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminToastSettings() {
  return (
    <AdminLayout title="Toast Settings">
      <ToastSettingsContent />
    </AdminLayout>
  );
}
