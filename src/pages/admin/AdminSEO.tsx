import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { cn } from '@/lib/utils';
import { 
  Search, 
  FileText, 
  Image, 
  Globe, 
  Link2, 
  Share2, 
  Code, 
  Zap, 
  Shield, 
  Map, 
  BarChart3, 
  Settings, 
  ChevronRight,
  FileCode,
  Database,
  Smartphone,
  Languages,
  Bot,
  Network,
  Clock,
  ExternalLink,
  Tag,
  Hash,
  Type,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SEOFolder {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: 'configured' | 'partial' | 'not-configured';
  items: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
}

const seoFolders: SEOFolder[] = [
  // Critical Priority - Must have for Google ranking
  {
    id: 'meta-tags',
    title: 'Meta Tags',
    description: 'Title, description, keywords for each page',
    icon: Tag,
    status: 'not-configured',
    priority: 'critical',
    items: [
      'Page Title (50-60 chars)',
      'Meta Description (150-160 chars)',
      'Meta Keywords',
      'Canonical URL',
      'Meta Robots (index/noindex)',
      'Author Meta',
      'Copyright Meta',
      'Language Meta',
      'Viewport Meta',
      'Content-Type Meta'
    ]
  },
  {
    id: 'open-graph',
    title: 'Open Graph (Facebook)',
    description: 'Social media sharing optimization for Facebook',
    icon: Share2,
    status: 'not-configured',
    priority: 'critical',
    items: [
      'og:title',
      'og:description',
      'og:image',
      'og:image:width',
      'og:image:height',
      'og:image:alt',
      'og:url',
      'og:type',
      'og:site_name',
      'og:locale',
      'og:locale:alternate',
      'fb:app_id'
    ]
  },
  {
    id: 'twitter-cards',
    title: 'Twitter Cards',
    description: 'Twitter/X social media optimization',
    icon: Hash,
    status: 'not-configured',
    priority: 'critical',
    items: [
      'twitter:card',
      'twitter:site',
      'twitter:creator',
      'twitter:title',
      'twitter:description',
      'twitter:image',
      'twitter:image:alt',
      'twitter:player',
      'twitter:player:width',
      'twitter:player:height'
    ]
  },
  {
    id: 'sitemap',
    title: 'XML Sitemap',
    description: 'Help search engines discover all pages',
    icon: Map,
    status: 'not-configured',
    priority: 'critical',
    items: [
      'Sitemap Generation',
      'Sitemap URL Configuration',
      'Change Frequency Settings',
      'Priority Settings',
      'Last Modified Dates',
      'Image Sitemap',
      'Video Sitemap',
      'News Sitemap',
      'Sitemap Index (for large sites)',
      'Auto-submit to Google'
    ]
  },
  {
    id: 'robots-txt',
    title: 'Robots.txt',
    description: 'Control search engine crawling behavior',
    icon: Bot,
    status: 'not-configured',
    priority: 'critical',
    items: [
      'User-agent Rules',
      'Allow/Disallow Paths',
      'Crawl-delay',
      'Sitemap Reference',
      'Host Directive',
      'Clean-param Rules',
      'Block Bad Bots',
      'Allow Good Bots'
    ]
  },
  {
    id: 'structured-data',
    title: 'Structured Data (Schema.org)',
    description: 'Rich snippets for better search visibility',
    icon: Code,
    status: 'not-configured',
    priority: 'critical',
    items: [
      'Organization Schema',
      'Website Schema',
      'WebPage Schema',
      'BreadcrumbList Schema',
      'LocalBusiness Schema',
      'Product Schema',
      'FAQ Schema',
      'HowTo Schema',
      'Article Schema',
      'Review Schema',
      'Rating Schema',
      'Event Schema',
      'Person Schema',
      'Service Schema',
      'SoftwareApplication Schema'
    ]
  },
  
  // High Priority
  {
    id: 'page-speed',
    title: 'Page Speed Optimization',
    description: 'Core Web Vitals and loading performance',
    icon: Zap,
    status: 'not-configured',
    priority: 'high',
    items: [
      'Largest Contentful Paint (LCP)',
      'First Input Delay (FID)',
      'Cumulative Layout Shift (CLS)',
      'Time to First Byte (TTFB)',
      'First Contentful Paint (FCP)',
      'Interaction to Next Paint (INP)',
      'Resource Hints (preload, prefetch)',
      'Critical CSS Inlining',
      'JavaScript Defer/Async',
      'Font Loading Optimization',
      'Third-party Script Management'
    ]
  },
  {
    id: 'image-cdn',
    title: 'Image CDN & Optimization',
    description: 'Image compression, lazy loading, and CDN',
    icon: Image,
    status: 'not-configured',
    priority: 'high',
    items: [
      'CDN Provider Configuration',
      'Image Compression Level',
      'WebP/AVIF Auto-conversion',
      'Lazy Loading Settings',
      'Responsive Images (srcset)',
      'Image Alt Text Audit',
      'Image Title Attributes',
      'Image File Naming',
      'Image Dimensions',
      'Placeholder Images',
      'Progressive JPEG',
      'SVG Optimization',
      'Favicon Configuration',
      'Apple Touch Icons',
      'Microsoft Tiles'
    ]
  },
  {
    id: 'canonical-urls',
    title: 'Canonical URLs',
    description: 'Prevent duplicate content issues',
    icon: Link2,
    status: 'not-configured',
    priority: 'high',
    items: [
      'Self-referencing Canonicals',
      'Cross-domain Canonicals',
      'Trailing Slash Handling',
      'WWW vs Non-WWW',
      'HTTP vs HTTPS',
      'URL Parameter Handling',
      'Pagination Canonicals',
      'Mobile Canonical Tags'
    ]
  },
  {
    id: 'heading-structure',
    title: 'Heading Structure (H1-H6)',
    description: 'Proper heading hierarchy for SEO',
    icon: Type,
    status: 'not-configured',
    priority: 'high',
    items: [
      'H1 Tag (One per page)',
      'H2 Subheadings',
      'H3-H6 Hierarchy',
      'Keyword Placement in Headings',
      'Heading Length Optimization',
      'Heading Accessibility'
    ]
  },
  {
    id: 'internal-linking',
    title: 'Internal Linking',
    description: 'Site structure and link flow',
    icon: Network,
    status: 'not-configured',
    priority: 'high',
    items: [
      'Breadcrumb Navigation',
      'Related Content Links',
      'Footer Links',
      'Sidebar Links',
      'Anchor Text Optimization',
      'Link Depth Analysis',
      'Orphan Page Detection',
      'Link Equity Distribution',
      'Navigation Structure'
    ]
  },
  
  // Medium Priority
  {
    id: 'mobile-seo',
    title: 'Mobile SEO',
    description: 'Mobile-first indexing optimization',
    icon: Smartphone,
    status: 'not-configured',
    priority: 'medium',
    items: [
      'Responsive Design Check',
      'Mobile Viewport Configuration',
      'Touch-friendly Elements',
      'Mobile Page Speed',
      'AMP Configuration',
      'Mobile Usability',
      'Font Size Accessibility',
      'Tap Target Spacing',
      'Mobile Interstitials'
    ]
  },
  {
    id: 'ssl-security',
    title: 'SSL & Security',
    description: 'HTTPS and security headers',
    icon: Shield,
    status: 'not-configured',
    priority: 'medium',
    items: [
      'SSL Certificate Status',
      'HTTPS Redirect',
      'Mixed Content Check',
      'HSTS Header',
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'X-XSS-Protection',
      'Referrer-Policy',
      'Permissions-Policy'
    ]
  },
  {
    id: 'international-seo',
    title: 'International SEO (hreflang)',
    description: 'Multi-language and regional targeting',
    icon: Languages,
    status: 'not-configured',
    priority: 'medium',
    items: [
      'hreflang Tags',
      'Language Targeting',
      'Regional Targeting',
      'x-default Configuration',
      'Content Translation',
      'Currency/Date Formatting',
      'Local Phone Numbers',
      'Local Address Format',
      'Country-specific Domains'
    ]
  },
  {
    id: 'url-structure',
    title: 'URL Structure',
    description: 'Clean, SEO-friendly URLs',
    icon: Globe,
    status: 'not-configured',
    priority: 'medium',
    items: [
      'URL Length (under 75 chars)',
      'Keyword in URL',
      'Hyphen Separators',
      'Lowercase URLs',
      'No Special Characters',
      'No Session IDs',
      'Folder Structure',
      'URL Redirects (301/302)',
      'Broken Link Detection'
    ]
  },
  {
    id: 'content-optimization',
    title: 'Content Optimization',
    description: 'On-page content SEO',
    icon: FileText,
    status: 'not-configured',
    priority: 'medium',
    items: [
      'Keyword Density',
      'Content Length Guidelines',
      'Readability Score',
      'Unique Content Check',
      'Content Freshness',
      'LSI Keywords',
      'Featured Snippet Optimization',
      'Content Gap Analysis',
      'E-E-A-T Signals'
    ]
  },
  
  // Low Priority (Nice to have)
  {
    id: 'analytics-tracking',
    title: 'Analytics & Tracking',
    description: 'Search console and analytics setup',
    icon: BarChart3,
    status: 'not-configured',
    priority: 'low',
    items: [
      'Google Search Console',
      'Google Analytics 4',
      'Bing Webmaster Tools',
      'Yandex Webmaster',
      'Conversion Tracking',
      'Event Tracking',
      'UTM Parameters',
      'Click Tracking',
      'Scroll Depth Tracking'
    ]
  },
  {
    id: 'local-seo',
    title: 'Local SEO',
    description: 'Local business optimization',
    icon: Map,
    status: 'not-configured',
    priority: 'low',
    items: [
      'Google Business Profile',
      'NAP Consistency',
      'Local Citations',
      'Local Schema Markup',
      'Reviews Management',
      'Local Keywords',
      'Service Area Pages',
      'Embedded Google Maps',
      'Local Backlinks'
    ]
  },
  {
    id: 'technical-seo',
    title: 'Technical SEO',
    description: 'Advanced technical configurations',
    icon: Settings,
    status: 'not-configured',
    priority: 'low',
    items: [
      'Server Response Codes',
      'XML/HTML Sitemaps',
      'Log File Analysis',
      'Crawl Budget',
      'Indexation Status',
      'JavaScript Rendering',
      'Dynamic Rendering',
      'Soft 404 Detection',
      'Redirect Chains',
      'Pagination (rel=prev/next)',
      'Infinite Scroll Handling'
    ]
  },
  {
    id: 'social-profiles',
    title: 'Social Media Profiles',
    description: 'Social signals and profiles',
    icon: ExternalLink,
    status: 'not-configured',
    priority: 'low',
    items: [
      'Facebook Page URL',
      'Twitter/X Profile',
      'Instagram Profile',
      'LinkedIn Profile',
      'YouTube Channel',
      'Pinterest Profile',
      'TikTok Profile',
      'WhatsApp Business',
      'Telegram Channel'
    ]
  },
  {
    id: 'pwa-settings',
    title: 'PWA & Web App',
    description: 'Progressive Web App SEO',
    icon: FileCode,
    status: 'not-configured',
    priority: 'low',
    items: [
      'Web App Manifest',
      'Theme Color',
      'Background Color',
      'App Name/Short Name',
      'App Icons (all sizes)',
      'Display Mode',
      'Orientation',
      'Start URL',
      'Scope',
      'Service Worker'
    ]
  },
  {
    id: 'crawl-settings',
    title: 'Crawl Settings',
    description: 'Search engine crawl control',
    icon: Clock,
    status: 'not-configured',
    priority: 'low',
    items: [
      'Crawl Rate Limiting',
      'Crawl Budget Optimization',
      'Priority Pages',
      'Nofollow Links',
      'Noindex Pages',
      'Blocked Resources',
      'Parameter Handling',
      'Fresh Content Signals'
    ]
  }
];

const priorityColors = {
  critical: { bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500/30' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-500', border: 'border-orange-500/30' },
  medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-500', border: 'border-yellow-500/30' },
  low: { bg: 'bg-blue-500/20', text: 'text-blue-500', border: 'border-blue-500/30' }
};

const statusIcons = {
  'configured': { icon: CheckCircle2, color: 'text-green-500' },
  'partial': { icon: AlertTriangle, color: 'text-yellow-500' },
  'not-configured': { icon: XCircle, color: 'text-red-500' }
};

function AdminSEOContent() {
  const navigate = useNavigate();
  const { resolvedTheme } = useAdminTheme();
  const isDark = resolvedTheme === 'dark';
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const groupedFolders = {
    critical: seoFolders.filter(f => f.priority === 'critical'),
    high: seoFolders.filter(f => f.priority === 'high'),
    medium: seoFolders.filter(f => f.priority === 'medium'),
    low: seoFolders.filter(f => f.priority === 'low')
  };

  const renderFolderCard = (folder: SEOFolder) => {
    const Icon = folder.icon;
    const StatusIcon = statusIcons[folder.status].icon;
    const priorityStyle = priorityColors[folder.priority];

    // Check if this folder has a configure page (high priority folders)
    const hasConfigPage = ['page-speed', 'image-cdn', 'canonical-urls', 'heading-structure', 'internal-linking'].includes(folder.id);

    const handleClick = () => {
      if (hasConfigPage) {
        navigate(`/admin/seo/configure?folder=${folder.id}`);
      } else {
        setSelectedFolder(selectedFolder === folder.id ? null : folder.id);
      }
    };

    return (
      <div
        key={folder.id}
        onClick={handleClick}
        className={cn(
          "rounded-xl border p-4 cursor-pointer transition-all duration-200",
          isDark 
            ? "bg-gray-900 border-gray-700 hover:border-gray-600" 
            : "bg-white border-gray-200 hover:border-gray-300",
          selectedFolder === folder.id && (isDark ? "ring-2 ring-primary" : "ring-2 ring-primary")
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            isDark ? "bg-gray-800" : "bg-gray-100"
          )}>
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              priorityStyle.bg, priorityStyle.text
            )}>
              {folder.priority}
            </span>
            <StatusIcon className={cn("w-5 h-5", statusIcons[folder.status].color)} />
          </div>
        </div>
        
        <h3 className={cn("font-semibold mb-1", isDark ? "text-white" : "text-gray-900")}>
          {folder.title}
        </h3>
        <p className={cn("text-sm mb-3", isDark ? "text-gray-400" : "text-gray-500")}>
          {folder.description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
            {folder.items.length} items
          </span>
          <ChevronRight className={cn(
            "w-4 h-4 transition-transform",
            isDark ? "text-gray-500" : "text-gray-400",
            selectedFolder === folder.id && "rotate-90"
          )} />
        </div>

        {/* Expanded Items List - Only for non-configurable folders */}
        {!hasConfigPage && selectedFolder === folder.id && (
          <div className={cn(
            "mt-4 pt-4 border-t",
            isDark ? "border-gray-700" : "border-gray-200"
          )}>
            <ul className="space-y-2">
              {folder.items.map((item, idx) => (
                <li 
                  key={idx}
                  className={cn(
                    "text-sm flex items-center gap-2 py-1 px-2 rounded",
                    isDark ? "text-gray-300 bg-gray-800/50" : "text-gray-600 bg-gray-50"
                  )}
                >
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isDark ? "bg-gray-500" : "bg-gray-400"
                  )} />
                  {item}
                </li>
              ))}
            </ul>
            <Button 
              className="w-full mt-4"
              variant="outline"
              disabled
            >
              Configure (Coming Soon)
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderSection = (title: string, description: string, folders: SEOFolder[], priority: keyof typeof priorityColors) => {
    const style = priorityColors[priority];
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className={cn(
            "text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider",
            style.bg, style.text, style.border, "border"
          )}>
            {priority} Priority
          </span>
          <div>
            <h2 className={cn("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>
              {title}
            </h2>
            <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
              {description}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map(renderFolderCard)}
        </div>
      </div>
    );
  };

  // Stats
  const totalItems = seoFolders.reduce((acc, f) => acc + f.items.length, 0);
  const configuredCount = seoFolders.filter(f => f.status === 'configured').length;
  const partialCount = seoFolders.filter(f => f.status === 'partial').length;

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className={cn(
        "rounded-xl border p-6",
        isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
      )}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className={cn("text-2xl font-bold flex items-center gap-3", isDark ? "text-white" : "text-gray-900")}>
              <Search className="w-7 h-7 text-primary" />
              SEO Configuration
            </h1>
            <p className={cn("text-sm mt-1", isDark ? "text-gray-400" : "text-gray-500")}>
              Configure all SEO settings to rank your website on Google
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className={cn("px-4 py-2 rounded-lg", isDark ? "bg-gray-800" : "bg-gray-100")}>
              <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Total Folders</p>
              <p className={cn("text-xl font-bold", isDark ? "text-white" : "text-gray-900")}>{seoFolders.length}</p>
            </div>
            <div className={cn("px-4 py-2 rounded-lg", isDark ? "bg-gray-800" : "bg-gray-100")}>
              <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Total Items</p>
              <p className={cn("text-xl font-bold", isDark ? "text-white" : "text-gray-900")}>{totalItems}</p>
            </div>
            <div className={cn("px-4 py-2 rounded-lg bg-green-500/20")}>
              <p className="text-xs text-green-500">Configured</p>
              <p className="text-xl font-bold text-green-500">{configuredCount}/{seoFolders.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Priority */}
      {renderSection(
        'Must Have for Ranking',
        'These are mandatory for Google to properly index and rank your site',
        groupedFolders.critical,
        'critical'
      )}

      {/* High Priority */}
      {renderSection(
        'High Impact SEO',
        'Significantly improves search rankings and user experience',
        groupedFolders.high,
        'high'
      )}

      {/* Medium Priority */}
      {renderSection(
        'Important Optimizations',
        'Enhances SEO performance and covers edge cases',
        groupedFolders.medium,
        'medium'
      )}

      {/* Low Priority */}
      {renderSection(
        'Nice to Have',
        'Additional optimizations for comprehensive SEO coverage',
        groupedFolders.low,
        'low'
      )}
    </div>
  );
}

export default function AdminSEO() {
  return (
    <AdminLayout title="SEO">
      <AdminSEOContent />
    </AdminLayout>
  );
}
