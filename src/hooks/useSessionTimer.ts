import { useState, useEffect, useRef } from 'react';

function formatTime(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function useSessionTimer(startTime: string | null) {
  const getElapsed = () => {
    if (!startTime) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
  };

  const [seconds, setSeconds] = useState(getElapsed);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!startTime) {
      setSeconds(0);
      return;
    }

    setSeconds(getElapsed());

    intervalRef.current = setInterval(() => {
      setSeconds(getElapsed());
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTime]);

  return {
    seconds,
    display: formatTime(seconds),
  };
}
