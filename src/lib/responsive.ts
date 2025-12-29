/**
 * Shared Responsive Utility Classes
 * 
 * This file contains common responsive class patterns used across the app.
 * Import these constants to ensure consistency across all pages.
 * 
 * Breakpoints:
 * - Base: < 360px (ultra-small)
 * - xs: 360px+ (small mobile)
 * - sm: 640px+ (large mobile / small tablet)
 * - md: 768px+ (tablet)
 * - lg: 1024px+ (desktop)
 * - xl: 1280px+ (large desktop)
 */

// ============================================
// TEXT SIZES
// ============================================

export const text = {
  /** Page titles: 18px → 20px → 24px → 30px */
  pageTitle: "text-lg xs:text-xl sm:text-2xl md:text-3xl",
  
  /** Section headers: 16px → 18px → 20px */
  sectionTitle: "text-base xs:text-lg sm:text-xl",
  
  /** Card titles: 14px → 16px → 18px */
  cardTitle: "text-sm xs:text-base sm:text-lg",
  
  /** Body text: 12px → 14px → 16px */
  body: "text-xs xs:text-sm sm:text-base",
  
  /** Small text: 10px → 11px → 12px → 14px */
  small: "text-[10px] xs:text-[11px] sm:text-xs md:text-sm",
  
  /** Extra small (labels, badges): 9px → 10px → 12px */
  xs: "text-[9px] xs:text-[10px] sm:text-xs",
  
  /** Muted subtitles: 10px → 12px → 14px */
  muted: "text-[10px] xs:text-xs sm:text-sm text-muted-foreground",
} as const;

// ============================================
// SPACING (Padding & Margin)
// ============================================

export const spacing = {
  /** Page/section padding: 12px → 16px → 20px → 24px */
  page: "p-3 xs:p-4 sm:p-5 md:p-6",
  pageX: "px-3 xs:px-4 sm:px-5 md:px-6",
  pageY: "py-3 xs:py-4 sm:py-5 md:py-6",
  
  /** Card padding: 10px → 12px → 16px → 20px */
  card: "p-2.5 xs:p-3 sm:p-4 md:p-5",
  cardX: "px-2.5 xs:px-3 sm:px-4 md:px-5",
  cardY: "py-2.5 xs:py-3 sm:py-4 md:py-5",
  
  /** Compact element padding: 8px → 10px → 12px */
  compact: "p-2 xs:p-2.5 sm:p-3",
  compactX: "px-2 xs:px-2.5 sm:px-3",
  compactY: "py-2 xs:py-2.5 sm:py-3",
  
  /** Section margin bottom: 16px → 20px → 24px → 32px */
  sectionMb: "mb-4 xs:mb-5 sm:mb-6 md:mb-8",
} as const;

// ============================================
// GAP (Flex & Grid)
// ============================================

export const gap = {
  /** Standard gap: 8px → 10px → 12px → 16px */
  standard: "gap-2 xs:gap-2.5 sm:gap-3 md:gap-4",
  
  /** Small gap: 6px → 8px → 10px → 12px */
  small: "gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3",
  
  /** Large gap: 12px → 16px → 20px → 24px */
  large: "gap-3 xs:gap-4 sm:gap-5 md:gap-6",
  
  /** Tight gap: 4px → 6px → 8px */
  tight: "gap-1 xs:gap-1.5 sm:gap-2",
} as const;

// ============================================
// CONTAINER WIDTHS
// ============================================

export const container = {
  /** Full-width card that respects padding: calc(100% - spacing) */
  card: "w-full max-w-[calc(100%-0.5rem)] sm:max-w-md lg:max-w-xl",
  
  /** Wide card for content: calc(100% - spacing) */
  cardWide: "w-full max-w-[calc(100%-0.5rem)] sm:max-w-lg lg:max-w-2xl",
  
  /** Narrow card for forms: */
  cardNarrow: "w-full max-w-[calc(100%-0.5rem)] sm:max-w-sm lg:max-w-md",
  
  /** Content max width */
  content: "max-w-5xl mx-auto",
} as const;

// ============================================
// ICON SIZES
// ============================================

export const icon = {
  /** Small icons: 14px → 16px → 18px → 20px */
  sm: "w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-[18px] sm:h-[18px] md:w-5 md:h-5",
  
  /** Medium icons: 16px → 20px → 24px */
  md: "w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6",
  
  /** Large icons: 24px → 28px → 32px → 40px */
  lg: "w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 md:w-10 md:h-10",
  
  /** Avatar/thumbnail: 28px → 32px → 40px */
  avatar: "w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10",
} as const;

// ============================================
// BUTTON SIZES
// ============================================

export const button = {
  /** Standard button height: 28px → 32px → 36px → 40px */
  standard: "h-7 xs:h-8 sm:h-9 md:h-10",
  
  /** Small button: 24px → 28px → 32px */
  small: "h-6 xs:h-7 sm:h-8",
  
  /** Large button: 36px → 40px → 44px */
  large: "h-9 xs:h-10 sm:h-11",
  
  /** Touch-friendly: ensures min touch target */
  touch: "min-h-[var(--touch-target)] min-w-[var(--touch-target)]",
} as const;

// ============================================
// INPUT SIZES
// ============================================

export const input = {
  /** Standard input height: 32px → 36px → 40px → 44px */
  standard: "h-8 xs:h-9 sm:h-10 md:h-11",
  
  /** Standard input text size */
  text: "text-xs xs:text-sm sm:text-base",
  
  /** Placeholder styling */
  placeholder: "placeholder:text-[10px] xs:placeholder:text-xs sm:placeholder:text-sm",
} as const;

// ============================================
// BORDER RADIUS
// ============================================

export const rounded = {
  /** Card radius: 8px → 10px → 12px */
  card: "rounded-lg xs:rounded-xl sm:rounded-xl",
  
  /** Button radius: 6px → 8px → 10px */
  button: "rounded-md xs:rounded-lg sm:rounded-xl",
  
  /** Small radius: 4px → 6px → 8px */
  sm: "rounded xs:rounded-md sm:rounded-lg",
} as const;

// ============================================
// COMBINED PATTERNS
// ============================================

export const patterns = {
  /** Standard page header with title */
  pageHeader: {
    wrapper: "mb-4 xs:mb-5 sm:mb-6 md:mb-8",
    title: "text-lg xs:text-xl sm:text-2xl font-bold text-foreground",
    subtitle: "text-[10px] xs:text-xs sm:text-sm text-muted-foreground mt-0.5 xs:mt-1",
  },
  
  /** Card with responsive padding */
  card: {
    wrapper: "bg-card border border-border rounded-lg xs:rounded-xl shadow-sm",
    padding: "p-2.5 xs:p-3 sm:p-4 md:p-5",
  },
  
  /** List item with icon and text */
  listItem: {
    wrapper: "flex items-center gap-2 xs:gap-2.5 sm:gap-3 py-2.5 xs:py-3",
    icon: "w-8 h-8 xs:w-10 xs:h-10 rounded-lg flex-shrink-0",
    text: "text-xs xs:text-sm font-medium",
    subtext: "text-[10px] xs:text-xs text-muted-foreground",
  },
} as const;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Combine multiple responsive class strings
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Create responsive classes from a size map
 */
export function responsive(sizes: {
  base?: string;
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
}): string {
  const classes: string[] = [];
  if (sizes.base) classes.push(sizes.base);
  if (sizes.xs) classes.push(`xs:${sizes.xs}`);
  if (sizes.sm) classes.push(`sm:${sizes.sm}`);
  if (sizes.md) classes.push(`md:${sizes.md}`);
  if (sizes.lg) classes.push(`lg:${sizes.lg}`);
  if (sizes.xl) classes.push(`xl:${sizes.xl}`);
  return classes.join(" ");
}
