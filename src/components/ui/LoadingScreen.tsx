export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-card">
      {/* Chat Icon with lines - exact match from reference */}
      <svg
        focusable="false"
        aria-hidden="true"
        viewBox="0 0 24 24"
        style={{
          width: '48px',
          height: '48px',
          fill: 'hsl(var(--otp-loader))',
        }}
      >
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2m-2 12H6v-2h12zm0-3H6V9h12zm0-3H6V6h12z" />
      </svg>

      {/* Circular Progress Spinner */}
      <span
        style={{
          display: 'inline-block',
          width: '40px',
          height: '40px',
          marginTop: '16px',
          color: 'hsl(var(--otp-loader))',
          animation: 'otp-loader-rotate 1.4s linear infinite',
        }}
      >
        <svg viewBox="22 22 44 44" style={{ display: 'block', width: '100%', height: '100%' }}>
          <circle
            cx="44"
            cy="44"
            r="20.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.6"
            style={{
              strokeDasharray: '80px, 200px',
              strokeDashoffset: 0,
              animation: 'otp-loader-dash 1.4s ease-in-out infinite',
            }}
          />
        </svg>
      </span>

      <style>
        {`
          @keyframes otp-loader-rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes otp-loader-dash {
            0% {
              stroke-dasharray: 1px, 200px;
              stroke-dashoffset: 0;
            }
            50% {
              stroke-dasharray: 100px, 200px;
              stroke-dashoffset: -15px;
            }
            100% {
              stroke-dasharray: 1px, 200px;
              stroke-dashoffset: -126px;
            }
          }
        `}
      </style>
    </div>
  );
}
