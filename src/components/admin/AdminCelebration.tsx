import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Crown, Star, Sparkles } from 'lucide-react';
import { AdminRole, getRoleInfo } from '@/hooks/useAdminPermissions';

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
}

interface AdminCelebrationProps {
  show: boolean;
  onComplete: () => void;
  role?: AdminRole;
}

// Role-specific colors for particles
const getRoleColors = (role: AdminRole) => {
  switch (role) {
    case 'owner':
      return ['#f59e0b', '#ea580c', '#fbbf24', '#f97316', '#fcd34d'];
    case 'manager':
      return ['#a855f7', '#6366f1', '#8b5cf6', '#7c3aed', '#c084fc'];
    case 'handler':
      return ['#3b82f6', '#06b6d4', '#0ea5e9', '#22d3ee', '#38bdf8'];
    default:
      return ['#22c55e', '#10b981', '#34d399', '#6ee7b7', '#4ade80'];
  }
};

// Role-specific icon
const RoleIcon = ({ role }: { role: AdminRole }) => {
  const iconClass = "w-7 h-7";
  switch (role) {
    case 'owner':
      return <Crown className={iconClass} />;
    case 'manager':
      return <Star className={iconClass} />;
    case 'handler':
      return <Sparkles className={iconClass} />;
    default:
      return <Shield className={iconClass} />;
  }
};

// Role-specific gradient
const getRoleGradient = (role: AdminRole) => {
  switch (role) {
    case 'owner':
      return 'from-amber-500 via-orange-500 to-yellow-500';
    case 'manager':
      return 'from-purple-600 via-violet-600 to-indigo-600';
    case 'handler':
      return 'from-blue-500 via-cyan-500 to-sky-500';
    default:
      return 'from-green-500 via-emerald-500 to-teal-500';
  }
};

function generateParticles(count: number, colors: string[]): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 4,
    delay: Math.random() * 0.3,
  }));
}

export function AdminCelebration({ show, onComplete, role = 'handler' }: AdminCelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const roleInfo = getRoleInfo(role);
  const roleColors = getRoleColors(role);

  useEffect(() => {
    if (!show) return;

    // Generate particles with role-specific colors
    setParticles(generateParticles(28, roleColors));

    // Fast celebration - 2 seconds max for premium feel
    const timer = window.setTimeout(() => {
      onComplete();
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
        >
          {/* Lightweight confetti with role colors */}
          {particles.map((p) => (
            <motion.div
              key={`${p.id}-${p.x}`}
              initial={{ x: `${p.x}vw`, y: '-5vh', opacity: 1, rotate: 0 }}
              animate={{ y: '105vh', opacity: 0, rotate: 360 }}
              transition={{ duration: 1.8, delay: p.delay * 0.5, ease: 'linear' }}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: '2px',
              }}
            />
          ))}

          {/* Center card with role-specific styling */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className={`bg-gradient-to-r ${getRoleGradient(role)} text-white px-10 py-6 rounded-2xl shadow-2xl`}>
              <div className="flex items-center gap-5">
                <motion.div 
                  className="bg-white/20 p-3 rounded-xl backdrop-blur-sm"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <RoleIcon role={role} />
                </motion.div>
                <div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h2 className="text-2xl font-bold tracking-tight">{roleInfo.label} Access</h2>
                  </motion.div>
                  <motion.p 
                    className="text-white/80 text-sm mt-0.5"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {roleInfo.description}
                  </motion.p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
