import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Monitor } from 'lucide-react';
import type { Theme } from '@/types/settings';

const THEME_ICONS: Record<Theme, React.ReactNode> = {
  light: <Sun className="w-4 h-4" />,
  dark: <Moon className="w-4 h-4" />,
  system: <Monitor className="w-4 h-4" />,
};

export function ThemeToggle() {
  const { settings, updateSettings } = useSettings();

  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(settings.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    updateSettings({ theme: themes[nextIndex] });
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      aria-label={`Current theme: ${settings.theme}. Click to cycle theme.`}
    >
      {THEME_ICONS[settings.theme]}
    </Button>
  );
}
