import { Ban, AlertTriangle, LogOut, MessageCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomToast } from '@/components/ui/custom-toast';
import { useAuth } from '@/hooks/useAuth';

interface BannedUserOverlayProps {
  showToast?: boolean;
}

export const BannedUserOverlay = ({ showToast = false }: BannedUserOverlayProps) => {
  const { showToast: displayToast } = useCustomToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (showToast) {
      displayToast(
        'Your account has been banned. All functionality is disabled. Please contact support for assistance.',
        'error',
        false,
        5000
      );
    }
  }, [showToast, displayToast]);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Centered message */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <Ban className="w-8 h-8 text-red-600" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Account Suspended
          </h2>
          
          <p className="text-gray-600 mb-6">
            Your account has been banned. All functionality is currently disabled.
            Please contact support for assistance.
          </p>
          
          <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 rounded-lg p-3 mb-6">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">All actions are disabled</span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/support')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[rgb(99,102,241)] hover:bg-[#4338CA] text-white font-semibold text-sm transition-all duration-200"
            >
              <MessageCircle className="w-4 h-4" />
              Contact Support
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};