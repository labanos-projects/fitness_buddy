import { useRef, useEffect, useCallback } from 'react';

export default function useAudioCue() {
  const audioContextRef = useRef(null);

  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((options = {}) => {
    const {
      duration = 0.15,
      frequency = 880,
      volume = 0.15,
    } = options;

    const ctx = getAudioContext();
    if (!ctx) return;

    const startTone = async () => {
      if (ctx.state === 'suspended') {
        try {
          await ctx.resume();
        } catch (err) {
          console.warn('Unable to resume audio context', err);
          return;
        }
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gainNode.gain.value = volume;

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      const now = ctx.currentTime;
      oscillator.start(now);
      gainNode.gain.setValueAtTime(volume, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
      oscillator.stop(now + duration);
    };

    startTone();
  }, [getAudioContext]);

  const playCountdownTick = useCallback(() => {
    playTone({ frequency: 900, duration: 0.12 });
  }, [playTone]);

  const playPhaseTransition = useCallback(() => {
    playTone({ frequency: 520, duration: 0.22, volume: 0.2 });
  }, [playTone]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  return { playCountdownTick, playPhaseTransition };
}
