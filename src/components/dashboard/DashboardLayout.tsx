import { ReactNode, useState } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { ImpersonationBanner } from '../ui/ImpersonationBanner';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  children: ReactNode;
  balance?: number;
}

export function DashboardLayout({ children, balance = 0 }: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleOpenSidebar = () => setSidebarOpen(true);
  const handleCloseSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-dvh w-full">
      <ImpersonationBanner />

      {/* Desktop sidebar - fixed position */}
      {!isMobile && <DashboardSidebar isMobile={false} />}

      {/* Mobile sidebar - overlay */}
      {isMobile && (
        <DashboardSidebar
          isMobile={true}
          isOpen={sidebarOpen}
          onClose={handleCloseSidebar}
        />
      )}

      {/* Main content area */}
      <div
        className="flex flex-1 flex-col min-w-0 w-full"
        style={{
          marginLeft: isMobile ? 0 : 'var(--sidebar-width)',
        }}
      >
        <DashboardHeader
          balance={balance}
          onMenuClick={handleOpenSidebar}
          showMenuButton={isMobile}
        />
        
        {/* Main content - pages manage their own containers */}
        <main className="flex-1 bg-background overflow-y-auto overflow-x-hidden py-[var(--page-padding-y)] pb-[calc(env(safe-area-inset-bottom)+var(--page-padding-y))]">
          {children}
        </main>
      </div>
    </div>
  );
}
