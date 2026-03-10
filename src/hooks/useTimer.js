import { useState, useRef, useCallback, useEffect } from 'react';

export default function useTimer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const onTickRef = useRef(null);
  const onCompleteRef = useRef(null);

  const start = useCallback((duration, { onTick, onComplete } = {}) => {
    stop();
    setSeconds(duration);
    setIsRunning(true);
    onTickRef.current = onTick || null;
    onCompleteRef.current = onComplete || null;

    let remaining = duration;

    intervalRef.current = setInterval(() => {
      remaining -= 1;
      setSeconds(remaining);
      onTickRef.current?.(remaining);

      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsRunning(false);
        onCompleteRef.current?.();
      }
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setSeconds(0);
  }, []);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    if (!isRunning && seconds > 0) {
      setIsRunning(true);
      let remaining = seconds;

      intervalRef.current = setInterval(() => {
        remaining -= 1;
        setSeconds(remaining);
        onTickRef.current?.(remaining);

        if (remaining <= 0) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsRunning(false);
          onCompleteRef.current?.();
        }
      }, 1000);
    }
  }, [isRunning, seconds]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { seconds, isRunning, start, stop, pause, resume };
}
