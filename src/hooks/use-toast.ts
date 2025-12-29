import * as React from "react";
import { useCustomToast, toast as customToast } from "@/components/ui/custom-toast";

// Adapter that forwards shadcn-style toast calls to the custom toast system
type ToastVariant = "default" | "destructive";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

// Hook that uses the custom toast context
function useToast() {
  const { showToast, updateToast, removeToast } = useCustomToast();

  const toast = React.useCallback(
    (options: ToastOptions) => {
      const message = options.description || options.title || "";
      
      // Map variant to toast type
      let type: "error" | "success" | "warning" | "info" = "info";
      
      if (options.variant === "destructive") {
        type = "error";
      } else if (options.title?.toLowerCase().includes("success")) {
        type = "success";
      } else if (options.title?.toLowerCase().includes("warning")) {
        type = "warning";
      } else if (
        options.title?.toLowerCase().includes("updating") ||
        options.title?.toLowerCase().includes("creating") ||
        options.title?.toLowerCase().includes("deleting") ||
        options.title?.toLowerCase().includes("refreshing") ||
        options.title?.toLowerCase().includes("processing")
      ) {
        type = "info";
      }
      
      // Create combined message
      const fullMessage = options.title && options.description 
        ? `${options.title}: ${options.description}`
        : message;

      return showToast(fullMessage, type, true);
    },
    [showToast]
  );

  return {
    toast,
    dismiss: removeToast,
  };
}

// Standalone toast function for use outside React components
const toast = (options: ToastOptions) => {
  const message = options.description || options.title || "";
  
  let type: "error" | "success" | "warning" | "info" = "info";
  
  if (options.variant === "destructive") {
    type = "error";
  } else if (options.title?.toLowerCase().includes("success")) {
    type = "success";
  } else if (options.title?.toLowerCase().includes("warning")) {
    type = "warning";
  }
  
  const fullMessage = options.title && options.description 
    ? `${options.title}: ${options.description}`
    : message;

  // Use the standalone toast from custom-toast
  if (type === "error") {
    customToast.error(fullMessage);
  } else if (type === "success") {
    customToast.success(fullMessage);
  } else if (type === "warning") {
    customToast.warning(fullMessage);
  } else {
    customToast.info(fullMessage);
  }
};

export { useToast, toast };
