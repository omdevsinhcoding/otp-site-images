import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
}

interface PromoCodeCelebrationProps {
  show: boolean;
  amount: number;
  onComplete: () => void;
}

const celebrationColors = ['#22c55e', '#10b981', '#6366f1', '#8b5cf6', '#fbbf24', '#f59e0b'];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: celebrationColors[Math.floor(Math.random() * celebrationColors.length)],
    size: Math.random() * 10 + 4,
    delay: Math.random() * 0.4,
  }));
}

export function PromoCodeCelebration({ show, amount, onComplete }: PromoCodeCelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!show) return;

    setParticles(generateParticles(35));

    const timer = window.setTimeout(() => {
      onComplete();
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
        >
          {/* Confetti particles */}
          {particles.map((p) => (
            <motion.div
              key={`${p.id}-${p.x}`}
              initial={{ x: `${p.x}vw`, y: '-5vh', opacity: 1, rotate: 0 }}
              animate={{ y: '105vh', opacity: 0, rotate: 720 }}
              transition={{ duration: 2.2, delay: p.delay * 0.5, ease: 'linear' }}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: p.id % 2 === 0 ? '50%' : '2px',
              }}
            />
          ))}

          {/* Center celebration card */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 280 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white px-8 sm:px-12 py-6 sm:py-8 rounded-2xl shadow-2xl">
              <div className="flex flex-col items-center gap-3">
                <motion.div 
                  className="bg-white/20 p-4 rounded-full backdrop-blur-sm"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 10, -10, 0] 
                  }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Gift className="w-8 h-8" />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium text-white/90">Promo Applied!</span>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">₹{amount.toFixed(2)}</h2>
                  <p className="text-white/80 text-sm mt-1">added to your wallet</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
