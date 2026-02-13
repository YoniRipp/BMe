import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { startOfMonth, endOfMonth, isAfter } from 'date-fns';
import { PanelLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useSettings } from '@/hooks/useSettings';
import { useTransactions } from '@/hooks/useTransactions';
import { useExchangeRates } from '@/features/money/useExchangeRates';
import { getGreeting } from '@/lib/utils';
import { HeaderBalance } from './HeaderBalance';
import { Button } from '@/components/ui/button';

interface TopBarProps {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export function TopBar({ sidebarOpen, onSidebarToggle }: TopBarProps) {
  const { user } = useApp();
  const { settings } = useSettings();
  const { transactions, transactionsLoading } = useTransactions();
  const displayCurrency = settings.currency;
  const fromCurrencies = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.currency ?? 'USD'))),
    [transactions]
  );
  const { convertToDisplay } = useExchangeRates(displayCurrency, fromCurrencies);
  const greeting = getGreeting();

  const { balance, income, expenses } = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    const monthly = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return isAfter(tDate, monthStart) && isAfter(monthEnd, tDate);
    });
    const monthlyIncome = monthly
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + convertToDisplay(t.amount, t.currency ?? 'USD'), 0);
    const monthlyExpenses = monthly
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + convertToDisplay(t.amount, t.currency ?? 'USD'), 0);
    return {
      balance: monthlyIncome - monthlyExpenses,
      income: monthlyIncome,
      expenses: monthlyExpenses,
    };
  }, [transactions, convertToDisplay]);

  return (
    <div className="bg-background border-b border-border px-4 py-3">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSidebarToggle}
              aria-label="Show sidebar"
              className="hidden md:flex shrink-0"
            >
              <PanelLeft className="w-5 h-5" />
            </Button>
          )}
          <Link to="/" className="shrink-0 flex items-center" aria-label="BeMê home">
            <img src="/logo.png" alt="BeMê" className="h-8 w-auto object-contain" />
          </Link>
          <div className="border-l border-border pl-4">
            <p className="text-sm text-muted-foreground">{greeting}</p>
            <h2 className="text-xl font-bold">{user.name}</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <HeaderBalance
            balance={balance}
            income={income}
            expenses={expenses}
            currency={settings.currency}
            balanceDisplayLayout={settings.balanceDisplayLayout}
            loading={transactionsLoading}
          />
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold shrink-0">
            {user.name.charAt(0)}
          </div>
        </div>
      </div>
    </div>
  );
}
