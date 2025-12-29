import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { useAuth } from '@/hooks/useAuth';
import { useSEOSettings, SEOSettings } from '@/hooks/useSEOSettings';
import { defaultSEOSettings } from '@/lib/seoSettings';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  ArrowLeft,
  Zap,
  Image,
  Link2,
  Type,
  Network,
  Save,
  RotateCcw,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronRight,
  Globe,
  Server,
  FileImage,
  Layers,
  Settings2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// SEO Folder configuration types
interface SEOConfigSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  fields: SEOField[];
}

interface SEOField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'toggle' | 'select' | 'url';
  placeholder?: string;
  description?: string;
  options?: { value: string; label: string }[];
  defaultValue?: string | boolean | number;
}

// Configuration sections based on high priority SEO folders
const seoConfigSections: Record<string, SEOConfigSection> = {
  'page-speed': {
    id: 'page-speed',
    title: 'Page Speed Optimization',
    description: 'Configure Core Web Vitals and loading performance settings',
    icon: Zap,
    fields: [
      { id: 'enable_lazy_loading', label: 'Enable Lazy Loading', type: 'toggle', description: 'Defer loading of images and iframes', defaultValue: true },
      { id: 'enable_preloading', label: 'Enable Resource Preloading', type: 'toggle', description: 'Preload critical resources', defaultValue: false },
      { id: 'enable_prefetch', label: 'Enable Link Prefetch', type: 'toggle', description: 'Prefetch likely next pages', defaultValue: false },
      { id: 'critical_css_inline', label: 'Inline Critical CSS', type: 'toggle', description: 'Inline above-the-fold CSS for faster render', defaultValue: false },
      { id: 'defer_js', label: 'Defer JavaScript', type: 'toggle', description: 'Defer non-critical JavaScript loading', defaultValue: true },
      { id: 'async_js', label: 'Async JavaScript', type: 'toggle', description: 'Load scripts asynchronously', defaultValue: false },
      { id: 'minify_html', label: 'Minify HTML', type: 'toggle', description: 'Remove unnecessary whitespace from HTML', defaultValue: true },
      { id: 'minify_css', label: 'Minify CSS', type: 'toggle', description: 'Compress CSS files', defaultValue: true },
      { id: 'minify_js', label: 'Minify JavaScript', type: 'toggle', description: 'Compress JavaScript files', defaultValue: true },
      { id: 'lcp_target', label: 'LCP Target (seconds)', type: 'number', placeholder: '2.5', description: 'Target for Largest Contentful Paint', defaultValue: '2.5' },
      { id: 'cls_target', label: 'CLS Target', type: 'number', placeholder: '0.1', description: 'Target for Cumulative Layout Shift', defaultValue: '0.1' },
      { id: 'fid_target', label: 'FID Target (ms)', type: 'number', placeholder: '100', description: 'Target for First Input Delay', defaultValue: '100' },
      { id: 'font_display', label: 'Font Display Strategy', type: 'select', description: 'How fonts should render', options: [
        { value: 'swap', label: 'Swap (Recommended)' },
        { value: 'block', label: 'Block' },
        { value: 'fallback', label: 'Fallback' },
        { value: 'optional', label: 'Optional' },
        { value: 'auto', label: 'Auto' }
      ], defaultValue: 'swap' },
      { id: 'third_party_delay', label: 'Third-party Script Delay (ms)', type: 'number', placeholder: '3000', description: 'Delay third-party scripts after page load', defaultValue: '3000' }
    ]
  },
  'image-cdn': {
    id: 'image-cdn',
    title: 'Image CDN & Optimization',
    description: 'Configure image compression, lazy loading, and CDN settings',
    icon: Image,
    fields: [
      { id: 'enable_image_cdn', label: 'Enable Image CDN', type: 'toggle', description: 'Serve images through CDN', defaultValue: false },
      { id: 'cdn_provider', label: 'CDN Provider', type: 'select', description: 'Select your CDN provider', options: [
        { value: 'cloudflare', label: 'Cloudflare' },
        { value: 'cloudinary', label: 'Cloudinary' },
        { value: 'imgix', label: 'Imgix' },
        { value: 'bunny', label: 'Bunny CDN' },
        { value: 'fastly', label: 'Fastly' },
        { value: 'keycdn', label: 'KeyCDN' },
        { value: 'custom', label: 'Custom CDN' }
      ], defaultValue: 'cloudflare' },
      { id: 'cdn_url', label: 'CDN Base URL', type: 'url', placeholder: 'https://cdn.yourdomain.com', description: 'Base URL for your CDN' },
      { id: 'cdn_api_key', label: 'CDN API Key', type: 'text', placeholder: 'Enter your CDN API key', description: 'API key for CDN operations' },
      { id: 'enable_webp', label: 'Auto-convert to WebP', type: 'toggle', description: 'Automatically convert images to WebP format', defaultValue: true },
      { id: 'enable_avif', label: 'Auto-convert to AVIF', type: 'toggle', description: 'Automatically convert images to AVIF format', defaultValue: false },
      { id: 'compression_quality', label: 'Compression Quality', type: 'select', description: 'Image compression level', options: [
        { value: '90', label: 'High Quality (90%)' },
        { value: '80', label: 'Balanced (80%)' },
        { value: '70', label: 'Optimized (70%)' },
        { value: '60', label: 'Aggressive (60%)' }
      ], defaultValue: '80' },
      { id: 'enable_responsive', label: 'Enable Responsive Images', type: 'toggle', description: 'Generate srcset for different screen sizes', defaultValue: true },
      { id: 'responsive_sizes', label: 'Responsive Breakpoints', type: 'text', placeholder: '320,640,768,1024,1280,1920', description: 'Comma-separated pixel widths' },
      { id: 'lazy_loading_threshold', label: 'Lazy Loading Threshold', type: 'text', placeholder: '200px', description: 'Distance from viewport to start loading' },
      { id: 'placeholder_type', label: 'Placeholder Type', type: 'select', description: 'Placeholder while image loads', options: [
        { value: 'blur', label: 'Blur Placeholder' },
        { value: 'color', label: 'Dominant Color' },
        { value: 'skeleton', label: 'Skeleton' },
        { value: 'none', label: 'None' }
      ], defaultValue: 'blur' },
      { id: 'enable_progressive_jpeg', label: 'Progressive JPEG', type: 'toggle', description: 'Enable progressive loading for JPEGs', defaultValue: true },
      { id: 'enable_svg_optimization', label: 'SVG Optimization', type: 'toggle', description: 'Minify and optimize SVG files', defaultValue: true },
      { id: 'max_image_width', label: 'Max Image Width (px)', type: 'number', placeholder: '1920', description: 'Maximum width for uploaded images', defaultValue: '1920' },
      { id: 'max_image_size', label: 'Max Image Size (KB)', type: 'number', placeholder: '500', description: 'Maximum file size after compression', defaultValue: '500' }
    ]
  },
  'canonical-urls': {
    id: 'canonical-urls',
    title: 'Canonical URLs',
    description: 'Prevent duplicate content issues with proper canonical configuration',
    icon: Link2,
    fields: [
      { id: 'enable_auto_canonical', label: 'Auto-generate Canonical URLs', type: 'toggle', description: 'Automatically add self-referencing canonicals', defaultValue: true },
      { id: 'canonical_domain', label: 'Canonical Domain', type: 'url', placeholder: 'https://yourdomain.com', description: 'Primary domain for canonical URLs' },
      { id: 'prefer_www', label: 'Prefer WWW Version', type: 'toggle', description: 'Use www.domain.com as canonical', defaultValue: false },
      { id: 'force_https', label: 'Force HTTPS', type: 'toggle', description: 'Always use HTTPS in canonicals', defaultValue: true },
      { id: 'trailing_slash', label: 'Trailing Slash Handling', type: 'select', description: 'How to handle trailing slashes', options: [
        { value: 'add', label: 'Always Add Trailing Slash' },
        { value: 'remove', label: 'Always Remove Trailing Slash' },
        { value: 'preserve', label: 'Preserve Original' }
      ], defaultValue: 'remove' },
      { id: 'lowercase_urls', label: 'Force Lowercase URLs', type: 'toggle', description: 'Convert all URLs to lowercase', defaultValue: true },
      { id: 'remove_query_params', label: 'Remove Query Parameters', type: 'toggle', description: 'Strip query strings from canonicals', defaultValue: false },
      { id: 'allowed_query_params', label: 'Allowed Query Parameters', type: 'text', placeholder: 'page,sort', description: 'Comma-separated params to keep in canonicals' },
      { id: 'pagination_handling', label: 'Pagination Canonical', type: 'select', description: 'How to handle paginated content', options: [
        { value: 'page', label: 'Each Page Self-references' },
        { value: 'first', label: 'All Point to First Page' },
        { value: 'view-all', label: 'Point to View-All Page' }
      ], defaultValue: 'page' },
      { id: 'cross_domain_canonical', label: 'Allow Cross-domain Canonicals', type: 'toggle', description: 'Allow canonicals to different domains', defaultValue: false }
    ]
  },
  'heading-structure': {
    id: 'heading-structure',
    title: 'Heading Structure (H1-H6)',
    description: 'Configure proper heading hierarchy for SEO',
    icon: Type,
    fields: [
      { id: 'enforce_single_h1', label: 'Enforce Single H1', type: 'toggle', description: 'Ensure only one H1 per page', defaultValue: true },
      { id: 'auto_h1_from_title', label: 'Auto H1 from Page Title', type: 'toggle', description: 'Generate H1 from meta title if missing', defaultValue: false },
      { id: 'h1_max_length', label: 'H1 Max Length', type: 'number', placeholder: '70', description: 'Maximum characters for H1 tag', defaultValue: '70' },
      { id: 'h2_max_length', label: 'H2 Max Length', type: 'number', placeholder: '60', description: 'Maximum characters for H2 tags', defaultValue: '60' },
      { id: 'enforce_hierarchy', label: 'Enforce Heading Hierarchy', type: 'toggle', description: 'Ensure H2 comes before H3, etc.', defaultValue: true },
      { id: 'heading_keyword_check', label: 'Check Keywords in Headings', type: 'toggle', description: 'Verify target keywords in headings', defaultValue: true },
      { id: 'primary_keyword', label: 'Primary Keyword', type: 'text', placeholder: 'Enter primary keyword', description: 'Main keyword to check in headings' },
      { id: 'secondary_keywords', label: 'Secondary Keywords', type: 'textarea', placeholder: 'Enter secondary keywords, one per line', description: 'Additional keywords to track' },
      { id: 'heading_style', label: 'Heading Style Check', type: 'select', description: 'Heading formatting preference', options: [
        { value: 'title-case', label: 'Title Case' },
        { value: 'sentence-case', label: 'Sentence Case' },
        { value: 'lowercase', label: 'Lowercase' },
        { value: 'none', label: 'No Preference' }
      ], defaultValue: 'title-case' }
    ]
  },
  'internal-linking': {
    id: 'internal-linking',
    title: 'Internal Linking',
    description: 'Configure site structure and link flow optimization',
    icon: Network,
    fields: [
      { id: 'enable_breadcrumbs', label: 'Enable Breadcrumbs', type: 'toggle', description: 'Show breadcrumb navigation', defaultValue: true },
      { id: 'breadcrumb_separator', label: 'Breadcrumb Separator', type: 'text', placeholder: '/', description: 'Character between breadcrumb items', defaultValue: '/' },
      { id: 'breadcrumb_home_text', label: 'Breadcrumb Home Text', type: 'text', placeholder: 'Home', description: 'Text for home link in breadcrumbs', defaultValue: 'Home' },
      { id: 'enable_related_content', label: 'Enable Related Content', type: 'toggle', description: 'Show related content links', defaultValue: true },
      { id: 'related_count', label: 'Related Content Count', type: 'number', placeholder: '5', description: 'Number of related items to show', defaultValue: '5' },
      { id: 'enable_footer_links', label: 'Enable Footer Links', type: 'toggle', description: 'Add important links in footer', defaultValue: true },
      { id: 'max_link_depth', label: 'Max Click Depth', type: 'number', placeholder: '3', description: 'Maximum clicks from homepage', defaultValue: '3' },
      { id: 'anchor_text_variation', label: 'Anchor Text Variation', type: 'toggle', description: 'Vary anchor text for same links', defaultValue: true },
      { id: 'nofollow_external', label: 'Nofollow External Links', type: 'toggle', description: 'Add nofollow to external links', defaultValue: false },
      { id: 'open_external_new_tab', label: 'External Links in New Tab', type: 'toggle', description: 'Open external links in new tab', defaultValue: true },
      { id: 'orphan_page_detection', label: 'Orphan Page Detection', type: 'toggle', description: 'Alert for pages with no internal links', defaultValue: true },
      { id: 'link_audit_interval', label: 'Link Audit Interval', type: 'select', description: 'How often to check for broken links', options: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'manual', label: 'Manual Only' }
      ], defaultValue: 'weekly' }
    ]
  }
};

// Priority icons and colors for sections
const sectionMeta: Record<string, { icon: React.ElementType; color: string }> = {
  'page-speed': { icon: Zap, color: 'text-orange-500' },
  'image-cdn': { icon: Image, color: 'text-orange-500' },
  'canonical-urls': { icon: Link2, color: 'text-orange-500' },
  'heading-structure': { icon: Type, color: 'text-orange-500' },
  'internal-linking': { icon: Network, color: 'text-orange-500' }
};

function AdminSEOConfigureContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const folderId = searchParams.get('folder') || 'page-speed';
  const { resolvedTheme } = useAdminTheme();
  const isDark = resolvedTheme === 'dark';
  const { user } = useAuth();

  // SEO settings hook
  const { settings, isLoading, isSaving, saveSettings, resetToDefaults } = useSEOSettings();

  // Local form state for tracking changes
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const currentSection = seoConfigSections[folderId] || seoConfigSections['page-speed'];
  const SectionIcon = currentSection.icon;

  // Initialize form data from settings when loaded
  useEffect(() => {
    if (!isLoading && settings) {
      setFormData(settings);
    }
  }, [isLoading, settings]);

  // Handle field changes
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    setHasChanges(true);
  };

  // Get field value
  const getFieldValue = (field: SEOField) => {
    if (formData[field.id] !== undefined) return formData[field.id];
    return field.defaultValue ?? '';
  };

  // Handle save
  const handleSave = async () => {
    if (!user?.id) {
      toast.error('Please login to save settings');
      return;
    }

    const result = await saveSettings(formData as Partial<SEOSettings>, user.id);
    
    if (result.success) {
      toast.success('SEO settings saved successfully');
      setHasChanges(false);
    } else {
      toast.error(result.error || 'Failed to save settings');
    }
  };

  // Handle reset - use defaultSEOSettings from lib, not current settings
  const handleReset = () => {
    resetToDefaults();
    setFormData(defaultSEOSettings);
    setHasChanges(true);
    toast.info('Reset to defaults - Save to apply');
  };

  // Render field based on type
  // Build-time only settings (can't be applied at runtime)
  const buildTimeOnlySettings = ['minify_html', 'minify_css', 'minify_js', 'critical_css_inline', 'defer_js', 'async_js'];
  
  // Get status badge for a toggle field
  const getToggleStatus = (fieldId: string, value: boolean) => {
    const isBuildTimeOnly = buildTimeOnlySettings.includes(fieldId);
    
    if (isBuildTimeOnly) {
      return { text: 'Build-time', color: 'text-yellow-500 bg-yellow-500/10' };
    }
    
    return value 
      ? { text: 'Active', color: 'text-green-500 bg-green-500/10' }
      : { text: 'Inactive', color: isDark ? 'text-gray-500 bg-gray-500/10' : 'text-gray-400 bg-gray-100' };
  };

  const renderField = (field: SEOField) => {
    const value = getFieldValue(field);

    switch (field.type) {
      case 'toggle':
        const status = getToggleStatus(field.id, value as boolean);
        const isBuildTimeOnly = buildTimeOnlySettings.includes(field.id);
        
        return (
          <div key={field.id} className={cn(
            "flex items-center justify-between p-4 rounded-lg border",
            isDark ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"
          )}>
            <div className="flex-1 mr-4">
              <div className="flex items-center gap-2">
                <Label className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                  {field.label}
                </Label>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", status.color)}>
                  {status.text}
                </span>
              </div>
              <p className={cn("text-sm mt-1", isDark ? "text-gray-400" : "text-gray-500")}>
                {field.description}
                {isBuildTimeOnly && (
                  <span className="text-yellow-500 ml-1">(Vite build optimization)</span>
                )}
              </p>
            </div>
            <Switch
              checked={value as boolean}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
              {field.label}
            </Label>
            <Select
              value={value as string}
              onValueChange={(val) => handleFieldChange(field.id, val)}
            >
              <SelectTrigger className={cn(
                "h-10",
                isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              )}>
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.description && (
              <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                {field.description}
              </p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
              {field.label}
            </Label>
            <Textarea
              value={value as string}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={cn(
                "min-h-[100px]",
                isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              )}
            />
            {field.description && (
              <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                {field.description}
              </p>
            )}
          </div>
        );

      default:
        return (
          <div key={field.id} className="space-y-2">
            <Label className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
              {field.label}
            </Label>
            <Input
              type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'}
              value={value as string}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={cn(
                "h-10",
                isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              )}
            />
            {field.description && (
              <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                {field.description}
              </p>
            )}
          </div>
        );
    }
  };

  // Separate toggle fields from other fields for better layout
  const toggleFields = currentSection.fields.filter(f => f.type === 'toggle');
  const otherFields = currentSection.fields.filter(f => f.type !== 'toggle');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={cn(
        "rounded-xl border p-6",
        isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
      )}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/seo')}
              className={cn(isDark ? "hover:bg-gray-800" : "hover:bg-gray-100")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              isDark ? "bg-orange-500/20" : "bg-orange-100"
            )}>
              <SectionIcon className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={cn("text-xl font-bold", isDark ? "text-white" : "text-gray-900")}>
                  {currentSection.title}
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-500 font-medium">
                  High Priority
                </span>
              </div>
              <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                {currentSection.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges}
              className={cn(isDark ? "border-gray-700" : "")}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving || isLoading}
              className="bg-primary"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Section Navigation Tabs */}
      <div className={cn(
        "rounded-xl border p-2 flex flex-wrap gap-2",
        isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
      )}>
        {Object.values(seoConfigSections).map(section => {
          const Icon = section.icon;
          const isActive = section.id === folderId;
          return (
            <Button
              key={section.id}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate(`/admin/seo/configure?folder=${section.id}`)}
              className={cn(
                "flex items-center gap-2",
                isActive && "bg-orange-500 hover:bg-orange-600 text-white"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{section.title}</span>
            </Button>
          );
        })}
      </div>

      {/* Configuration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Toggle Settings */}
        {toggleFields.length > 0 && (
          <div className={cn(
            "rounded-xl border p-6",
            isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
          )}>
            <div className="flex items-center gap-3 mb-4">
              <Settings2 className={cn("w-5 h-5", isDark ? "text-gray-400" : "text-gray-500")} />
              <h2 className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
                Toggle Settings
              </h2>
            </div>
            <div className="space-y-3">
              {toggleFields.map(renderField)}
            </div>
          </div>
        )}

        {/* Other Settings */}
        {otherFields.length > 0 && (
          <div className={cn(
            "rounded-xl border p-6",
            isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
          )}>
            <div className="flex items-center gap-3 mb-4">
              <Layers className={cn("w-5 h-5", isDark ? "text-gray-400" : "text-gray-500")} />
              <h2 className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
                Configuration
              </h2>
            </div>
            <div className="space-y-4">
              {otherFields.map(renderField)}
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className={cn(
        "rounded-xl border p-4 flex items-start gap-3",
        isDark ? "bg-green-500/10 border-green-500/30" : "bg-green-50 border-green-200"
      )}>
        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className={cn("font-medium text-sm", isDark ? "text-green-400" : "text-green-700")}>
            Settings Active
          </h3>
          <p className={cn("text-sm mt-1", isDark ? "text-green-300/80" : "text-green-600")}>
            These settings are saved to the database and applied globally across all pages 
            including admin pages. Changes take effect immediately after saving.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminSEOConfigure() {
  return (
    <AdminLayout title="SEO Configuration">
      <AdminSEOConfigureContent />
    </AdminLayout>
  );
}
