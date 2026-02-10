import { useEffect } from 'react';
import type { Theme } from '@/types/settings';

/**
 * Applies theme to document.documentElement. When theme is 'system',
 * subscribes to prefers-color-scheme and re-applies on change.
 * Use in a single place (e.g. ProtectedAppRoutes) so theme is applied once per app.
 */
export function useThemeEffect(theme: Theme): void {
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      } else {
        root.classList.toggle('dark', theme === 'dark');
      }
    };
    apply();
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [theme]);
}
