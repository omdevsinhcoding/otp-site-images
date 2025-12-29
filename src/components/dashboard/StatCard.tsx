import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ComponentType, SVGProps } from 'react';
import { RupeeIcon } from '@/components/icons/RupeeIcon';

type IconType = LucideIcon | ComponentType<SVGProps<SVGSVGElement> & { variant?: 'green' | 'red' }>;

interface StatCardProps {
  title: string;
  value: string | number;
  icon: IconType;
  iconBgColor: string;
  iconColor?: string;
}

export function StatCard({ title, value, icon: Icon, iconBgColor, iconColor = 'text-white' }: StatCardProps) {
  const isRupeeIcon = Icon === RupeeIcon;
  
  return (
    <Card className="flex items-center gap-3 xs:gap-4 sm:gap-6 p-3 xs:p-4 sm:p-6 min-h-[90px] xs:min-h-[100px] sm:min-h-[127px] bg-[#ffffff] border border-[#fafafa]">
      <div 
        className={`flex h-10 w-10 xs:h-12 xs:w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full ${iconBgColor}`}
      >
        {isRupeeIcon ? (
          <RupeeIcon className={`h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 ${iconColor}`} variant="red" />
        ) : (
          <Icon className={`h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 ${iconColor}`} />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-xs xs:text-sm font-medium uppercase tracking-wide text-muted-foreground truncate">
          {title}
        </p>
        <p className="text-xl xs:text-2xl sm:text-3xl font-bold text-foreground">
          {value}
        </p>
      </div>
    </Card>
  );
}
