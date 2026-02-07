export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
export type Units = 'metric' | 'imperial';
export type Theme = 'light' | 'dark' | 'system';

export interface AppSettings {
  currency: Currency;
  dateFormat: DateFormat;
  units: Units;
  theme: Theme;
}

export const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
export const DATE_FORMATS: { value: DateFormat; label: string }[] = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
];
export const THEMES: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export const DEFAULT_SETTINGS: AppSettings = {
  currency: 'USD',
  dateFormat: 'DD/MM/YYYY',
  units: 'metric',
  theme: 'system',
};
