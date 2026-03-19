import { useState, useEffect } from 'react';
import builtInExercises from '../data/exercises.json';
import ExerciseAnimation from './ExerciseAnimation';
import LoginModal from './LoginModal';
import useAuth from '../hooks/useAuth';
import useIllustrations, { clearCache } from '../hooks/useIllustrations';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://labanos.dk';
const sorted = [...builtInExercises].sort((a, b) => a.name.localeCompare(b.name));

// Cache models list across all EditPanels
let modelsCache = null;

function useModels(token) {
  const [models, setModels] = useState(modelsCache?.models || []);
  const [loading, setLoading] = useState(!modelsCache);

  useEffect(() => {
    if (!token || modelsCache) {
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/models.php`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const m = data?.models || [];
        modelsCache = { models: m };
        setModels(m);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  return { models, loading };
}

function EditPanel({ exerciseId, token, onRegenerated }) {
  const { prompt: currentPrompt } = useIllustrations(exerciseId);
  const { models } = useModels(token);

  const [expanded, setExpanded] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const toggleExpanded = () => {
    if (!expanded) {
      setPrompt(currentPrompt || '');
    }
    setExpanded((prev) => !prev);
    setError('');
  };

  const handleRegenerate = async () => {
    if (!prompt.trim()) return;
    setBusy(true);
    setError('');
    try {
      const body = {
        exercise_id: exerciseId,
        prompt: prompt.trim(),
      };
      if (model) body.model = model;

      const res = await fetch(`${API_BASE}/regenerate.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed (${res.status})`);
      }
      clearCache(exerciseId);
      onRegenerated?.();
      setExpanded(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="edit-panel">
      <button className="btn btn-secondary btn-tiny" onClick={toggleExpanded}>
        {expanded ? '✕ Close' : '✏️ Edit Prompt'}
      </button>
      {expanded && (
        <div className="edit-panel-body">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={8}
            placeholder={currentPrompt ? 'Update the prompt…' : 'Describe the illustration…'}
          />
          <div className="edit-model-row">
            <label htmlFor={`model-${exerciseId}`}>Model:</label>
            <select
              id={`model-${exerciseId}`}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="edit-model-select"
            >
              <option value="">Default (gemini-2.5-flash-image)</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}
                </option>
              ))}
            </select>
          </div>
          <p className="edit-hint">
            Standard character style (teal top, dark leggings, ponytail, flat vector) is auto-appended.
          </p>
          {error && <p className="modal-error">{error}</p>}
          <div className="edit-actions">
            <button
              className="btn btn-primary btn-small"
              onClick={handleRegenerate}
              disabled={busy || !prompt.trim()}
            >
              {busy ? '⏳ Generating…' : '🎨 Regenerate'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LibraryCard({ exercise, user, isGenerated = false }) {
  const [version, setVersion] = useState(0);
  const handleRefreshed = () => setVersion((v) => v + 1);

  return (
    <div className={`library-card${isGenerated ? ' library-card-generated' : ''}`}>
      <div className="library-card-illustration">
        <ExerciseAnimation key={`${exercise.id}-${version}`} exerciseId={exercise.id} />
      </div>
      <div className="library-card-info">
        <h3>{exercise.name}</h3>
        <span className={`library-tag${isGenerated ? ' library-tag-new' : ''}`}>
          {isGenerated ? '✨ ' : ''}{exercise.category}
        </span>
        <p>{exercise.description}</p>
        {exercise.muscles?.length > 0 && (
          <p className="library-muscles">
            {Array.isArray(exercise.muscles)
              ? exercise.muscles.join(', ')
              : exercise.muscles}
          </p>
        )}
        {user && !isGenerated && (
          <EditPanel exerciseId={exercise.id} token={user.token} onRegenerated={handleRefreshed} />
        )}
      </div>
    </div>
  );
}

export default function Library({ onBack, customExercises = [] }) {
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const totalCount = sorted.length + customExercises.length;

  return (
    <div className="library">
      <div className="library-header">
        <button className="btn btn-secondary btn-small" onClick={onBack}>
          ← Back
        </button>
        <h1>Exercise Library</h1>
        <p>{totalCount} exercises</p>
        <div className="library-auth">
          {user ? (
            <>
              <span className="auth-user">🔓 {user.name}</span>
              <button className="btn btn-secondary btn-tiny" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <button className="btn btn-secondary btn-tiny" onClick={() => setShowLogin(true)}>
              🔒
            </button>
          )}
        </div>
      </div>

      <div className="library-list">
        {sorted.map((exercise) => (
          <LibraryCard key={exercise.id} exercise={exercise} user={user} />
        ))}
      </div>

      {customExercises.length > 0 && (
        <>
          <div className="library-section-header">
            <h2>✨ Generated Exercises</h2>
            <p>{customExercises.length} AI-invented</p>
          </div>
          <div className="library-list">
            {customExercises.map((exercise) => (
              <LibraryCard key={exercise.id} exercise={exercise} user={user} isGenerated />
            ))}
          </div>
        </>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
