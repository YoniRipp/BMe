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
    <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
      <p className="text-sm opacity-90 mb-1">Current Balance</p>
      <h2 className="text-4xl font-bold mb-4">{formatCurrency(balance)}</h2>
      
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-white/20">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs opacity-75">Income</p>
            <p className="font-semibold">{formatCurrency(income)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-white/20">
            <ArrowDownRight className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs opacity-75">Expenses</p>
            <p className="font-semibold">{formatCurrency(expenses)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
