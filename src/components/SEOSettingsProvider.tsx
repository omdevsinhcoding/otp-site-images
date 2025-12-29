import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { defaultSEOSettings, SEOSettings, SEO_SETTINGS_UPDATED_EVENT } from '@/lib/seoSettings';

interface SEOSettingsContextType {
  settings: SEOSettings;
  isLoaded: boolean;
  refetch: () => Promise<void>;
}

const SEOSettingsContext = createContext<SEOSettingsContextType>({
  settings: defaultSEOSettings,
  isLoaded: false,
  refetch: async () => {}
});

export const useSEOSettingsContext = () => useContext(SEOSettingsContext);

interface SEOSettingsProviderProps {
  children: ReactNode;
}

export function SEOSettingsProvider({ children }: SEOSettingsProviderProps) {
  const [settings, setSettings] = useState<SEOSettings>(defaultSEOSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_app_setting', {
        p_setting_key: 'seo_settings'
      });

      if (!error && data && typeof data === 'object') {
        setSettings(prev => ({ ...prev, ...(data as object) }));
      }
    } catch (err) {
      console.error('Error fetching SEO settings:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Listen for settings update events
  useEffect(() => {
    const handleSettingsUpdate = () => {
      fetchSettings();
    };

    window.addEventListener(SEO_SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
    return () => {
      window.removeEventListener(SEO_SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
    };
  }, [fetchSettings]);

  // Apply SEO settings to the document
  useEffect(() => {
    if (!isLoaded) return;

    // Apply lazy loading settings globally
    if (settings.enable_lazy_loading) {
      document.querySelectorAll('img:not([loading])').forEach(img => {
        img.setAttribute('loading', 'lazy');
      });
      document.querySelectorAll('iframe:not([loading])').forEach(iframe => {
        iframe.setAttribute('loading', 'lazy');
      });
    }

    // Apply preload settings - cleanup first, then add if enabled
    const existingPreloads = document.querySelectorAll('link[rel="preload"][data-seo], link[rel="preconnect"][data-seo]');
    existingPreloads.forEach(el => el.remove());
    
    if (settings.enable_preloading) {
      // Preconnect to common CDN origins for faster resource loading
      const preconnectOrigins = [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
      ];
      
      preconnectOrigins.forEach(origin => {
        const preconnect = document.createElement('link');
        preconnect.rel = 'preconnect';
        preconnect.href = origin;
        preconnect.setAttribute('data-seo', 'true');
        preconnect.crossOrigin = 'anonymous';
        document.head.appendChild(preconnect);
      });
    }

    // Apply prefetch settings - cleanup first, then add if enabled
    const existingPrefetches = document.querySelectorAll('link[rel="prefetch"][data-seo]');
    existingPrefetches.forEach(el => el.remove());
    
    if (settings.enable_prefetch) {
      // Add prefetch hints for likely next pages
      const links = document.querySelectorAll('a[href^="/"]');
      const prefetchedUrls = new Set<string>();
      
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !prefetchedUrls.has(href) && prefetchedUrls.size < 5) {
          prefetchedUrls.add(href);
          const prefetch = document.createElement('link');
          prefetch.rel = 'prefetch';
          prefetch.href = href;
          prefetch.setAttribute('data-seo', 'true');
          document.head.appendChild(prefetch);
        }
      });
    }

    // Apply font display strategy
    if (settings.font_display) {
      const existingFontStyle = document.getElementById('seo-font-display');
      if (existingFontStyle) existingFontStyle.remove();

      const style = document.createElement('style');
      style.id = 'seo-font-display';
      style.textContent = `
        @font-face {
          font-display: ${settings.font_display};
        }
      `;
      document.head.appendChild(style);
    }

    // Apply external link settings
    if (settings.open_external_new_tab || settings.nofollow_external) {
      document.querySelectorAll('a[href^="http"]:not([href*="' + window.location.hostname + '"])').forEach(link => {
        if (settings.open_external_new_tab) {
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', (link.getAttribute('rel') || '') + ' noopener');
        }
        if (settings.nofollow_external) {
          const currentRel = link.getAttribute('rel') || '';
          if (!currentRel.includes('nofollow')) {
            link.setAttribute('rel', currentRel + ' nofollow');
          }
        }
      });
    }

    // Apply canonical URL if enabled
    if (settings.enable_auto_canonical) {
      let existingCanonical = document.querySelector('link[rel="canonical"]');
      if (!existingCanonical) {
        existingCanonical = document.createElement('link');
        existingCanonical.setAttribute('rel', 'canonical');
        document.head.appendChild(existingCanonical);
      }

      let canonicalUrl = window.location.href;
      
      // Apply canonical URL transformations
      if (settings.force_https) {
        canonicalUrl = canonicalUrl.replace('http://', 'https://');
      }
      
      if (settings.lowercase_urls) {
        const urlObj = new URL(canonicalUrl);
        urlObj.pathname = urlObj.pathname.toLowerCase();
        canonicalUrl = urlObj.toString();
      }
      
      if (settings.trailing_slash === 'remove') {
        canonicalUrl = canonicalUrl.replace(/\/$/, '');
      } else if (settings.trailing_slash === 'add' && !canonicalUrl.endsWith('/')) {
        canonicalUrl += '/';
      }
      
      if (settings.remove_query_params) {
        const urlObj = new URL(canonicalUrl);
        const allowedParams = (settings.allowed_query_params || '').split(',').map(p => p.trim()).filter(Boolean);
        const newParams = new URLSearchParams();
        urlObj.searchParams.forEach((value, key) => {
          if (allowedParams.includes(key)) {
            newParams.set(key, value);
          }
        });
        urlObj.search = newParams.toString();
        canonicalUrl = urlObj.toString();
      }

      existingCanonical.setAttribute('href', canonicalUrl);
    }

    // Apply third-party script delay
    const thirdPartyDelay = parseInt(settings.third_party_delay || '0', 10);
    if (thirdPartyDelay > 0) {
      document.querySelectorAll('script[data-third-party="true"]').forEach(script => {
        const src = script.getAttribute('src');
        if (src) {
          script.removeAttribute('src');
          setTimeout(() => {
            script.setAttribute('src', src);
          }, thirdPartyDelay);
        }
      });
    }

    // Set performance metrics targets as data attributes on body for monitoring
    document.body.setAttribute('data-lcp-target', settings.lcp_target);
    document.body.setAttribute('data-cls-target', settings.cls_target);
    document.body.setAttribute('data-fid-target', settings.fid_target);

    // Set Image CDN settings as data attributes for OptimizedImage to consume
    document.body.setAttribute('data-image-cdn-enabled', String(settings.enable_image_cdn));
    document.body.setAttribute('data-cdn-url', settings.cdn_url || '');
    document.body.setAttribute('data-cdn-provider', settings.cdn_provider || 'cloudflare');
    document.body.setAttribute('data-enable-webp', String(settings.enable_webp));
    document.body.setAttribute('data-compression-quality', settings.compression_quality || '80');
    document.body.setAttribute('data-lazy-loading-threshold', settings.lazy_loading_threshold || '200px');

  }, [isLoaded, settings]);

  // Watch for DOM changes to apply settings to new elements
  useEffect(() => {
    if (!isLoaded) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Apply lazy loading to new images
            if (settings.enable_lazy_loading) {
              if (element.tagName === 'IMG' && !element.hasAttribute('loading')) {
                element.setAttribute('loading', 'lazy');
              }
              element.querySelectorAll('img:not([loading])').forEach(img => {
                img.setAttribute('loading', 'lazy');
              });
              element.querySelectorAll('iframe:not([loading])').forEach(iframe => {
                iframe.setAttribute('loading', 'lazy');
              });
            }

            // Apply external link settings to new links
            if (settings.open_external_new_tab || settings.nofollow_external) {
              const applyToLink = (link: Element) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('http') && !href.includes(window.location.hostname)) {
                  if (settings.open_external_new_tab) {
                    link.setAttribute('target', '_blank');
                    link.setAttribute('rel', (link.getAttribute('rel') || '') + ' noopener');
                  }
                  if (settings.nofollow_external) {
                    const currentRel = link.getAttribute('rel') || '';
                    if (!currentRel.includes('nofollow')) {
                      link.setAttribute('rel', currentRel + ' nofollow');
                    }
                  }
                }
              };

              if (element.tagName === 'A') {
                applyToLink(element);
              }
              element.querySelectorAll('a[href^="http"]').forEach(applyToLink);
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [isLoaded, settings]);

  return (
    <SEOSettingsContext.Provider value={{ settings, isLoaded, refetch: fetchSettings }}>
      {children}
    </SEOSettingsContext.Provider>
  );
}
