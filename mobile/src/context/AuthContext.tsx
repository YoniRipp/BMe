import React, { createContext, useCallback, useEffect, useState } from 'react';
import { User } from '../types/user';
import { authApi } from '../core/api/auth';
import { getToken, setToken, setOnUnauthorized } from '../core/api/client';

interface AuthContextType {
  user: User | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loadUser: () => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
}

function apiUserToUser(a: { id: string; email: string; name: string; role: 'admin' | 'user'; createdAt?: string }): User {
  return {
    id: a.id,
    email: a.email,
    name: a.name,
    role: a.role,
    createdAt: a.createdAt,
  };
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setUser(null);
      setAuthLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(apiUserToUser(me));
    } catch {
      await setToken(null);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null);
    });
    return () => setOnUnauthorized(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    await setToken(res.token);
    setUser(apiUserToUser(res.user));
  }, []);

  const logout = useCallback(() => {
    void setToken(null);
    setUser(null);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const res = await authApi.register(email, password, name);
    await setToken(res.token);
    setUser(apiUserToUser(res.user));
  }, []);

  return (
    <AuthContext.Provider value={{ user, authLoading, login, loadUser, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = React.useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
