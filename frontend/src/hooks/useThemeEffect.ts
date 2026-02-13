import { useEffect } from 'react';
import type { Theme } from '@/types/settings';
import type { BalanceDisplayColor } from '@/types/settings';
import { ACCENT_PALETTE } from '@/lib/themePalette';

/**
 * Applies theme and accent color to document.documentElement. When theme is 'system',
 * subscribes to prefers-color-scheme and re-applies on change.
 * Sets --primary and --primary-foreground from the palette for the current accent and light/dark mode.
 * Use in a single place (e.g. ProtectedAppRoutes) so theme is applied once per app.
 */
export function useThemeEffect(theme: Theme, accentColor: BalanceDisplayColor): void {
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const isDark =
        theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
          : theme === 'dark';
      if (theme === 'system') {
        root.classList.toggle('dark', isDark);
      } else {
        root.classList.toggle('dark', theme === 'dark');
      }
      const palette = ACCENT_PALETTE[accentColor][isDark ? 'dark' : 'light'];
      root.style.setProperty('--primary', palette.primary);
      root.style.setProperty('--primary-foreground', palette.primaryForeground);
    };
    apply();
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [theme, accentColor]);
}
