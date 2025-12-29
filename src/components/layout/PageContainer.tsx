import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  /** Remove default padding */
  noPadding?: boolean;
  /** Full width without max-width constraint */
  fullWidth?: boolean;
}

/**
 * Global PageContainer - ensures consistent responsive layout across all pages.
 * - Centers content with a max-width
 * - Provides responsive horizontal padding using CSS clamp
 * - Prevents horizontal overflow
 */
export function PageContainer({
  children,
  className,
  noPadding = false,
  fullWidth = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'w-full min-w-0',
        !fullWidth && 'mx-auto max-w-[var(--page-max-width)]',
        !noPadding && 'px-[var(--page-padding-x)]',
        className
      )}
    >
      {children}
    </div>
  );
}
