import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AdminHeader } from './AdminHeader';
import { AdminCelebration } from './AdminCelebration';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { AdminThemeProvider, useAdminTheme } from '@/hooks/useAdminTheme';
import { useCustomToast } from '@/components/ui/custom-toast';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

function AdminLayoutContent({ children, title }: AdminLayoutProps) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id || null);
  const permissions = useAdminPermissions(user?.id || null);
  const { resolvedTheme } = useAdminTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useCustomToast();
  const [showCelebration, setShowCelebration] = useState(false);
  const celebratedThisVisitRef = useRef(false);

  // Check if entering from sidebar
  const isAdminHome = location.pathname === '/admin' || location.pathname === '/admin/';
  const fromSidebar = (location.state as { fromSidebar?: boolean })?.fromSidebar === true;

  // Show celebration when entering from sidebar (after permissions load)
  useEffect(() => {
    if (!isAdminHome) {
      celebratedThisVisitRef.current = false;
      return;
    }

    // Show celebration only if:
    // 1. Coming from sidebar
    // 2. Permissions are loaded (not loading)
    // 3. User is admin
    // 4. Haven't celebrated this visit yet
    if (
      fromSidebar && 
      !permissions.loading && 
      permissions.isAdmin && 
      !celebratedThisVisitRef.current
    ) {
      celebratedThisVisitRef.current = true;
      setShowCelebration(true);
      
      // Clear the state so refreshing doesn't trigger celebration again
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [isAdminHome, fromSidebar, permissions.loading, permissions.isAdmin, navigate, location.pathname]);

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
    showToast(`Welcome, ${permissions.role}!`, 'success');
  }, [showToast, permissions.role]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Only redirect if both auth and role loading are complete, and user exists but isn't admin
    if (!roleLoading && !authLoading && user && !isAdmin) {
      showToast('Admin access denied', 'error');
      navigate('/', { replace: true });
    }
  }, [isAdmin, roleLoading, authLoading, user, navigate, showToast]);

  if (authLoading || roleLoading) {
    return <LoadingScreen />;
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <>
      <AdminCelebration 
        show={showCelebration} 
        onComplete={handleCelebrationComplete}
        role={permissions.role}
      />
      <div className={cn(
        "min-h-screen transition-colors duration-300",
        resolvedTheme === 'dark' 
          ? "bg-[hsl(222.2,84%,4.9%)] text-[hsl(210,40%,98%)]" 
          : "bg-[hsl(210,40%,96.1%)] text-[hsl(222.2,84%,4.9%)]"
      )}>
        <AdminHeader title={title} />
        
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </>
  );
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  return (
    <AdminThemeProvider>
      <AdminLayoutContent title={title}>
        {children}
      </AdminLayoutContent>
    </AdminThemeProvider>
  );
}
