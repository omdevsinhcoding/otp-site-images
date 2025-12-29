import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { MessageCircle, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BannedUserOverlay } from '@/components/ui/BannedUserOverlay';
import { supabase } from '@/integrations/supabase/client';

const Support = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);

  // Fetch balance on mount
  useEffect(() => {
    const fetchBalance = async () => {
      if (!user?.id) return;
      try {
        const { data } = await supabase.rpc('get_wallet_balance', { p_user_id: user.id });
        setBalance(data || 0);
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };
    fetchBalance();
  }, [user?.id]);
  
  return (
    <DashboardLayout balance={balance}>
      {/* Support page is accessible to banned users - no overlay here */}
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* Page Title */}
        <h1 className="text-foreground text-xl sm:text-2xl md:text-3xl font-semibold">
          Contact Us
        </h1>

        {/* Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Telegram Support Card */}
          <div className="bg-gradient-to-br from-white via-white to-[rgb(248,248,255)] rounded-xl p-5 sm:py-8 sm:px-8 border border-[rgb(230,230,250)] shadow-[0_4px_20px_rgba(99,102,241,0.08),0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)] transition-all duration-300 ease-out hover:translate-y-[-4px] hover:shadow-[0_12px_30px_rgba(99,102,241,0.15),0_4px_8px_rgba(0,0,0,0.06)] cursor-pointer">
            <div className="flex items-center gap-4 sm:gap-5 mb-5 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[rgb(239,239,254)] flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[rgb(99,102,241)]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-foreground font-semibold text-base sm:text-lg truncate">Telegram Support</h3>
                <p className="text-muted-foreground text-sm mt-0.5 truncate">@OTPBUYSUPPORT</p>
              </div>
            </div>
            <a href="https://t.me/OTPBUYSUPPORT" target="_blank" rel="noopener noreferrer" className="block w-full py-3 sm:py-3.5 rounded-lg bg-[rgb(99,102,241)] hover:bg-[#4338CA] text-white font-semibold text-center text-sm transition-all duration-200">
              Chat Now
            </a>
          </div>

          {/* Telegram Channel Card */}
          <div className="bg-gradient-to-br from-white via-white to-[rgb(248,248,255)] rounded-xl p-5 sm:py-8 sm:px-8 border border-[rgb(230,230,250)] shadow-[0_4px_20px_rgba(99,102,241,0.08),0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)] transition-all duration-300 ease-out hover:translate-y-[-4px] hover:shadow-[0_12px_30px_rgba(99,102,241,0.15),0_4px_8px_rgba(0,0,0,0.06)] cursor-pointer">
            <div className="flex items-center gap-4 sm:gap-5 mb-5 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[rgb(239,239,254)] flex items-center justify-center flex-shrink-0">
                <Send className="w-5 h-5 sm:w-6 sm:h-6 text-[rgb(99,102,241)]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-foreground font-semibold text-base sm:text-lg truncate">Telegram Channel</h3>
                <p className="text-muted-foreground text-sm mt-0.5 truncate">@OTPBUYCOM</p>
              </div>
            </div>
            <a href="https://t.me/OTPBUYCOM" target="_blank" rel="noopener noreferrer" className="block w-full py-3 sm:py-3.5 rounded-lg bg-[rgb(99,102,241)] hover:bg-[#4338CA] text-white font-semibold text-center text-sm transition-all duration-200">
              Join Channel
            </a>
          </div>
        </div>

        {/* Support Message */}
        <div className="bg-muted/50 rounded-lg py-4 sm:py-5 px-4 sm:px-8 border border-border">
          <p className="text-muted-foreground text-center text-sm sm:text-base">
            Our support team is available 24/7 to assist you
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Support;
