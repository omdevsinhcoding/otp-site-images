// This file is kept for backwards compatibility but the app now uses
// the custom toast system from custom-toast.tsx via ToastProvider in App.tsx
// The Toaster component is not used - all toast rendering happens in ToastProvider

export function Toaster() {
  // No-op component - custom toast system handles rendering
  return null;
}
