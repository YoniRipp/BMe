import React, { createContext, useContext, useCallback } from 'react';
import { User } from '@/types/user';
import { AppSettings, DEFAULT_SETTINGS } from '@/types/settings';
import { useAuth } from './AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS } from '@/lib/storage';

interface AppContextType {
  user: User | null;
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useLocalStorage<AppSettings>(
    STORAGE_KEYS.SETTINGS,
    DEFAULT_SETTINGS
  );

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, [setSettings]);

  return (
    <AppContext.Provider value={{ user, settings, updateSettings }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
