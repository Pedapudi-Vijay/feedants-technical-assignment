import { useEffect, useState } from 'react';

/**
 * Ticks every second toward `targetDate`. Returns both the raw remaining
 * milliseconds and a pre-formatted "01d : 06h : 28m : 32s" string matching
 * the design. Returns null/expired once the target has passed, so the UI can
 * react (e.g. re-fetch competition details to pick up the new lifecycle stage).
 */
export function useCountdown(targetDate) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!targetDate) return undefined;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate) {
    return { remainingMs: null, formatted: null, expired: false };
  }

  const target = new Date(targetDate).getTime();
  const remainingMs = Math.max(target - now, 0);
  const expired = remainingMs <= 0 && target - now <= 0;

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');
  const formatted = `${pad(days)}d : ${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;

  return { remainingMs, formatted, expired: remainingMs === 0 };
}
