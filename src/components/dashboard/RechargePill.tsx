import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RupeeIcon } from '@/components/icons/RupeeIcon';

interface RechargePillProps {
  balance: number;
  onClick?: () => void;
}

export function RechargePill({ balance, onClick }: RechargePillProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
    onClick?.();
  };

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          aria-label="Recharge balance"
          className={`
            group flex items-center gap-1.5 sm:gap-2 rounded-lg
            border border-[rgb(199,199,199)] bg-white
            min-h-[var(--touch-target)] pl-1.5 pr-2.5 sm:pr-3.5 py-1
            shadow-[0_2px_8px_rgba(0,0,0,0.08)]
            transition-all duration-200 ease-out
            hover:bg-[rgb(79,81,184)] hover:border-[rgb(79,81,184)] hover:shadow-[0_4px_12px_rgba(79,81,184,0.3)]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            ${isPressed ? 'scale-[0.97]' : 'scale-100'}
          `}
        >
          {/* Rupee icon */}
          <RupeeIcon className="h-4 w-4 xxxs:h-5 xxxs:w-5 sm:h-6 sm:w-6 flex-shrink-0" />
          
          {/* Balance text */}
          <span className="text-[10px] xxxs:text-xs sm:text-sm font-semibold text-[#1a1a2e] tracking-tight transition-colors duration-200 group-hover:text-white truncate max-w-[55px] xs:max-w-[80px] sm:max-w-none">
            ₹{balance.toFixed(2)}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent 
        side="bottom" 
        sideOffset={12}
        className="rounded-md bg-[rgb(109,109,109)] px-3 py-1.5 text-xs font-medium text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] animate-in fade-in-0 zoom-in-95"
      >
        Recharge
      </TooltipContent>
    </Tooltip>
  );
}
