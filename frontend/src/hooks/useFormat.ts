import { useSettings } from './useSettings';
import { formatCurrency as formatCurrencyUtil, formatDate as formatDateUtil } from '@/lib/utils';

/**
 * Hook that provides format functions with settings from context
 */
export function useFormat() {
  const { settings } = useSettings();

  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount, settings.currency);
  };

  const formatDate = (date: Date | string) => {
    return formatDateUtil(date, settings.dateFormat);
  };

  return { formatCurrency, formatDate };
}
