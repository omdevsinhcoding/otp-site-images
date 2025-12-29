import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCog, X } from 'lucide-react';
import { Button } from './button';
import { useAuth } from '@/hooks/useAuth';

export const ImpersonationBanner = () => {
  const [hasImpersonation, setHasImpersonation] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { returnToAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('admin_impersonation');
    setHasImpersonation(!!stored);
  }, []);

  const handleReturnToAdmin = () => {
    const success = returnToAdmin();
    if (success) {
      navigate('/admin', { replace: true });
    }
  };

  if (!hasImpersonation || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-amber-500 text-amber-950 py-2 px-3 rounded-lg shadow-lg flex items-center gap-2 text-xs font-medium">
      <UserCog className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="hidden sm:inline">Viewing as user</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleReturnToAdmin}
        className="h-6 px-2 text-xs bg-white/80 hover:bg-white text-amber-900"
      >
        <ArrowLeft className="w-3 h-3 mr-1" />
        Back
      </Button>
      <button 
        onClick={() => setDismissed(true)}
        className="p-0.5 hover:bg-amber-600/50 rounded"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
