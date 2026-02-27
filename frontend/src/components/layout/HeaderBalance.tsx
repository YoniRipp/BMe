import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { BalanceDisplayLayout } from '@/types/settings';

interface HeaderBalanceProps {
  balance: number;
  income: number;
  expenses: number;
  currency: string;
  balanceDisplayLayout: BalanceDisplayLayout;
  loading?: boolean;
}

export function HeaderBalance({
  balance,
  income,
  expenses,
  currency,
  balanceDisplayLayout,
  loading = false,
}: HeaderBalanceProps) {
  if (loading) {
    return (
      <div className="rounded-lg bg-muted/60 px-3 py-1.5">
        <span className="text-sm font-medium text-muted-foreground tabular-nums">—</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-1.5 border border-border/60">
      <span className={cn('text-sm font-semibold tabular-nums', 'text-primary')}>
        {formatCurrency(balance, currency)}
      </span>
      {balanceDisplayLayout === 'with_income_expenses' && (
        <span className="text-xs border-l border-border/80 pl-2 flex items-center gap-2">
          <span className="text-green-600 dark:text-green-400">↑{formatCurrency(income, currency)}</span>
          <span className="text-red-600 dark:text-red-400">↓{formatCurrency(expenses, currency)}</span>
        </span>
      )}
    </div>
  );
}
