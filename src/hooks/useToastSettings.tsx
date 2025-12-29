import { useCustomToast, ToastType, ToastTypeSettings } from '@/components/ui/custom-toast';

export function useToastSettings() {
  const { 
    animationsEnabled, 
    setAnimationsEnabled,
    toastTypeSettings,
    setToastTypeEnabled,
    setAllToastTypes
  } = useCustomToast();

  const toggleAnimations = () => {
    setAnimationsEnabled(!animationsEnabled);
  };

  const toggleToastType = (type: ToastType) => {
    setToastTypeEnabled(type, !toastTypeSettings[type]);
  };

  const enableAllToasts = () => setAllToastTypes(true);
  const disableAllToasts = () => setAllToastTypes(false);

  return { 
    animationsEnabled, 
    toggleAnimations, 
    setAnimationsEnabled,
    toastTypeSettings,
    toggleToastType,
    setToastTypeEnabled,
    enableAllToasts,
    disableAllToasts
  };
}
