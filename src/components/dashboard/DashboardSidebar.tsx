import { useEffect } from 'react';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { ExternalLink, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { DashboardIcon } from '@/components/icons/DashboardIcon';
import { RechargeIcon } from '@/components/icons/RechargeIcon';
import { GetNumberIcon } from '@/components/icons/GetNumberIcon';
import { ReferEarnIcon } from '@/components/icons/ReferEarnIcon';
import { NumberHistoryIcon } from '@/components/icons/NumberHistoryIcon';
import { TransactionsIcon } from '@/components/icons/TransactionsIcon';
import { ApiGatewayIcon } from '@/components/icons/ApiGatewayIcon';
import { SupportIcon } from '@/components/icons/SupportIcon';
import logo from '@/assets/logo.png';

const menuItems = [
  { title: 'Dashboard', url: '/', icon: DashboardIcon, color: '#ef4444' },
  { title: 'Recharge', url: '/recharge', icon: RechargeIcon, color: '#22c55e' },
  { title: 'Get Number', url: '/get-number', icon: GetNumberIcon, color: '#3b82f6' },
  { title: 'Refer and Earn', url: '/refer', icon: ReferEarnIcon, color: '#f43f5e' },
  { title: 'Number History', url: '/number-history', icon: NumberHistoryIcon, color: '#f97316' },
  { title: 'Transactions', url: '/transactions', icon: TransactionsIcon, color: '#eab308' },
  { title: 'API Gateway', url: '/api-gateway', icon: ApiGatewayIcon, color: '#06b6d4' },
  { title: 'Support', url: '/support', icon: SupportIcon, color: '#ec4899' },
];

const createRipple = (event: React.MouseEvent<HTMLElement>) => {
  const button = event.currentTarget;
  const rect = button.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const existingRipples = button.querySelectorAll('.sidebar-ripple');
  existingRipples.forEach(ripple => ripple.remove());

  const ripple = document.createElement('span');
  ripple.className = 'sidebar-ripple';
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;

  button.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
};

interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

export function DashboardSidebar({ isOpen = true, onClose, isMobile = false }: DashboardSidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useUserRole(user?.id ?? null);

  const isActive = (url: string) => {
    if (url === '/') return location.pathname === '/';
    return location.pathname.startsWith(url);
  };

  useEffect(() => {
    if (isMobile && onClose) {
      onClose();
    }
  }, [location.pathname]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    createRipple(event);
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Desktop sidebar - fixed width, no clamp
  if (!isMobile) {
    return (
      <aside
        className="fixed left-0 top-0 h-dvh bg-[#1c2536] overflow-hidden flex-shrink-0 z-30"
        style={{ width: 'var(--sidebar-width)' }}
      >
        <SidebarContent isAdmin={isAdmin} isActive={isActive} handleMenuClick={handleMenuClick} />
      </aside>
    );
  }

  // Mobile sidebar with overlay
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed left-0 top-0 h-full z-50 bg-[#1c2536] transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: 'min(85vw, 300px)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-10 touch-target"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent isAdmin={isAdmin} isActive={isActive} handleMenuClick={handleMenuClick} />
      </aside>
    </>
  );
}

function SidebarContent({
  isAdmin,
  isActive,
  handleMenuClick,
}: {
  isAdmin: boolean;
  isActive: (url: string) => boolean;
  handleMenuClick: (event: React.MouseEvent<HTMLElement>) => void;
}) {
  return (
    <div className="flex flex-col h-full p-3 sm:p-4 overflow-y-auto overflow-x-hidden">
      <div className="h-16 sm:h-[72px] flex items-center gap-3 pl-3 sm:pl-4 border-b border-white/5 mb-2 flex-shrink-0">
        <OptimizedImage src={logo} alt="Logo" className="w-8 h-8 sm:w-9 sm:h-9" priority />
        <span className="text-base sm:text-lg font-bold text-white tracking-wide">OTPBUY</span>
      </div>

      <nav className="flex flex-col gap-1 flex-1 pt-2 min-w-0">
        {isAdmin && (
          <RouterNavLink
            to="/admin"
            state={{ fromSidebar: true }}
            onClick={handleMenuClick}
            className={`w-full h-11 sm:h-12 rounded-[10px] px-3 sm:px-4 flex items-center gap-3 text-sm sm:text-[15px] font-medium no-underline cursor-pointer relative overflow-hidden transition-colors duration-100 touch-target ${
              isActive('/admin') ? 'bg-white/[0.06] text-white' : 'text-[#9aa4b2] hover:bg-white/[0.04]'
            }`}
          >
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 text-lime-400 drop-shadow-[0_0_6px_rgba(132,204,22,0.5)]" />
            <span className="truncate">Admin Panel</span>
          </RouterNavLink>
        )}

        {menuItems.map((item) => {
          const active = isActive(item.url);
          const IconComponent = item.icon;
          return (
            <RouterNavLink
              key={item.title}
              to={item.url}
              onClick={handleMenuClick}
              className={`w-full h-11 sm:h-12 rounded-[10px] px-3 sm:px-4 flex items-center gap-3 text-sm sm:text-[15px] font-medium no-underline cursor-pointer relative overflow-hidden transition-colors duration-100 touch-target ${
                active ? 'bg-white/[0.06] text-white' : 'text-[#9aa4b2] hover:bg-white/[0.04]'
              }`}
            >
              <span className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 flex items-center justify-center opacity-85" style={{ color: item.color }}>
                <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              <span className="truncate">{item.title}</span>
            </RouterNavLink>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 flex-shrink-0">
        <div className="w-full h-px bg-white/10 mb-4" />
        <a
          href="https://t.me/OTPBUYCOM"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-11 sm:h-12 rounded-xl bg-[#6c6cff] hover:bg-[#5a5aee] text-white text-sm sm:text-[15px] font-semibold flex items-center justify-center gap-2.5 cursor-pointer relative overflow-hidden transition-colors duration-100 touch-target"
        >
          <span className="truncate">Join Telegram</span>
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
        </a>
      </div>
    </div>
  );
}
