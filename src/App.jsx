import { useState } from 'react';
import Home from './components/Home';
import Workout from './components/Workout';
import Complete from './components/Complete';
import Library from './components/Library';
import AiComposer from './components/AiComposer';
import WorkoutEditor from './components/WorkoutEditor';
import useSavedRoutines from './hooks/useSavedRoutines';
import './styles/App.css';

export default function App() {
  const [screen, setScreen]             = useState('home');
  const [activeRoutine, setActiveRoutine]   = useState(null);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const { saved, saveRoutine, deleteRoutine } = useSavedRoutines();

  const handleStart = (routine) => {
    setActiveRoutine(routine);
    setScreen('workout');
  };

  const handleHome = () => {
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

      {screen === 'library' && <Library onBack={handleHome} />}

      {screen === 'compose' && (
        <AiComposer
          onStartRoutine={handleStart}
          onSave={saveRoutine}
          onBack={handleHome}
        />
      )}

      {screen === 'edit' && editingRoutine && (
        <WorkoutEditor
          routine={editingRoutine}
          onStart={handleStart}
          onSave={(r) => { saveRoutine(r); handleHome(); }}
          onDelete={editingRoutine.isCustom ? (id) => { deleteRoutine(id); handleHome(); } : undefined}
          onBack={handleHome}
        />
      )}

      {screen === 'workout' && (
        <Workout
          routine={activeRoutine}
          onComplete={() => setScreen('complete')}
          onQuit={handleHome}
        />
      )}

      {screen === 'complete' && (
        <Complete routine={activeRoutine} onHome={handleHome} />
      )}
    </>
  );
}
