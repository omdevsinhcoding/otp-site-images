// SEO Settings constants and event names
export const SEO_SETTINGS_UPDATED_EVENT = 'seo-settings-updated';

// Default SEO settings
export const defaultSEOSettings = {
  // Page Speed
  enable_lazy_loading: true,
  enable_preloading: false,
  enable_prefetch: false,
  critical_css_inline: false,
  defer_js: true,
  async_js: false,
  minify_html: true,
  minify_css: true,
  minify_js: true,
  lcp_target: '2.5',
  cls_target: '0.1',
  fid_target: '100',
  font_display: 'swap',
  third_party_delay: '3000',
  
  // Image CDN
  enable_image_cdn: false,
  cdn_provider: 'cloudflare',
  cdn_url: '',
  cdn_api_key: '',
  enable_webp: true,
  enable_avif: false,
  compression_quality: '80',
  enable_responsive: true,
  responsive_sizes: '320,640,768,1024,1280,1920',
  lazy_loading_threshold: '200px',
  placeholder_type: 'blur',
  enable_progressive_jpeg: true,
  enable_svg_optimization: true,
  max_image_width: '1920',
  max_image_size: '500',
  
  // Canonical URLs
  enable_auto_canonical: true,
  canonical_domain: '',
  prefer_www: false,
  force_https: true,
  trailing_slash: 'remove',
  lowercase_urls: true,
  remove_query_params: false,
  allowed_query_params: 'page,sort',
  pagination_handling: 'page',
  cross_domain_canonical: false,
  
  // Heading Structure
  enforce_single_h1: true,
  auto_h1_from_title: false,
  h1_max_length: '70',
  h2_max_length: '60',
  enforce_hierarchy: true,
  heading_keyword_check: true,
  primary_keyword: '',
  secondary_keywords: '',
  heading_style: 'title-case',
  
  // Internal Linking
  enable_breadcrumbs: true,
  breadcrumb_separator: '/',
  breadcrumb_home_text: 'Home',
  enable_related_content: true,
  related_count: '5',
  enable_footer_links: true,
  max_link_depth: '3',
  anchor_text_variation: true,
  nofollow_external: false,
  open_external_new_tab: true,
  orphan_page_detection: true,
  link_audit_interval: 'weekly'
};

export type SEOSettings = typeof defaultSEOSettings;
