import { useState } from 'react';
import Home from './components/Home';
import Workout from './components/Workout';
import Complete from './components/Complete';
import Library from './components/Library';
import AiComposer from './components/AiComposer';
import WorkoutEditor from './components/WorkoutEditor';
import useSavedRoutines from './hooks/useSavedRoutines';
import useCustomExercises from './hooks/useCustomExercises';
import { noSleep } from './hooks/useWakeLock';
import './styles/App.css';

export default function App() {
  const [screen, setScreen]               = useState('home');
  const [activeRoutine, setActiveRoutine] = useState(null);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const { saved, saveRoutine, deleteRoutine } = useSavedRoutines();
  const { customExercises, addExercises }     = useCustomExercises();

  const handleStart = (routine) => {
    // Enable wake lock here — we're inside a user gesture (RoutineCard onClick),
    // which is required by iOS Safari's autoplay/media policy.
    noSleep.enable().catch(() => {});
    setActiveRoutine(routine);
    setScreen('workout');
  };

  const handleHome = () => {
    // Release wake lock when leaving the workout screen.
    try { noSleep.disable(); } catch (e) {}
    setActiveRoutine(null);
    setEditingRoutine(null);
    setScreen('home');
  };

  // Open the editor for any routine.
  // Built-in routines get a prefixed id so saving creates a new custom entry.
  const handleEdit = (routine) => {
    const toEdit = routine.isCustom
      ? routine
      : { ...routine, id: 'custom-' + routine.id };
    setEditingRoutine(toEdit);
    setScreen('edit');
  };

  return (
    <>
      {screen === 'home' && (
        <Home
          onStartRoutine={handleStart}
          onOpenLibrary={() => setScreen('library')}
          onOpenComposer={() => setScreen('compose')}
          onEditRoutine={handleEdit}
          savedRoutines={saved}
        />
      )}

      {screen === 'library' && (
        <Library onBack={handleHome} customExercises={customExercises} />
      )}

      {screen === 'compose' && (
        <AiComposer
          onStartRoutine={handleStart}
          onSave={saveRoutine}
          onBack={handleHome}
          onAddExercises={addExercises}
          customExercises={customExercises}
        />
      )}

      {screen === 'edit' && editingRoutine && (
        <WorkoutEditor
          routine={editingRoutine}
          onStart={handleStart}
          onSave={(r) => { saveRoutine(r); handleHome(); }}
          onDelete={editingRoutine.isCustom ? (id) => { deleteRoutine(id); handleHome(); } : undefined}
          onBack={handleHome}
          customExercises={customExercises}
        />
      )}

      {screen === 'workout' && (
        <Workout
          routine={activeRoutine}
          onComplete={() => setScreen('complete')}
          onQuit={handleHome}
          customExercises={customExercises}
        />
      )}

      {screen === 'complete' && (
        <Complete routine={activeRoutine} onHome={handleHome} />
      )}
    </>
  );
}
