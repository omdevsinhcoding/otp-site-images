import { motion } from "framer-motion";

interface NumberStatusBadgeProps {
  hasOtpReceived: boolean;
  messageCount: number;
  variant?: "default" | "compact";
}

export const NumberStatusBadge = ({ 
  hasOtpReceived, 
  messageCount, 
  variant = "default" 
}: NumberStatusBadgeProps) => {
  // Determine the state based on OTP and message count
  const getStatusConfig = () => {
    if (!hasOtpReceived) {
      return {
        label: "Waiting",
        icon: (
          <motion.div
            className="relative"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </motion.div>
        ),
        bgClass: "bg-gradient-to-r from-amber-500/10 to-orange-500/10",
        borderClass: "border-amber-400/40",
        textClass: "text-amber-600",
        dotClass: "bg-amber-500",
        glowClass: "shadow-[0_0_12px_rgba(245,158,11,0.3)]",
        pulseRing: true,
      };
    }

    if (messageCount === 1) {
      return {
        label: "1st OTP",
        icon: (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ),
        bgClass: "bg-gradient-to-r from-emerald-500/10 to-green-500/10",
        borderClass: "border-emerald-400/50",
        textClass: "text-emerald-600",
        dotClass: "bg-emerald-500",
        glowClass: "shadow-[0_0_12px_rgba(16,185,129,0.35)]",
        pulseRing: false,
      };
    }

    if (messageCount === 2) {
      return {
        label: "2nd OTP",
        icon: (
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] font-black">2</span>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ),
        bgClass: "bg-gradient-to-r from-blue-500/10 to-cyan-500/10",
        borderClass: "border-blue-400/50",
        textClass: "text-blue-600",
        dotClass: "bg-blue-500",
        glowClass: "shadow-[0_0_12px_rgba(59,130,246,0.35)]",
        pulseRing: false,
      };
    }

    if (messageCount === 3) {
      return {
        label: "3rd OTP",
        icon: (
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] font-black">3</span>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ),
        bgClass: "bg-gradient-to-r from-violet-500/10 to-purple-500/10",
        borderClass: "border-violet-400/50",
        textClass: "text-violet-600",
        dotClass: "bg-violet-500",
        glowClass: "shadow-[0_0_12px_rgba(139,92,246,0.35)]",
        pulseRing: false,
      };
    }

    // 4+ messages
    return {
      label: `${messageCount}${messageCount === 4 ? "th" : "+"} OTP`,
      icon: (
        <div className="flex items-center gap-0.5">
          <span className="text-[10px] font-black">{messageCount > 9 ? "9+" : messageCount}</span>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
      ),
      bgClass: "bg-gradient-to-r from-pink-500/10 to-rose-500/10",
      borderClass: "border-pink-400/50",
      textClass: "text-pink-600",
      dotClass: "bg-pink-500",
      glowClass: "shadow-[0_0_12px_rgba(236,72,153,0.35)]",
      pulseRing: false,
    };
  };

  const config = getStatusConfig();

  if (variant === "compact") {
    return (
      <div className="relative">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`w-2.5 h-2.5 rounded-full ${config.dotClass} ${config.glowClass}`}
        />
        {config.pulseRing && (
          <motion.div
            className={`absolute inset-0 rounded-full ${config.dotClass}`}
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          />
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`
        relative flex items-center gap-1.5 px-3 py-1.5 rounded-full
        ${config.bgClass} ${config.textClass}
        border ${config.borderClass}
        ${config.glowClass}
        backdrop-blur-sm
      `}
    >
      {/* Animated background shimmer for waiting state */}
      {config.pulseRing && (
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-amber-400/20 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      )}
      
      {/* Icon */}
      <div className="relative z-10">{config.icon}</div>
      
      {/* Label */}
      <span className="relative z-10 text-[10px] sm:text-xs font-bold tracking-wide">
        {config.label}
      </span>
    </motion.div>
  );
};
