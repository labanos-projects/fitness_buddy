import { useState, useCallback } from 'react';
import builtInExercises from '../data/exercises.json';

const KEY = 'fb_custom_exercises';
const BUILT_IN_IDS = new Set(builtInExercises.map(e => e.id));

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function persist(list) { localStorage.setItem(KEY, JSON.stringify(list)); }

export default function useCustomExercises() {
  const [customExercises, setCustomExercises] = useState(load);

  // Merge a list of new exercises, skipping any IDs that already exist
  const addExercises = useCallback((newOnes) => {
    if (!newOnes?.length) return;
    setCustomExercises(prev => {
      const existingIds = new Set([...BUILT_IN_IDS, ...prev.map(e => e.id)]);
      const toAdd = newOnes.filter(e => e?.id && !existingIds.has(e.id));
      if (!toAdd.length) return prev;
      const next = [...prev, ...toAdd];
      persist(next);
      return next;
    });
  }, []);

  return { customExercises, addExercises };
}
