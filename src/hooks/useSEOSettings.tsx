import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { defaultSEOSettings, SEOSettings, SEO_SETTINGS_UPDATED_EVENT } from '@/lib/seoSettings';

// Re-export types and defaults for convenience
export { defaultSEOSettings, SEO_SETTINGS_UPDATED_EVENT };
export type { SEOSettings };

export function useSEOSettings() {
  const [settings, setSettings] = useState<SEOSettings>(defaultSEOSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings from database
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.rpc('get_app_setting', {
        p_setting_key: 'seo_settings'
      });

      if (error) throw error;

      if (data && typeof data === 'object') {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Error fetching SEO settings:', err);
      setError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save settings to database
  const saveSettings = useCallback(async (newSettings: Partial<SEOSettings>, userId: string) => {
    try {
      setIsSaving(true);
      setError(null);

      const mergedSettings = { ...settings, ...newSettings };

      const { data, error } = await supabase.rpc('update_app_setting', {
        p_user_id: userId,
        p_setting_key: 'seo_settings',
        p_setting_value: mergedSettings
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to save settings');
      }

      setSettings(mergedSettings);
      
      // Dispatch event to notify all components that settings have changed
      window.dispatchEvent(new CustomEvent(SEO_SETTINGS_UPDATED_EVENT));
      
      return { success: true };
    } catch (err: any) {
      console.error('Error saving SEO settings:', err);
      setError(err.message || 'Failed to save settings');
      return { success: false, error: err.message };
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  // Update a single setting locally
  const updateSetting = useCallback((key: keyof SEOSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setSettings(defaultSEOSettings);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    isSaving,
    error,
    saveSettings,
    updateSetting,
    resetToDefaults,
    refetch: fetchSettings
  };
}
