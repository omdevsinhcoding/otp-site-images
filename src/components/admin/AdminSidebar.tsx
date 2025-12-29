import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Users, Shield, Server, BarChart3, Package, Search, Palette,
  CreditCard, Bell, FileText, Settings, LogOut, Clock, History,
  Tag, Globe, Star, Gift, Brush, Percent, Receipt, ChevronDown,
  ChevronRight, LayoutDashboard, Menu, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path?: string;
  children?: { title: string; path: string }[];
}

const menuItems: MenuItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { 
    title: 'Users', 
    icon: Users, 
    children: [
      { title: 'All Users', path: '/admin/users' },
      { title: 'Active Users', path: '/admin/users/active' },
      { title: 'Banned Users', path: '/admin/users/banned' },
    ]
  },
  { 
    title: 'Admins', 
    icon: Shield, 
    children: [
      { title: 'All Admins', path: '/admin/admins' },
      { title: 'Handlers', path: '/admin/admins/handlers' },
      { title: 'Managers', path: '/admin/admins/managers' },
      { title: 'Editors', path: '/admin/admins/editors' },
    ]
  },
  { 
    title: 'Services', 
    icon: Server, 
    children: [
      { title: 'All Services', path: '/admin/services' },
      { title: 'Add Server', path: '/admin/services/add-server' },
      { title: 'Add Service', path: '/admin/services/add-service' },
      { title: 'Direct Import', path: '/admin/services/import' },
    ]
  },
  { title: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  { title: 'Readymade Accounts', icon: Package, path: '/admin/readymade-accounts' },
  { title: 'SEO', icon: Search, path: '/admin/seo' },
  { title: 'Theme', icon: Palette, path: '/admin/theme' },
  { 
    title: 'Payment Settings', 
    icon: CreditCard, 
    children: [
      { title: 'All Payments', path: '/admin/payments' },
      { title: 'Crypto', path: '/admin/payments/crypto' },
      { title: 'UPI', path: '/admin/payments/upi' },
      { title: 'BharatPe', path: '/admin/payments/bharatpe' },
    ]
  },
  { title: 'Notifications', icon: Bell, path: '/admin/notifications' },
  { title: 'Website Footer', icon: FileText, path: '/admin/footer' },
  { 
    title: 'Settings', 
    icon: Settings, 
    children: [
      { title: 'General', path: '/admin/settings' },
      { title: 'Login Options', path: '/admin/settings/login' },
      { title: 'Multi-device', path: '/admin/settings/multi-device' },
    ]
  },
  { title: 'Number Waiting', icon: Clock, path: '/admin/number-waiting' },
  { title: 'Number History', icon: History, path: '/admin/number-history' },
  { title: 'Custom Pricing', icon: Tag, path: '/admin/custom-pricing' },
  { title: 'Web Settings', icon: Globe, path: '/admin/web-settings' },
  { title: 'Top Services', icon: Star, path: '/admin/top-services' },
  { title: 'Refer Settings', icon: Gift, path: '/admin/refer-settings' },
  { title: 'Theme Settings', icon: Brush, path: '/admin/theme-settings' },
  { title: 'Discount Setup', icon: Percent, path: '/admin/discount-setup' },
  { 
    title: 'Transactions', 
    icon: Receipt, 
    children: [
      { title: 'All Transactions', path: '/admin/transactions' },
      { title: 'Crypto', path: '/admin/transactions/crypto' },
      { title: 'UPI', path: '/admin/transactions/upi' },
      { title: 'Promo Codes', path: '/admin/transactions/promo' },
    ]
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ isOpen, onToggle }: AdminSidebarProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Users']);

  const toggleExpand = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (path?: string) => path && location.pathname === path;
  const isChildActive = (children?: { title: string; path: string }[]) => 
    children?.some(child => location.pathname === child.path);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out",
        "bg-gradient-to-b from-[hsl(var(--otp-sidebar-grad-top))] to-[hsl(var(--otp-sidebar-grad-bottom))]",
        "border-r border-sidebar-border shadow-2xl",
        isOpen ? "w-72" : "w-0 lg:w-20",
        "lg:relative"
      )}>
        <div className={cn(
          "flex flex-col h-full",
          !isOpen && "lg:items-center"
        )}>
          {/* Header */}
          <div className={cn(
            "flex items-center h-16 px-4 border-b border-sidebar-border",
            !isOpen && "lg:justify-center lg:px-2"
          )}>
            {isOpen ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-sidebar-foreground text-lg">Admin Panel</h1>
                  <p className="text-xs text-sidebar-muted-foreground">Management Console</p>
                </div>
              </div>
            ) : (
              <div className="hidden lg:flex w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"
              onClick={onToggle}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Menu */}
          <ScrollArea className="flex-1 py-4">
            <nav className={cn("space-y-1", isOpen ? "px-3" : "lg:px-2")}>
              {menuItems.map((item) => (
                <div key={item.title}>
                  {item.children ? (
                    <>
                      <button
                        onClick={() => toggleExpand(item.title)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                          "text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                          isChildActive(item.children) && "text-sidebar-foreground bg-sidebar-accent/30",
                          !isOpen && "lg:justify-center lg:px-2"
                        )}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {isOpen && (
                          <>
                            <span className="flex-1 text-left text-sm font-medium">{item.title}</span>
                            {expandedItems.includes(item.title) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </>
                        )}
                      </button>
                      {isOpen && expandedItems.includes(item.title) && (
                        <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border/50 pl-4">
                          {item.children.map((child) => (
                            <NavLink
                              key={child.path}
                              to={child.path}
                              className={cn(
                                "flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200",
                                "text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                                isActive(child.path) && "text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg"
                              )}
                            >
                              {child.title}
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <NavLink
                      to={item.path!}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        "text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                        isActive(item.path) && "text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg",
                        !isOpen && "lg:justify-center lg:px-2"
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {isOpen && <span className="text-sm font-medium">{item.title}</span>}
                    </NavLink>
                  )}
                </div>
              ))}
            </nav>
          </ScrollArea>

          {/* Sign Out */}
          <div className={cn(
            "p-4 border-t border-sidebar-border",
            !isOpen && "lg:px-2"
          )}>
            <NavLink
              to="/admin/auth"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "text-red-400 hover:text-red-300 hover:bg-red-500/10",
                !isOpen && "lg:justify-center lg:px-2"
              )}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span className="text-sm font-medium">Sign Out</span>}
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
}
