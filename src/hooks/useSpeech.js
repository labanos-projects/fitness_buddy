import { useCallback } from 'react';

export default function useSpeech() {
  const speak = useCallback((text, options = {}) => {
    if (typeof window === 'undefined' || !text) return;
    const synth = window.speechSynthesis;
    if (!synth) return;

    const {
      rate = 1.0,
      pitch = 1.0,
      volume = 0.9,
    } = options;

    try {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      synth.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis failed', err);
    }
  }, []);

  return { speak };
}
