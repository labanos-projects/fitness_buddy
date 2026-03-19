import { useState } from 'react';
import exercises from '../data/exercises.json';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://labanos.dk';
const EXERCISE_MAP = Object.fromEntries(exercises.map(e => [e.id, e]));

const EXAMPLE_PROMPTS = [
  '20 min yoga for lower back pain',
  'Quick 10 min HIIT before work',
  'Full body stretch after a long run',
  '15 min core workout, no jumping',
];

// ─── Compose screen ───────────────────────────────────────────────────────────
function ComposeScreen({ onGenerated, onBack }) {
  const [prompt, setPrompt]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handleCompose = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/compose-workout.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Request failed');
      }
      const data = await res.json();
      data.id = 'ai-' + Date.now();
      onGenerated(data);
    } catch (err) {
      setError('Couldn\'t generate a workout — ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-composer">
      <button className="back-btn" onClick={onBack}>← Back</button>

      <div className="ai-composer-header">
        <h1>AI <span>Composer</span></h1>
        <p>Describe the workout you want and I’ll build it for you.</p>
      </div>

      <div className="ai-composer-input-area">
        <textarea
          className="ai-prompt-input"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g. 20 min yoga for lower back pain…"
          rows={3}
          disabled={loading}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCompose(); }
          }}
        />
        <button
          className="btn btn-primary"
          onClick={handleCompose}
          disabled={loading || !prompt.trim()}
        >
          {loading ? 'Building workout…' : 'Build Workout'}
        </button>
        {error && <p className="ai-error">{error}</p>}
      </div>

      <div className="ai-examples">
        <p className="ai-examples-label">Try one of these:</p>
        <div className="ai-example-chips">
          {EXAMPLE_PROMPTS.map(ex => (
            <button key={ex} className="ai-chip" onClick={() => setPrompt(ex)} disabled={loading}>
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Workout editor / preview screen ───────────────────────────────────────────
function WorkoutEditor({ routine, onStart, onBack }) {
  const [name, setName]               = useState(routine.name || 'AI Workout');
  const [workDuration, setWorkDuration] = useState(routine.workDuration || 30);
  const [restDuration, setRestDuration] = useState(routine.restDuration || 10);
  const [exerciseIds, setExerciseIds]   = useState(routine.exercises || []);
  const [showAddPanel, setShowAddPanel] = useState(false);

  const totalSec = exerciseIds.length * workDuration
    + Math.max(0, exerciseIds.length - 1) * restDuration;
  const totalMin = Math.ceil(totalSec / 60);

  const moveUp   = i => { if (i === 0) return; const a = [...exerciseIds]; [a[i-1],a[i]]=[a[i],a[i-1]]; setExerciseIds(a); };
  const moveDown = i => { if (i === exerciseIds.length-1) return; const a=[...exerciseIds]; [a[i],a[i+1]]=[a[i+1],a[i]]; setExerciseIds(a); };
  const remove   = i => setExerciseIds(exerciseIds.filter((_,idx) => idx !== i));
  const add      = id => { setExerciseIds([...exerciseIds, id]); setShowAddPanel(false); };

  const handleStart = () => onStart({
    ...routine, name,
    workDuration: Number(workDuration),
    restDuration: Number(restDuration),
    exercises: exerciseIds,
  });

  return (
    <div className="workout-editor">
      <button className="back-btn" onClick={onBack}>← Edit prompt</button>

      <div className="workout-editor-header">
        <input
          className="workout-name-input"
          value={name}
          onChange={e => setName(e.target.value)}
          aria-label="Workout name"
        />
        <p className="workout-editor-meta">{exerciseIds.length} exercises · ~{totalMin} min</p>
      </div>

      <div className="workout-editor-durations">
        <div className="duration-block">
          <span className="duration-label">Work</span>
          <div className="duration-control">
            <button onClick={() => setWorkDuration(d => Math.max(10, d - 5))}>-</button>
            <span>{workDuration}s</span>
            <button onClick={() => setWorkDuration(d => Math.min(120, d + 5))}>+</button>
          </div>
        </div>
        <div className="duration-block">
          <span className="duration-label">Rest</span>
          <div className="duration-control">
            <button onClick={() => setRestDuration(d => Math.max(5, d - 5))}>-</button>
            <span>{restDuration}s</span>
            <button onClick={() => setRestDuration(d => Math.min(60, d + 5))}>+</button>
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
                <button onClick={() => moveUp(i)}   disabled={i === 0}                    aria-label="Move up">↑</button>
                <button onClick={() => moveDown(i)} disabled={i === exerciseIds.length-1} aria-label="Move down">↓</button>
                <button onClick={() => remove(i)}   className="editor-remove"             aria-label="Remove">✕</button>
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

      <button
        className="btn btn-accent"
        onClick={handleStart}
        disabled={exerciseIds.length === 0}
      >
        Start Workout
      </button>
    </div>
  );
}

// ─── Root export ───────────────────────────────────────────────────────────────
export default function AiComposer({ onStartRoutine, onBack }) {
  const [routine, setRoutine] = useState(null);

  if (routine) {
    return (
      <WorkoutEditor
        routine={routine}
        onStart={onStartRoutine}
        onBack={() => setRoutine(null)}
      />
    );
  }

  return <ComposeScreen onGenerated={setRoutine} onBack={onBack} />;
}
