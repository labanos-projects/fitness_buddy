import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useEffect, useState } from 'react';
import '../styles/animations.css';

/**
 * Rive-powered exercise animation.
 *
 * Expects a single .riv file (fitness-buddy.riv) with:
 *   - One artboard per exercise (artboard name = exercise id)
 *   - Each artboard has a State Machine called "Controller"
 *   - The state machine auto-plays the looping exercise animation
 *
 * This keeps everything in one file — easy to manage, tiny download.
 *
 * For exercises not yet in the .riv file, we show a placeholder.
 */

const RIV_FILE = '/fitness-buddy.riv';

function RiveExercise({ exerciseId }) {
  const { rive, RiveComponent } = useRive({
    src: RIV_FILE,
    artboard: exerciseId,
    stateMachines: 'Controller',
    autoplay: true,
  });

  return (
    <div className="exercise-animation">
      <RiveComponent style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

function Placeholder({ exerciseId }) {
  // Simple text placeholder until Rive animations are ready
  const icons = {
    'jumping-jacks': '🤸',
    'wall-sit': '🧱',
    'push-ups': '💪',
    'crunches': '🫃',
    'step-ups': '⬆️',
    'squats': '🦵',
    'tricep-dips': '💺',
    'plank': '🪵',
    'high-knees': '🏃',
    'lunges': '🦿',
    'push-up-rotation': '🔄',
    'side-plank': '⚖️',
  };

  return (
    <div className="exercise-animation placeholder">
      <div className="placeholder-icon">{icons[exerciseId] || '🏋️'}</div>
    </div>
  );
}

export default function ExerciseAnimation({ exerciseId }) {
  // Check if .riv file is available — if not, show placeholder
  // We try to load it; if it fails, the placeholder is shown
  const [rivAvailable, setRivAvailable] = useState(null);

  useEffect(() => {
    fetch(RIV_FILE, { method: 'HEAD' })
      .then((res) => setRivAvailable(res.ok))
      .catch(() => setRivAvailable(false));
  }, []);

  if (rivAvailable === null) return <div className="exercise-animation" />;
  if (!rivAvailable) return <Placeholder exerciseId={exerciseId} />;

  return <RiveExercise exerciseId={exerciseId} />;
}
