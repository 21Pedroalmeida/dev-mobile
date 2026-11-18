import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService as defaultAuthService } from '../services/defaultAuth';

const AuthContext = createContext(null);

export function AuthProvider({ children, service = defaultAuthService }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    service
      .restoreSession()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [service]);

  const login = useCallback(async (u, p) => setUser(await service.login(u, p)), [service]);
  const register = useCallback(async (u, p, c) => setUser(await service.register(u, p, c)), [service]);
  const logout = useCallback(async () => {
    await service.logout();
    setUser(null);
  }, [service]);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
