import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RechargePill } from './RechargePill';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import defaultAvatar from '@/assets/default-avatar.png';
import { HamburgerIcon } from '@/components/icons/HamburgerIcon';

interface DashboardHeaderProps {
  balance?: number;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function DashboardHeader({
  balance = 0,
  onMenuClick,
  showMenuButton = false,
}: DashboardHeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleRecharge = () => {
    navigate('/recharge');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

  return (
    <header className="sticky top-0 z-20 w-full bg-background shrink-0">
      <div className="page-container flex min-h-[var(--touch-target)] items-center justify-between gap-1 xxxs:gap-2 py-2 flex-wrap">
        {/* Left side - Hamburger menu on mobile */}
        <div className="flex items-center">
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="min-h-[var(--touch-target)] min-w-[var(--touch-target)] flex items-center justify-center -ml-2 text-foreground hover:bg-muted rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <HamburgerIcon className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Right side - Balance and Avatar */}
        <div className="flex items-center justify-end gap-1 xxxs:gap-2 sm:gap-3 min-w-0 flex-nowrap">
        <RechargePill balance={balance} onClick={handleRecharge} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="focus:outline-none min-h-[var(--touch-target)] min-w-[var(--touch-target)] flex items-center justify-center">
              <Avatar className="h-9 w-9 sm:h-10 sm:w-10 cursor-pointer ring-2 ring-border/30 shadow-sm">
                <AvatarImage src={defaultAvatar} className="object-cover" />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  {user?.email ? getInitials(user.name, user.email) : 'U'}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-0 bg-white border border-[rgb(242,244,247)] shadow-lg z-50 rounded-lg overflow-hidden">
            {/* User Info Section */}
            <div className="flex items-center justify-center gap-3 py-3 px-4">
              <Avatar className="h-11 w-11 shrink-0">
                <AvatarImage src={defaultAvatar} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  {user?.email ? getInitials(user.name, user.email) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start justify-center min-w-0">
                <span className="font-medium text-foreground truncate w-full text-base">{displayName}</span>
                <span className="truncate w-full text-muted-foreground text-sm">{user?.email?.split('@')[0] || ''}</span>
              </div>
            </div>

            {/* Separator 1 */}
            <div className="h-px w-full bg-[rgb(242,244,247)]" />

            {/* Profile */}
            <button onClick={handleProfile} className="w-full text-left px-3 sm:px-4 py-3 sm:py-4 text-foreground hover:bg-[#f6f6f6] transition-all duration-200 h-12 sm:h-14 flex items-center text-base sm:text-lg">
              Profile
            </button>

            {/* Separator 2 */}
            <div className="h-px w-full bg-[rgb(242,244,247)]" />

            {/* Sign out */}
            <button onClick={handleSignOut} className="w-full text-left px-4 py-4 text-[#1a1a1a] hover:bg-[rgb(248,249,250)] transition-colors h-14 flex items-center text-lg">
              Sign out
            </button>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
