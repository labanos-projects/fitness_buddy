import { useState, useCallback } from 'react';

const KEY = 'fb_saved_routines';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

function persist(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export default function useSavedRoutines() {
  const [saved, setSaved] = useState(load);

  const saveRoutine = useCallback((routine) => {
    setSaved(prev => {
      const idx = prev.findIndex(r => r.id === routine.id);
      const entry = { ...routine, savedAt: Date.now(), isCustom: true };
      const next = idx >= 0
        ? prev.map((r, i) => i === idx ? entry : r)
        : [...prev, entry];
      persist(next);
      return next;
    });
  }, []);

  const deleteRoutine = useCallback((id) => {
    setSaved(prev => {
      const next = prev.filter(r => r.id !== id);
      persist(next);
      return next;
    });
  }, []);

  return { saved, saveRoutine, deleteRoutine };
}
