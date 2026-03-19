import { useState } from 'react';
import WorkoutEditor from './WorkoutEditor';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://labanos.dk';

const EXAMPLE_PROMPTS = [
  '20 min yoga for lower back pain',
  'Quick 10 min HIIT before work',
  'Full body stretch after a long run',
  '15 min core workout, no jumping',
];

export default function AiComposer({ onStartRoutine, onSave, onBack }) {
  const [routine, setRoutine] = useState(null);
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
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Request failed');
      }
      const data = await res.json();
      data.id = 'ai-' + Date.now();
      setRoutine(data);
    } catch (err) {
      setError('Couldn\'t generate a workout — ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (routine) {
    return (
      <WorkoutEditor
        routine={routine}
        onStart={onStartRoutine}
        onSave={onSave}
        onBack={() => setRoutine(null)}
      />
    );
  }

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
