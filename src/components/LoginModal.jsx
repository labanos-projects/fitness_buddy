import { useState } from 'react';
import useAuth from '../hooks/useAuth';

export default function LoginModal({ onClose }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>🔐 Login</h2>
        <p className="modal-subtitle">Use your InvestTracker account</p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="modal-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary btn-small" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-small" disabled={busy}>
              {busy ? 'Logging in…' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
