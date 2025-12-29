import { useState, useEffect } from "react";

interface CancelCountdownProps {
  createdAt: string;
  waitMinutes?: number;
}

export function CancelCountdown({ createdAt, waitMinutes = 2 }: CancelCountdownProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  useEffect(() => {
    const calculateRemaining = () => {
      const created = new Date(createdAt).getTime();
      const unlockTime = created + waitMinutes * 60 * 1000;
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((unlockTime - now) / 1000));
      return remaining;
    };

    setSecondsRemaining(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, waitMinutes]);

  if (secondsRemaining <= 0) {
    return null;
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const display = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <span className="text-[10px] text-rose-500 font-medium tabular-nums">
      ({display})
    </span>
  );
}

export function useCancelAvailable(createdAt: string, waitMinutes = 2): boolean {
  const [available, setAvailable] = useState<boolean>(false);

  useEffect(() => {
    const checkAvailability = () => {
      const created = new Date(createdAt).getTime();
      const unlockTime = created + waitMinutes * 60 * 1000;
      return Date.now() >= unlockTime;
    };

    setAvailable(checkAvailability());

    const interval = setInterval(() => {
      const isAvailable = checkAvailability();
      setAvailable(isAvailable);
      if (isAvailable) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, waitMinutes]);

  return available;
}

// Auto-cancel countdown (20 minutes)
interface AutoCancelCountdownProps {
  createdAt: string;
  hasOtpReceived: boolean;
}

export function AutoCancelCountdown({ createdAt, hasOtpReceived }: AutoCancelCountdownProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const AUTO_CANCEL_MINUTES = 20;

  useEffect(() => {
    if (hasOtpReceived) return;

    const calculateRemaining = () => {
      const created = new Date(createdAt).getTime();
      const expireTime = created + AUTO_CANCEL_MINUTES * 60 * 1000;
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((expireTime - now) / 1000));
      return remaining;
    };

    setSecondsRemaining(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, hasOtpReceived]);

  if (hasOtpReceived || secondsRemaining <= 0) {
    return null;
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const display = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  
  // Show warning color when less than 2 minutes remaining
  const isWarning = secondsRemaining < 120;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${
      isWarning 
        ? "bg-rose-50 text-rose-600 border border-rose-200" 
        : "bg-amber-50 text-amber-600 border border-amber-200"
    }`}>
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="tabular-nums">{display}</span>
    </div>
  );
}
