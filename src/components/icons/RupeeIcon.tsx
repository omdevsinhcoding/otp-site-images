import { SVGProps } from 'react';

interface RupeeIconProps extends SVGProps<SVGSVGElement> {
  variant?: 'green' | 'red';
}

export function RupeeIcon({ variant = 'green', ...props }: RupeeIconProps) {
  const colors = variant === 'green' 
    ? { border: '#0bbc15', background: '#9eff84', symbol: '#0bbc15' }
    : { border: 'white', background: 'white', symbol: 'rgb(239, 83, 80)' };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
    >
      {/* Coin border */}
      <circle cx="12" cy="12" r="10" fill={colors.border} />
      
      {/* Coin background */}
      <circle cx="12" cy="12" r="9" fill={colors.background} />
      
      {/* Rs symbol */}
      <path
        fill={colors.symbol}
        d="M9 7.5A.75.75 0 0 0 9 9h1.5c.98 0 1.813.626 2.122 1.5H9A.75.75 0 0 0 9 12h3.622a2.251 2.251 0 0 1-2.122 1.5H9a.75.75 0 0 0-.53 1.28l3 3a.75.75 0 1 0 1.06-1.06L10.8 14.988A3.752 3.752 0 0 0 14.175 12H15a.75.75 0 0 0 0-1.5h-.825A3.733 3.733 0 0 0 13.5 9H15a.75.75 0 0 0 0-1.5H9Z"
      />
    </svg>
  );
}
