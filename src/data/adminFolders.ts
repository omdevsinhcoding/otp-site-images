import { 
  Users, Shield, Server, BarChart3, Package, Search, Palette,
  CreditCard, Bell, FileText, Settings, Clock, History,
  Tag, Globe, Star, Gift, Brush, Receipt, Plus, Upload, LayoutDashboard, Cloud,
  IndianRupee, Bitcoin, QrCode, Database, List
} from 'lucide-react';

export interface FolderItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  gradient: string;
  items?: number;
  requiredLevel: number;
}

export interface ServiceSubFolder {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  gradient: string;
}

export interface ProviderFolder {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  gradient: string;
}

// Direct Import Provider Folders
export const directImportProviders: ProviderFolder[] = [
  {
    id: '5sim',
    title: '5sim',
    description: 'Import from 5sim API',
    icon: Cloud,
    path: '/admin/services/direct-import/5sim',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'smsbower',
    title: 'Smsbower',
    description: 'Import from Smsbower API',
    icon: Cloud,
    path: '/admin/services/direct-import/smsbower',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'smshub',
    title: 'Smshub',
    description: 'Import from Smshub API',
    icon: Cloud,
    path: '/admin/services/direct-import/smshub',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'durian-cloud',
    title: 'Durian Cloud',
    description: 'Import from Durian Cloud API',
    icon: Cloud,
    path: '/admin/services/direct-import/durian-cloud',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    id: '4sim',
    title: '4sim',
    description: 'Import from 4sim API',
    icon: Cloud,
    path: '/admin/services/direct-import/4sim',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'smsactive',
    title: 'SMSActive',
    description: 'Import from SMSActive API',
    icon: Cloud,
    path: '/admin/services/direct-import/smsactive',
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    id: '368sms',
    title: '368SMS',
    description: 'Import from 368SMS API',
    icon: Cloud,
    path: '/admin/services/direct-import/368sms',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    id: 'sms-man',
    title: 'SMS-Man',
    description: 'Import from SMS-Man API',
    icon: Cloud,
    path: '/admin/services/direct-import/sms-man',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    id: 'grizzlysms',
    title: 'GrizzlySMS',
    description: 'Import from GrizzlySMS API',
    icon: Cloud,
    path: '/admin/services/direct-import/grizzlysms',
    gradient: 'from-amber-500 to-yellow-500',
  },
  {
    id: 'techy-india',
    title: 'Techy India',
    description: 'Import from Techy India API',
    icon: Cloud,
    path: '/admin/services/direct-import/techy-india',
    gradient: 'from-indigo-500 to-violet-500',
  },
  {
    id: 'alisms',
    title: 'Alisms',
    description: 'Import from Alisms API',
    icon: Cloud,
    path: '/admin/services/direct-import/alisms',
    gradient: 'from-teal-500 to-cyan-500',
  },
  {
    id: 'votpshop',
    title: 'VOTPShop',
    description: 'Import from VOTPShop API',
    icon: Cloud,
    path: '/admin/services/direct-import/votpshop',
    gradient: 'from-fuchsia-500 to-purple-500',
  },
  {
    id: 'otpworld-pro',
    title: 'OTPWorld.pro',
    description: 'Import from OTPWorld.pro API',
    icon: Cloud,
    path: '/admin/services/direct-import/otpworld-pro',
    gradient: 'from-sky-500 to-blue-500',
  },
];

// Payment Sub-Folders
export const paymentSubFolders: ServiceSubFolder[] = [
  {
    id: 'bharatpe',
    title: 'BharatPe',
    description: 'Configure BharatPe UPI settings',
    icon: QrCode,
    path: '/admin/bharatpe',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'auto-payment',
    title: 'Auto Payment',
    description: 'Configure auto payment verification',
    icon: CreditCard,
    path: '/admin/auto-payment',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'crypto',
    title: 'Crypto',
    description: 'Configure cryptocurrency payments',
    icon: Bitcoin,
    path: '/admin/payments/crypto',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    id: 'upi-manual',
    title: 'Manual UPI',
    description: 'Manual UPI verification settings',
    icon: IndianRupee,
    path: '/admin/payments/manual-upi',
    gradient: 'from-green-500 to-emerald-500',
  },
];

export const serviceSubFolders: ServiceSubFolder[] = [
  {
    id: 'direct-import',
    title: 'Direct Import',
    description: 'Import services directly',
    icon: Upload,
    path: '/admin/services/direct-import',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'add-server',
    title: 'Add Server',
    description: 'Add new SMS server',
    icon: Plus,
    path: '/admin/services/add-server',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'add-service',
    title: 'Add Service',
    description: 'Add new service',
    icon: Server,
    path: '/admin/services/add-service',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'show-all-servers',
    title: 'Show All Servers',
    description: 'View & edit all SMS servers',
    icon: Database,
    path: '/admin/services/all-servers',
    gradient: 'from-indigo-500 to-violet-500',
  },
  {
    id: 'show-all-services',
    title: 'Show All Services',
    description: 'View & manage all services',
    icon: List,
    path: '/admin/services/all-services',
    gradient: 'from-orange-500 to-amber-500',
  },
];

export const adminFolders: FolderItem[] = [
  {
    id: 'users',
    title: 'Users',
    description: 'Active Status, Edit Balance, Ban Users',
    icon: Users,
    path: '/admin/users',
    gradient: 'from-blue-500 to-cyan-500',
    items: 3,
    requiredLevel: 1,
  },
  {
    id: 'admins',
    title: 'Admins',
    description: 'Handler, Manager, Editor, Owner Roles',
    icon: Shield,
    path: '/admin/admins',
    gradient: 'from-purple-500 to-pink-500',
    items: 1,
    requiredLevel: 3,
  },
  {
    id: 'services',
    title: 'Services',
    description: 'Add Server, Add Service, Direct Import, Dashboard',
    icon: Server,
    path: '/admin/services',
    gradient: 'from-emerald-500 to-teal-500',
    items: 4,
    requiredLevel: 2,
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Revenue, Orders, Performance Reports',
    icon: BarChart3,
    path: '/admin/analytics',
    gradient: 'from-orange-500 to-amber-500',
    items: 1,
    requiredLevel: 2,
  },
  {
    id: 'readymade',
    title: 'Readymade Accounts',
    description: 'Pre-configured Account Templates',
    icon: Package,
    path: '/admin/readymade-accounts',
    gradient: 'from-indigo-500 to-violet-500',
    items: 1,
    requiredLevel: 1,
  },
  {
    id: 'seo',
    title: 'SEO',
    description: 'Meta Tags, Sitemap, Analytics',
    icon: Search,
    path: '/admin/seo',
    gradient: 'from-rose-500 to-pink-500',
    items: 1,
    requiredLevel: 2,
  },
  {
    id: 'theme',
    title: 'Theme',
    description: 'Colors, Typography, Layout',
    icon: Palette,
    path: '/admin/theme',
    gradient: 'from-fuchsia-500 to-purple-500',
    items: 1,
    requiredLevel: 2,
  },
  {
    id: 'payments',
    title: 'Payment Settings',
    description: 'Crypto, BharatPe, UPI Configuration',
    icon: CreditCard,
    path: '/admin/payments',
    gradient: 'from-green-500 to-emerald-500',
    items: 1,
    requiredLevel: 2,
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Email, SMS, Push Notifications',
    icon: Bell,
    path: '/admin/notifications',
    gradient: 'from-yellow-500 to-orange-500',
    items: 1,
    requiredLevel: 1,
  },
  {
    id: 'footer',
    title: 'Website Footer',
    description: 'Links, Copyright, Social Media',
    icon: FileText,
    path: '/admin/footer',
    gradient: 'from-slate-500 to-gray-500',
    items: 1,
    requiredLevel: 1,
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Multi-device, Google, Telegram Login',
    icon: Settings,
    path: '/admin/settings',
    gradient: 'from-gray-500 to-slate-500',
    items: 1,
    requiredLevel: 2,
  },
  {
    id: 'number-waiting',
    title: 'Number Waiting',
    description: 'Pending Number Requests',
    icon: Clock,
    path: '/admin/number-waiting',
    gradient: 'from-cyan-500 to-blue-500',
    items: 1,
    requiredLevel: 2,
  },
  {
    id: 'number-history',
    title: 'Number History',
    description: 'Recent Number Transactions',
    icon: History,
    path: '/admin/number-history',
    gradient: 'from-teal-500 to-cyan-500',
    items: 1,
    requiredLevel: 1,
  },
  {
    id: 'custom-pricing',
    title: 'Custom Pricing',
    description: 'Set Custom Prices for Services',
    icon: Tag,
    path: '/admin/custom-pricing',
    gradient: 'from-violet-500 to-purple-500',
    items: 1,
    requiredLevel: 2,
  },
  {
    id: 'web-settings',
    title: 'Web Settings',
    description: 'Website Configuration',
    icon: Globe,
    path: '/admin/web-settings',
    gradient: 'from-sky-500 to-blue-500',
    items: 1,
    requiredLevel: 2,
  },
  {
    id: 'top-services',
    title: 'Top Services',
    description: 'Featured & Popular Services',
    icon: Star,
    path: '/admin/top-services',
    gradient: 'from-amber-500 to-yellow-500',
    items: 1,
    requiredLevel: 2,
  },
  {
    id: 'refer-settings',
    title: 'Refer Settings',
    description: 'Referral Commission & Rules',
    icon: Gift,
    path: '/admin/refer-settings',
    gradient: 'from-pink-500 to-rose-500',
    items: 1,
    requiredLevel: 2,
  },
  {
    id: 'theme-settings',
    title: 'Theme Settings',
    description: 'Advanced Theme Customization',
    icon: Brush,
    path: '/admin/theme-settings',
    gradient: 'from-lime-500 to-green-500',
    items: 1,
    requiredLevel: 2,
  },
  {
    id: 'transactions',
    title: 'Transactions',
    description: 'Crypto, UPI, Promo Transactions',
    icon: Receipt,
    path: '/admin/transactions',
    gradient: 'from-emerald-500 to-green-500',
    items: 1,
    requiredLevel: 1,
  },
];
