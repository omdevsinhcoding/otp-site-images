import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface RoughUnderlineStatusProps {
  hasOtpReceived: boolean;
  messageCount: number;
  variant?: "default" | "compact";
  animationKey?: number; // External trigger for re-animation
}

// Generate hand-drawn path data for rough underline
const generateRoughPaths = (width: number) => {
  const y = 4;
  
  // First stroke: subtle curves (20% intensity)
  const intensity1 = Math.random() * 0.8;
  const r1 = (Math.random() - 0.5) * 0.5;
  const r2 = (Math.random() - 0.5) * 0.5;
  const tilt1 = (Math.random() - 0.5) * 0.4;
  
  // Second stroke: more random and varied
  const intensity2 = Math.random() * 2.5; // More curve variation
  const r3 = (Math.random() - 0.5) * 1.5; // More vertical offset
  const r4 = (Math.random() - 0.5) * 1.5;
  const r5 = (Math.random() - 0.5) * 1.2; // Extra midpoint variation
  const tilt2 = (Math.random() - 0.5) * 1.2; // More tilt
  const xOffset = (Math.random() - 0.5) * 3; // Slight horizontal shift
  
  // First stroke: left to right with subtle curve
  const path1 = `M0 ${y + tilt1} Q${width * 0.25} ${y - intensity1 + r1}, ${width * 0.5} ${y + r2} Q${width * 0.75} ${y + intensity1 + r1}, ${width} ${y - tilt1}`;
  
  // Second stroke: right to left with more randomness
  const path2 = `M${width + xOffset} ${y + 1 + tilt2} Q${width * 0.7} ${y - intensity2 + r3}, ${width * 0.5} ${y + 1 + r5} Q${width * 0.3} ${y + intensity2 + r4}, ${xOffset} ${y + 1 - tilt2}`;
  
  return { path1, path2 };
};

export const RoughUnderlineStatus = ({ 
  hasOtpReceived, 
  messageCount, 
  variant = "default",
  animationKey = 0
}: RoughUnderlineStatusProps) => {
  const [key, setKey] = useState(0);
  const [paths, setPaths] = useState({ path1: "", path2: "" });

  // Get status text based on state
  const getStatusText = () => {
    if (!hasOtpReceived) {
      return "Waiting...";
    }
    if (messageCount === 1) {
      return "SMS Received";
    }
    if (messageCount === 2) {
      return "New SMS";
    }
    if (messageCount === 3) {
      return "3rd SMS";
    }
    return `${messageCount}+ SMS`;
  };

  const getStatusColor = () => {
    return "text-foreground";
  };

  const getStrokeColor = () => {
    return "rgb(220, 20, 60)"; // crimson red
  };

  // Regenerate paths when status changes or animationKey changes
  useEffect(() => {
    const width = variant === "compact" ? 50 : 80;
    const generatedPaths = generateRoughPaths(width);
    setPaths(generatedPaths);
    setKey(prev => prev + 1);
  }, [hasOtpReceived, messageCount, variant, animationKey]);

  const statusText = getStatusText();
  const strokeColor = getStrokeColor();
  const textWidth = variant === "compact" ? 50 : 80;

  // Animation duration in ms
  const strokeDuration = 400;

  if (variant === "compact") {
    return (
      <div className="relative inline-flex flex-col items-center">
        <span className={`text-[9px] font-semibold tracking-wide ${getStatusColor()}`}>
          {statusText}
        </span>
        
        {/* SVG Rough Underline */}
        <svg 
          key={key}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 overflow-visible pointer-events-none" 
          width={textWidth} 
          height="8"
          style={{ overflow: 'visible' }}
        >
          {/* First stroke - left to right */}
          <motion.path
            d={paths.path1}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeLinecap="butt"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: strokeDuration / 1000, ease: "easeOut" }}
          />
          {/* Second stroke - right to left, delayed */}
          <motion.path
            d={paths.path2}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeLinecap="butt"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ 
              duration: strokeDuration / 1000, 
              ease: "easeOut",
              delay: strokeDuration / 1000 
            }}
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative inline-flex flex-col items-center">
      <span className={`text-xs sm:text-sm font-bold tracking-wide ${getStatusColor()}`}>
        {statusText}
      </span>
      
      {/* SVG Rough Underline */}
      <svg 
        key={key}
        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 overflow-visible pointer-events-none" 
        width={textWidth} 
        height="10"
        style={{ overflow: 'visible' }}
      >
        {/* First stroke - left to right */}
        <motion.path
          d={paths.path1}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="butt"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: strokeDuration / 1000, ease: "easeOut" }}
        />
        {/* Second stroke - right to left, delayed */}
        <motion.path
          d={paths.path2}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="butt"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ 
            duration: strokeDuration / 1000, 
            ease: "easeOut",
            delay: strokeDuration / 1000 
          }}
        />
      </svg>
    </div>
  );
};
