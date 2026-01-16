import { useContext } from 'react';
import { AppContext } from '@/context/AppContext';

export function useSettings() {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error('useSettings must be used within AppProvider');
  }
  
  return {
    settings: context.settings,
    updateSettings: context.updateSettings,
  };
}
