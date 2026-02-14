import type { BalanceDisplayColor } from '@/types/settings';

/**
 * HSL values for --primary and --primary-foreground per accent and mode.
 * Format: "H S% L%" (no "hsl()" wrapper; Tailwind/CSS use these with hsl(var(--primary))).
 */
export interface PrimaryPalette {
  primary: string;
  primaryForeground: string;
}

export const ACCENT_PALETTE: Record<
  BalanceDisplayColor,
  { light: PrimaryPalette; dark: PrimaryPalette }
> = {
  green: {
    light: { primary: '138 15% 54%', primaryForeground: '0 0% 100%' },
    dark: { primary: '130 16% 42%', primaryForeground: '0 0% 100%' },
  },
  blue: {
    light: { primary: '221 83% 53%', primaryForeground: '0 0% 100%' },
    dark: { primary: '217 91% 60%', primaryForeground: '222.2 47.4% 11.2%' },
  },
  neutral: {
    light: { primary: '222.2 47.4% 11.2%', primaryForeground: '210 40% 98%' },
    dark: { primary: '210 40% 98%', primaryForeground: '222.2 47.4% 11.2%' },
  },
  primary: {
    light: { primary: '262 83% 58%', primaryForeground: '0 0% 100%' },
    dark: { primary: '263 70% 65%', primaryForeground: '222.2 47.4% 11.2%' },
  },
};
