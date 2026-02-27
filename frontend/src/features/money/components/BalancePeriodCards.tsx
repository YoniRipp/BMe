import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { BalancePeriod, PeriodBalance } from '../useBalanceByPeriod';

const PERIOD_STYLES: Record<
  BalancePeriod,
  { label: string; gradient: string; ring: string }
> = {
  daily: { label: 'Daily Balance', gradient: 'from-blue-50 to-blue-100', ring: 'ring-blue-500' },
  weekly: { label: 'Weekly Balance', gradient: 'from-purple-50 to-purple-100', ring: 'ring-purple-500' },
  monthly: { label: 'Monthly Balance', gradient: 'from-emerald-50 to-green-50', ring: 'ring-green-500' },
  yearly: { label: 'Yearly Balance', gradient: 'from-orange-50 to-orange-100', ring: 'ring-orange-500' },
};

interface BalancePeriodCardsProps {
  balances: {
    daily: PeriodBalance;
    weekly: PeriodBalance;
    monthly: PeriodBalance;
    yearly: PeriodBalance;
  };
  displayCurrency?: string;
  selectedPeriod: BalancePeriod;
  onSelectPeriod: (period: BalancePeriod) => void;
}

export function BalancePeriodCards({
  balances,
  displayCurrency = 'USD',
  selectedPeriod,
  onSelectPeriod,
}: BalancePeriodCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((period) => {
        const style = PERIOD_STYLES[period];
        const b = balances[period];
        const isSelected = selectedPeriod === period;
        return (
          <Card
            key={period}
            className={`p-4 bg-gradient-to-br ${style.gradient} cursor-pointer transition-all hover:scale-105 ${
              isSelected ? `ring-2 ${style.ring} shadow-lg` : ''
            }`}
            onClick={() => onSelectPeriod(period)}
          >
            <h3 className="text-sm text-muted-foreground mb-2">{style.label}</h3>
            <p
              className={`text-2xl font-bold mb-3 ${
                b.balance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(b.balance, displayCurrency)}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Income</p>
                <p className="font-semibold text-green-600">{formatCurrency(b.income, displayCurrency)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Expenses</p>
                <p className="font-semibold text-red-600">{formatCurrency(b.expenses, displayCurrency)}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
