import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { BannedUserOverlay } from '@/components/ui/BannedUserOverlay';
import { useCustomToast } from '@/components/ui/custom-toast';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useCustomToast();
  const banToastShownRef = useRef(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  // Show ban toast once when banned user enters
  useEffect(() => {
    if (user?.is_banned && !banToastShownRef.current) {
      banToastShownRef.current = true;
      showToast('Account suspended. Contact support.', 'error', false, 5000);
    }
  }, [user?.is_banned, showToast]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 xs:px-6">
      {user.is_banned && <BannedUserOverlay />}
      <div className="text-center w-full max-w-md">
        <h1 className="mb-3 xs:mb-4 text-2xl xs:text-3xl sm:text-4xl font-bold text-foreground">Welcome!</h1>
        <p className="text-base xs:text-lg sm:text-xl text-muted-foreground mb-4 xs:mb-6 break-words">You're logged in as {user.email}</p>
        <Button onClick={() => signOut()} variant="outline" className="min-h-[44px] min-w-[44px]">
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Index;
