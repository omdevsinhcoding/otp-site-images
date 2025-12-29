import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full border bg-background transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      inputSize: {
        default: "h-10 rounded-lg border-input px-3 text-sm focus-visible:ring-1 focus-visible:ring-primary/50 hover:bg-muted/50",
        sm: "h-9 rounded-md border-input px-3 text-sm focus-visible:ring-1 focus-visible:ring-primary/50",
        lg: "h-14 sm:h-16 rounded-xl border-input px-5 sm:px-6 py-3 sm:py-4 text-base sm:text-lg shadow-sm focus-visible:ring-0 focus-visible:border-2 focus-visible:border-[#6366f1] focus-visible:shadow-md hover:bg-[#f6f6f6] hover:border-input",
      },
    },
    defaultVariants: {
      inputSize: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {
  size?: React.ComponentProps<"input">["size"];
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputSize, size, ...props }, ref) => {
    return (
      <input
        type={type}
        size={size}
        className={cn(inputVariants({ inputSize }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
