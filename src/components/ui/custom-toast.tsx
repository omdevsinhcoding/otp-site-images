import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, Check, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { getDisabledToasts, findToastByMessage } from '@/data/toastRegistry';

export type ToastType = 'error' | 'success' | 'warning' | 'info' | 'loading';

export interface ToastTypeSettings {
  error: boolean;
  success: boolean;
  warning: boolean;
  info: boolean;
  loading: boolean;
}

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  persistent?: boolean;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, allowDuplicate?: boolean, duration?: number) => string;
  updateToast: (id: string, message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
  toastTypeSettings: ToastTypeSettings;
  setToastTypeEnabled: (type: ToastType, enabled: boolean) => void;
  setAllToastTypes: (enabled: boolean) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const iconConfig = {
  error: { bg: '#FF3B30', Icon: X },
  success: { bg: '#34C759', Icon: Check },
  warning: { bg: '#FF9500', Icon: AlertTriangle },
  info: { bg: '#007AFF', Icon: Info },
  loading: { bg: '#007AFF', Icon: Loader2 },
};

const ToastItem = ({ 
  toast, 
  onRemove,
  animationsEnabled
}: { 
  toast: Toast; 
  onRemove: (id: string) => void;
  animationsEnabled: boolean;
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const { bg, Icon } = iconConfig[toast.type];
  const isLoading = toast.type === 'loading';

  useEffect(() => {
    // Don't auto-dismiss loading toasts
    if (toast.persistent || isLoading) return;
    
    // Use custom duration or default (2700ms)
    const dismissTime = toast.duration || 2700;
    
    const timer = setTimeout(() => {
      setIsExiting(true);
    }, dismissTime);

    return () => clearTimeout(timer);
  }, [toast.persistent, isLoading, toast.duration]);

  useEffect(() => {
    if (isExiting) {
      const exitTime = animationsEnabled ? 300 : 0;
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, exitTime);
      return () => clearTimeout(timer);
    }
  }, [isExiting, onRemove, toast.id, animationsEnabled]);

  const getAnimationClass = () => {
    if (!animationsEnabled) {
      return isExiting ? 'opacity-0' : 'opacity-100';
    }
    return isExiting 
      ? 'opacity-0 -translate-y-2' 
      : 'opacity-100 translate-y-0 animate-toast-enter';
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3
        bg-white rounded-xl
        shadow-[0_4px_20px_rgba(0,0,0,0.08)]
        transform max-w-[280px] sm:max-w-[360px]
        ${animationsEnabled ? 'transition-all duration-300 ease-out' : ''}
        ${getAnimationClass()}
      `}
    >
      <div
        className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0"
        style={{ backgroundColor: bg }}
      >
        <Icon className={`w-4 h-4 text-white ${isLoading ? 'animate-spin' : ''}`} strokeWidth={2.5} />
      </div>
      <span className="text-sm font-medium text-gray-700">
        {toast.message}
      </span>
    </div>
  );
};

const ToastContainer = ({ animationsEnabled }: { animationsEnabled: boolean }) => {
  const context = useContext(ToastContext);
  if (!context) return null;

  const { toasts, removeToast } = context;

  return (
    <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-5 sm:top-5 z-[9999] flex flex-col gap-2 items-center sm:items-end">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} animationsEnabled={animationsEnabled} />
      ))}
    </div>
  );
};

const TOAST_ANIMATIONS_KEY = 'toast-animations-enabled';
const TOAST_TYPE_SETTINGS_KEY = 'toast-type-settings';

const defaultToastTypeSettings: ToastTypeSettings = {
  error: true,
  success: true,
  warning: true,
  info: true,
  loading: true,
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [animationsEnabled, setAnimationsEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(TOAST_ANIMATIONS_KEY);
    return stored !== null ? stored === 'true' : true;
  });

  const [toastTypeSettings, setToastTypeSettings] = useState<ToastTypeSettings>(() => {
    if (typeof window === 'undefined') return defaultToastTypeSettings;
    const stored = localStorage.getItem(TOAST_TYPE_SETTINGS_KEY);
    if (stored) {
      try {
        return { ...defaultToastTypeSettings, ...JSON.parse(stored) };
      } catch {
        return defaultToastTypeSettings;
      }
    }
    return defaultToastTypeSettings;
  });

  const setAnimationsEnabled = useCallback((enabled: boolean) => {
    setAnimationsEnabledState(enabled);
    localStorage.setItem(TOAST_ANIMATIONS_KEY, String(enabled));
  }, []);

  const setToastTypeEnabled = useCallback((type: ToastType, enabled: boolean) => {
    setToastTypeSettings(prev => {
      const newSettings = { ...prev, [type]: enabled };
      localStorage.setItem(TOAST_TYPE_SETTINGS_KEY, JSON.stringify(newSettings));
      return newSettings;
    });
  }, []);

  const setAllToastTypes = useCallback((enabled: boolean) => {
    const newSettings: ToastTypeSettings = {
      error: enabled,
      success: enabled,
      warning: enabled,
      info: enabled,
      loading: enabled,
    };
    setToastTypeSettings(newSettings);
    localStorage.setItem(TOAST_TYPE_SETTINGS_KEY, JSON.stringify(newSettings));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'error', allowDuplicate = false, duration?: number): string => {
      // Check if this toast type is enabled
      if (!toastTypeSettings[type]) {
        return ''; // Return empty string if toast type is disabled
      }

      // Check if this specific toast is disabled in the registry
      const registeredToast = findToastByMessage(message);
      if (registeredToast) {
        const disabledToasts = getDisabledToasts();
        if (disabledToasts.includes(registeredToast.id)) {
          return ''; // Return empty string if specific toast is disabled
        }
      }

      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const persistent = type === 'loading';

      setToasts((prev) => {
        if (!allowDuplicate) {
          const exists = prev.some((t) => t.message === message);
          if (exists) return prev;
        }
        return [...prev, { id, message, type, persistent, duration }];
      });
      
      return id;
    },
    [toastTypeSettings]
  );

  const updateToast = useCallback((id: string, message: string, type: ToastType, duration?: number) => {
    setToasts((prev) => 
      prev.map((t) => 
        t.id === id 
          ? { ...t, message, type, persistent: false, duration } 
          : t
      )
    );
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Set the standalone toast function when provider mounts
  useEffect(() => {
    setToastFunction((message: string, type?: ToastType) => {
      return showToast(message, type, true);
    });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ 
      toasts, 
      showToast, 
      updateToast, 
      removeToast, 
      animationsEnabled, 
      setAnimationsEnabled,
      toastTypeSettings,
      setToastTypeEnabled,
      setAllToastTypes
    }}>
      {children}
      <ToastContainer animationsEnabled={animationsEnabled} />
    </ToastContext.Provider>
  );
};

export const useCustomToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useCustomToast must be used within a ToastProvider');
  }
  return context;
};

// Standalone toast function for use outside React components
let toastFn: ((message: string, type?: ToastType) => string) | null = null;

export const setToastFunction = (fn: (message: string, type?: ToastType) => string) => {
  toastFn = fn;
};

export const toast = {
  error: (message: string) => toastFn?.(message, 'error'),
  success: (message: string) => toastFn?.(message, 'success'),
  warning: (message: string) => toastFn?.(message, 'warning'),
  info: (message: string) => toastFn?.(message, 'info'),
  loading: (message: string) => toastFn?.(message, 'loading'),
};
