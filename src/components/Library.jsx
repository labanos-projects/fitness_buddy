import { useState } from 'react';
import exercises from '../data/exercises.json';
import ExerciseAnimation from './ExerciseAnimation';
import LoginModal from './LoginModal';
import useAuth from '../hooks/useAuth';
import useIllustrations, { clearCache } from '../hooks/useIllustrations';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://labanos.dk/fitnessbuddy';
const sorted = [...exercises].sort((a, b) => a.name.localeCompare(b.name));

function EditPanel({ exerciseId, token, onRegenerated }) {
  const { frames } = useIllustrations(exerciseId);
  const currentPrompt = frames?.[0]?.prompt_used || '';

  const [expanded, setExpanded] = useState(false);
  const [prompt, setPrompt] = useState('');
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
      const res = await fetch(`${API_BASE}/regenerate.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ exercise_id: exerciseId, prompt: prompt.trim() }),
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

function LibraryCard({ exercise, user }) {
  const [version, setVersion] = useState(0);

  const handleRefreshed = () => setVersion((v) => v + 1);

  return (
    <div className="library-card">
      <div className="library-card-illustration">
        <ExerciseAnimation key={`${exercise.id}-${version}`} exerciseId={exercise.id} />
      </div>
      <div className="library-card-info">
        <h3>{exercise.name}</h3>
        <span className="library-tag">{exercise.category}</span>
        <p>{exercise.description}</p>
        {user && <EditPanel exerciseId={exercise.id} token={user.token} onRegenerated={handleRefreshed} />}
      </div>
    </div>
  );
}

export default function Library({ onBack }) {
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="library">
      <div className="library-header">
        <button className="btn btn-secondary btn-small" onClick={onBack}>
          ← Back
        </button>
        <h1>Exercise Library</h1>
        <p>{sorted.length} exercises</p>
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

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
