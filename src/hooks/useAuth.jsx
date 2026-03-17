import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://labanos.dk/fitnessbuddy';
const TOKEN_KEY = 'fb_auth_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check stored token on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setLoading(false); return; }

    fetch(`${API_BASE}/auth.php`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.id) setUser({ ...data, token });
        else localStorage.removeItem(TOKEN_KEY);
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_BASE}/auth.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      fetch(`${API_BASE}/auth.php?_method=DELETE`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default function useAuth() {
  return useContext(AuthContext);
}
