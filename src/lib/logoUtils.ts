// Default service icon - used when no logo is found
export const DEFAULT_SERVICE_ICON = '/service-icons/o/other.webp';

/**
 * Get logo URL using nested directory structure: /service-icons/{firstLetter}/{code}.webp
 * Falls back to DEFAULT_SERVICE_ICON if code is null/undefined
 */
export const getServiceLogoUrl = (code: string | null | undefined): string => {
  if (!code) return DEFAULT_SERVICE_ICON;
  
  const lowerCode = code.toLowerCase();
  const firstLetter = lowerCode.charAt(0);
  
  // Return the nested path: /service-icons/{firstLetter}/{code}.webp
  return `/service-icons/${firstLetter}/${lowerCode}.webp`;
};
