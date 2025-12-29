import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DEFAULT_SERVICE_ICON } from '@/lib/logoUtils';
import { useSEOSettingsContext } from '@/components/SEOSettingsProvider';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  priority?: boolean; // Load immediately without lazy loading
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  fallbackSrc?: string;
}

// Static mapping for Tailwind - prevents purging of dynamic classes in production
const objectFitClasses: Record<string, string> = {
  contain: 'object-contain',
  cover: 'object-cover',
  fill: 'object-fill',
  none: 'object-none',
  'scale-down': 'object-scale-down',
};

// CDN URL transformation functions
const transformImageUrl = (
  src: string, 
  cdnEnabled: boolean, 
  cdnUrl: string, 
  cdnProvider: string,
  enableWebp: boolean,
  quality: string
): string => {
  if (!cdnEnabled || !cdnUrl || !src) return src;
  
  // Skip if already using CDN or is external URL not matching our domain
  if (src.startsWith(cdnUrl)) return src;
  
  // Skip data URLs and SVGs
  if (src.startsWith('data:') || src.endsWith('.svg')) return src;
  
  try {
    // Build CDN URL based on provider
    switch (cdnProvider) {
      case 'cloudflare':
        // Cloudflare Images format: /cdn-cgi/image/format=auto,quality=80/original-url
        return `${cdnUrl}/cdn-cgi/image/format=${enableWebp ? 'auto' : 'preserve'},quality=${quality}/${src}`;
      
      case 'cloudinary':
        // Cloudinary format: /image/upload/f_auto,q_80/original-path
        const cloudinaryPath = src.startsWith('/') ? src : `/${src}`;
        return `${cdnUrl}/image/upload/f_${enableWebp ? 'auto' : 'preserve'},q_${quality}${cloudinaryPath}`;
      
      case 'imgix':
        // Imgix format: original-url?auto=format&q=80
        const imgixUrl = new URL(src, cdnUrl);
        if (enableWebp) imgixUrl.searchParams.set('auto', 'format');
        imgixUrl.searchParams.set('q', quality);
        return imgixUrl.toString();
      
      case 'bunny':
        // Bunny CDN format: original-url?quality=80
        const bunnyUrl = `${cdnUrl}${src.startsWith('/') ? src : `/${src}`}`;
        return `${bunnyUrl}?quality=${quality}`;
      
      default:
        // Generic CDN - just prepend the CDN URL
        return `${cdnUrl}${src.startsWith('/') ? src : `/${src}`}`;
    }
  } catch {
    return src;
  }
};

export const OptimizedImage = ({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  objectFit = 'contain',
  fallbackSrc = DEFAULT_SERVICE_ICON,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Get SEO settings from context
  const { settings, isLoaded: settingsLoaded } = useSEOSettingsContext();

  // Get lazy loading threshold from settings
  const lazyThreshold = settings.lazy_loading_threshold || '200px';
  
  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    // Parse threshold from settings (e.g., "200px" -> 200)
    const thresholdValue = parseInt(lazyThreshold) || 100;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: `${thresholdValue}px`, // Use threshold from settings
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, lazyThreshold]);

  // Transform image URL through CDN if enabled
  const getImageSrc = (): string => {
    if (hasError) return fallbackSrc;
    
    if (!settingsLoaded) return src;
    
    return transformImageUrl(
      src,
      settings.enable_image_cdn,
      settings.cdn_url,
      settings.cdn_provider,
      settings.enable_webp,
      settings.compression_quality
    );
  };

  const imageSrc = getImageSrc();

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-muted/30',
        className
      )}
      style={{ width, height }}
    >
      {/* Skeleton placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 bg-[length:200%_100%] animate-shimmer" />
      )}
      
      {/* Actual image */}
      {isInView && (
        <img
          src={imageSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            if (!hasError) {
              setHasError(true);
            }
          }}
          className={cn(
            'w-full h-full transition-opacity duration-300',
            objectFitClasses[objectFit] || 'object-contain',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </div>
  );
};
