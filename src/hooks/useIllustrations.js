import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://labanos.dk/fitnessbuddy';
const cache = {};

export function clearCache(exerciseId) {
  if (exerciseId) delete cache[exerciseId];
  else Object.keys(cache).forEach((k) => delete cache[k]);
}

export default function useIllustrations(exerciseId) {
  const [frames, setFrames] = useState(cache[exerciseId]?.frames || null);
  const [loading, setLoading] = useState(!cache[exerciseId]);

  useEffect(() => {
    if (!exerciseId) return;
    if (cache[exerciseId]) {
      setFrames(cache[exerciseId].frames);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`${API_BASE}/illustrations.php?exercise_id=${encodeURIComponent(exerciseId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const f = data?.frames?.length ? data.frames : null;
        cache[exerciseId] = { frames: f };
        setFrames(f);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          cache[exerciseId] = { frames: null };
          setFrames(null);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [exerciseId]);

  return { frames, loading };
}
