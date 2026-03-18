import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://labanos.dk';
const cache = {};
const pending = {};

export function clearCache(exerciseId) {
  if (exerciseId) {
    delete cache[exerciseId];
    delete pending[exerciseId];
  } else {
    Object.keys(cache).forEach((k) => delete cache[k]);
    Object.keys(pending).forEach((k) => delete pending[k]);
  }
}

export default function useIllustrations(exerciseId) {
  const [data, setData] = useState(cache[exerciseId] || { frames: null, prompt: '' });
  const [loading, setLoading] = useState(!cache[exerciseId]);

  useEffect(() => {
    if (!exerciseId) return;
    if (cache[exerciseId]) {
      setData(cache[exerciseId]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    if (!pending[exerciseId]) {
      pending[exerciseId] = fetch(
        `${API_BASE}/illustrations.php?exercise_id=${encodeURIComponent(exerciseId)}&meta=1`,
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((payload) => {
          const frames = payload?.frames?.length ? payload.frames : null;
          const result = { frames, prompt: payload?.prompt_used || '' };
          cache[exerciseId] = result;
          return result;
        })
        .catch(() => ({ frames: null, prompt: '' }))
        .finally(() => {
          delete pending[exerciseId];
        });
    }

    pending[exerciseId].then((result) => {
      if (cancelled) return;
      setData(result);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [exerciseId]);

  return { frames: data.frames, prompt: data.prompt, loading };
}
