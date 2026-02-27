import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import type { Theme } from '@/types/settings';
import type { BalanceDisplayColor } from '@/types/settings';
import { ACCENT_PALETTE } from '@/lib/themePalette';

/**
 * Syncs BMe theme preference to next-themes (class on document) and applies accent palette to --primary/--primary-foreground.
 * Use in a single place (e.g. ProtectedAppRoutes) so theme is applied once per app.
 */
export function useThemeEffect(theme: Theme, accentColor: BalanceDisplayColor): void {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const isDark =
        theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
          : theme === 'dark';
      const palette = ACCENT_PALETTE[accentColor][isDark ? 'dark' : 'light'];
      root.style.setProperty('--primary', palette.primary);
      root.style.setProperty('--primary-foreground', palette.primaryForeground);
      root.style.setProperty('--sidebar-primary', palette.primary);
      root.style.setProperty('--sidebar-primary-foreground', palette.primaryForeground);
    };
    apply();
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [theme, accentColor]);
}
