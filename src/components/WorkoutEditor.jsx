import { useState } from 'react';
import exercises from '../data/exercises.json';

const EXERCISE_MAP = Object.fromEntries(exercises.map(e => [e.id, e]));

export default function WorkoutEditor({ routine, onStart, onSave, onDelete, onBack }) {
  const [name, setName]                 = useState(routine.name || 'My Workout');
  const [workDuration, setWorkDuration] = useState(routine.workDuration || 30);
  const [restDuration, setRestDuration] = useState(routine.restDuration || 10);
  const [exerciseIds, setExerciseIds]   = useState(routine.exercises || []);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [saveState, setSaveState]       = useState('idle'); // idle | saved

  const totalSec = exerciseIds.length * workDuration
    + Math.max(0, exerciseIds.length - 1) * restDuration;
  const totalMin = Math.ceil(totalSec / 60);

  const touch = () => setSaveState('idle');

  const moveUp   = i => { if (i === 0) return; const a=[...exerciseIds]; [a[i-1],a[i]]=[a[i],a[i-1]]; setExerciseIds(a); touch(); };
  const moveDown = i => { if (i===exerciseIds.length-1) return; const a=[...exerciseIds]; [a[i],a[i+1]]=[a[i+1],a[i]]; setExerciseIds(a); touch(); };
  const remove   = i => { setExerciseIds(exerciseIds.filter((_,idx)=>idx!==i)); touch(); };
  const add      = id => { setExerciseIds([...exerciseIds, id]); setShowAddPanel(false); touch(); };

  const edited = () => ({
    ...routine,
    name: name.trim() || 'My Workout',
    workDuration: Number(workDuration),
    restDuration: Number(restDuration),
    exercises: exerciseIds,
  });

  const handleSave = () => {
    onSave(edited());
    setSaveState('saved');
  };

  const handleStart = () => onStart(edited());

  return (
    <div className="workout-editor">

      <div className="workout-editor-topbar">
        <button className="back-btn" onClick={onBack}>← Back</button>
        {onDelete && (
          <button className="editor-delete-btn" onClick={() => onDelete(routine.id)}>
            Delete
          </button>
        )}
      </div>

      <div className="workout-editor-header">
        <input
          className="workout-name-input"
          value={name}
          onChange={e => { setName(e.target.value); touch(); }}
          aria-label="Workout name"
        />
        <p className="workout-editor-meta">{exerciseIds.length} exercises · ~{totalMin} min</p>
      </div>

      <div className="workout-editor-durations">
        <div className="duration-block">
          <span className="duration-label">Work</span>
          <div className="duration-control">
            <button onClick={() => { setWorkDuration(d => Math.max(10, d-5)); touch(); }}>-</button>
            <span>{workDuration}s</span>
            <button onClick={() => { setWorkDuration(d => Math.min(120, d+5)); touch(); }}>+</button>
          </div>
        </div>
        <div className="duration-block">
          <span className="duration-label">Rest</span>
          <div className="duration-control">
            <button onClick={() => { setRestDuration(d => Math.max(5, d-5)); touch(); }}>-</button>
            <span>{restDuration}s</span>
            <button onClick={() => { setRestDuration(d => Math.min(60, d+5)); touch(); }}>+</button>
          </div>
        </div>
      </div>

      <div className="workout-editor-list">
        {exerciseIds.map((id, i) => {
          const ex = EXERCISE_MAP[id];
          return (
            <div key={`${id}-${i}`} className="editor-row">
              <span className="editor-row-num">{i + 1}</span>
              <div className="editor-row-info">
                <p className="editor-row-name">{ex?.name || id}</p>
                <span className="library-tag">{ex?.category}</span>
              </div>
              <div className="editor-row-actions">
                <button onClick={() => moveUp(i)}   disabled={i===0}                    aria-label="Move up">↑</button>
                <button onClick={() => moveDown(i)} disabled={i===exerciseIds.length-1} aria-label="Move down">↓</button>
                <button onClick={() => remove(i)}   className="editor-remove"           aria-label="Remove">✕</button>
              </div>
            </div>
          );
        })}
      </div>

      {showAddPanel ? (
        <div className="editor-add-panel">
          <p className="ai-examples-label">Pick an exercise to add:</p>
          <div className="editor-add-grid">
            {exercises.map(ex => (
              <button key={ex.id} className="ai-chip" onClick={() => add(ex.id)}>
                {ex.name}
              </button>
            ))}
          </div>
          <button className="back-btn" style={{marginTop:'0.5rem'}} onClick={() => setShowAddPanel(false)}>Cancel</button>
        </div>
      ) : (
        <button className="editor-add-btn" onClick={() => setShowAddPanel(true)}>+ Add exercise</button>
      )}

      <div className="workout-editor-actions">
        <button
          className="btn btn-secondary"
          onClick={handleSave}
          disabled={exerciseIds.length === 0}
        >
          {saveState === 'saved' ? '✓ Saved!' : '💾 Save'}
        </button>
        <button
          className="btn btn-accent"
          onClick={handleStart}
          disabled={exerciseIds.length === 0}
        >
          Start
        </button>
      </div>
    </div>
  );
}
