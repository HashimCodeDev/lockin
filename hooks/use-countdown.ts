"use client";

import { useEffect, useMemo, useState } from "react";

function getCountdown(targetDate: string) {
  const now = Date.now();
  const target = new Date(targetDate).getTime();
  const diff = Math.max(target - now, 0);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, totalMs: diff };
}

export function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState(() => getCountdown(targetDate));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft(getCountdown(targetDate));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [targetDate]);

  const isUrgent = useMemo(() => timeLeft.totalMs <= 7 * 24 * 60 * 60 * 1000, [timeLeft.totalMs]);

  return { ...timeLeft, isUrgent };
}
