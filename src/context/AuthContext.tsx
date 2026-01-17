import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@/types/user';
import apiClient from '@/lib/api/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await apiClient.get('/auth/me');
      setUser(response.data.data.user);
    } catch (error) {
      setUser(null);
      localStorage.removeItem('refreshToken');
    }
  }, []);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        await refreshUser();
      } catch (error) {
        // User not authenticated
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [refreshUser]);

  const signUp = async (email: string, password: string, name: string) => {
    const response = await apiClient.post('/auth/signup', {
      email,
      password,
      name,
    });

    if (response.data.data.refreshToken) {
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
    }

    setUser(response.data.data.user);
  };

  const signIn = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });

    if (response.data.data.refreshToken) {
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
    }

    setUser(response.data.data.user);
  };

  const signOut = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}