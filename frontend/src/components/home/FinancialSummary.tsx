import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface FinancialSummaryProps {
  balance: number;
  income: number;
  expenses: number;
}

export function FinancialSummary({ balance, income, expenses }: FinancialSummaryProps) {
  return (
    <Card className="p-6">
      <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
      <p className="text-2xl font-bold mb-4">{formatCurrency(balance)}</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-muted">
            <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Income</p>
            <p className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(income)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-muted">
            <ArrowDownRight className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="font-semibold">{formatCurrency(expenses)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
