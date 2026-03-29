import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/expenseApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate user from JWT on mount
  useEffect(() => {
    const token = localStorage.getItem('rf_token');
    if (token) {
      authApi
        .me()
        .then((res) => setUser(res.data.data || res.data))
        .catch(() => localStorage.removeItem('rf_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    const token = res.data.token || res.data.data?.token;
    if (token) {
      localStorage.setItem('rf_token', token);
      // Fetch user profile
      const me = await authApi.me();
      setUser(me.data.data || me.data);
    }
    return res.data;
  }, []);

  const companySignup = useCallback(async (payload) => {
    const res = await authApi.companySignup(payload);
    const token = res.data.token || res.data.data?.token;
    if (token) {
      localStorage.setItem('rf_token', token);
      const me = await authApi.me();
      setUser(me.data.data || me.data);
    }
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('rf_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, companySignup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
