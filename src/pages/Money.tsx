import { useState, useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { Transaction, TRANSACTION_CATEGORIES } from '@/types/transaction';
import { PageHeader } from '@/components/shared/PageHeader';
import { TransactionList } from '@/components/money/TransactionList';
import { TransactionModal } from '@/components/money/TransactionModal';
import { MonthlyChart } from '@/components/money/MonthlyChart';
import { SearchBar } from '@/components/shared/SearchBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DollarSign, Plus, TrendingUp, TrendingDown, Filter, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  startOfYear, 
  endOfYear,
  startOfDay,
  endOfDay,
  isWithinInterval
} from 'date-fns';

export function Money() {
  const { transactions, transactionsLoading, transactionsError, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const now = new Date();
  
  // Date ranges
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);

  // Helper to calculate balance for a date range
  const calculateBalance = (transactions: Transaction[]) => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, balance: income - expenses };
  };

  // Filter transactions by date range
  const dailyTransactions = useMemo(() => {
    return transactions.filter(t => 
      isWithinInterval(new Date(t.date), { start: dayStart, end: dayEnd })
    );
  }, [transactions, dayStart, dayEnd]);

  const weeklyTransactions = useMemo(() => {
    return transactions.filter(t => 
      isWithinInterval(new Date(t.date), { start: weekStart, end: weekEnd })
    );
  }, [transactions, weekStart, weekEnd]);

  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => 
      isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
    );
  }, [transactions, monthStart, monthEnd]);

  const yearlyTransactions = useMemo(() => {
    return transactions.filter(t => 
      isWithinInterval(new Date(t.date), { start: yearStart, end: yearEnd })
    );
  }, [transactions, yearStart, yearEnd]);

  const daily = calculateBalance(dailyTransactions);
  const weekly = calculateBalance(weeklyTransactions);
  const monthly = calculateBalance(monthlyTransactions);
  const yearly = calculateBalance(yearlyTransactions);

  // Get transactions for selected period
  const selectedPeriodTransactions = useMemo(() => {
    switch (selectedPeriod) {
      case 'daily':
        return dailyTransactions;
      case 'weekly':
        return weeklyTransactions;
      case 'monthly':
        return monthlyTransactions;
      case 'yearly':
        return yearlyTransactions;
      default:
        return monthlyTransactions;
    }
  }, [selectedPeriod, dailyTransactions, weeklyTransactions, monthlyTransactions, yearlyTransactions]);

  const filteredTransactions = useMemo(() => {
    let filtered = selectedPeriodTransactions;
    
    // Type filter
    if (filter !== 'all') {
      filtered = filtered.filter(t => t.type === filter);
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.category.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.amount.toString().includes(query)
      );
    }
    
    // Date range filter
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      filtered = filtered.filter(t => new Date(t.date) >= startDate);
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => new Date(t.date) <= endDate);
    }
    
    // Amount range filter
    if (amountRange.min) {
      const min = parseFloat(amountRange.min);
      filtered = filtered.filter(t => t.amount >= min);
    }
    if (amountRange.max) {
      const max = parseFloat(amountRange.max);
      filtered = filtered.filter(t => t.amount <= max);
    }
    
    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(t => selectedCategories.includes(t.category));
    }
    
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedPeriodTransactions, filter, searchQuery, dateRange, amountRange, selectedCategories]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (dateRange.start || dateRange.end) count++;
    if (amountRange.min || amountRange.max) count++;
    if (selectedCategories.length > 0) count++;
    return count;
  }, [dateRange, amountRange, selectedCategories]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(t => cats.add(t.category));
    return Array.from(cats).sort();
  }, [transactions]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setDateRange({ start: '', end: '' });
    setAmountRange({ min: '', max: '' });
    setSelectedCategories([]);
  };

  const handleSave = (transaction: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
      updateTransaction(editingTransaction.id, transaction);
    } else {
      addTransaction(transaction);
    }
    setEditingTransaction(undefined);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingTransaction(undefined);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Money"
        subtitle="Where does the money go?"
        icon={DollarSign}
        iconColor="text-green-600"
      />

      {/* Transactions - moved to top */}
      <div>
        {transactionsError && <p className="text-sm text-destructive mb-2">{transactionsError}</p>}
        {transactionsLoading ? (
          <LoadingSpinner text="Loading transactions..." />
        ) : (
        <>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search transactions..."
            />
          </div>
          <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Filter Transactions</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Date Range</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      placeholder="Start date"
                    />
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      placeholder="End date"
                    />
                  </div>
                </div>
                <div>
                  <Label>Amount Range</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Input
                      type="number"
                      value={amountRange.min}
                      onChange={(e) => setAmountRange({ ...amountRange, min: e.target.value })}
                      placeholder="Min amount"
                    />
                    <Input
                      type="number"
                      value={amountRange.max}
                      onChange={(e) => setAmountRange({ ...amountRange, max: e.target.value })}
                      placeholder="Max amount"
                    />
                  </div>
                </div>
                <div>
                  <Label>Categories</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {allCategories.map(cat => (
                      <Badge
                        key={cat}
                        variant={selectedCategories.includes(cat) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleCategory(cat)}
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
                {activeFiltersCount > 0 && (
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'income' | 'expense')} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expense">Expenses</TabsTrigger>
          </TabsList>
          <TabsContent value={filter} className="mt-4">
            <TransactionList
              transactions={filteredTransactions}
              onEdit={handleEdit}
              onDelete={deleteTransaction}
              onAdd={handleAddNew}
            />
          </TabsContent>
        </Tabs>
        </>
        )}
      </div>

      {/* Balance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Balance */}
        <Card 
          className={`p-4 bg-gradient-to-br from-blue-50 to-blue-100 cursor-pointer transition-all hover:scale-105 ${
            selectedPeriod === 'daily' ? 'ring-2 ring-blue-500 shadow-lg' : ''
          }`}
          onClick={() => setSelectedPeriod('daily')}
        >
          <h3 className="text-sm text-muted-foreground mb-2">Daily Balance</h3>
          <p className={`text-2xl font-bold mb-3 ${daily.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(daily.balance)}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Income</p>
              <p className="font-semibold text-green-600">{formatCurrency(daily.income)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Expenses</p>
              <p className="font-semibold text-red-600">{formatCurrency(daily.expenses)}</p>
            </div>
          </div>
        </Card>

        {/* Weekly Balance */}
        <Card 
          className={`p-4 bg-gradient-to-br from-purple-50 to-purple-100 cursor-pointer transition-all hover:scale-105 ${
            selectedPeriod === 'weekly' ? 'ring-2 ring-purple-500 shadow-lg' : ''
          }`}
          onClick={() => setSelectedPeriod('weekly')}
        >
          <h3 className="text-sm text-muted-foreground mb-2">Weekly Balance</h3>
          <p className={`text-2xl font-bold mb-3 ${weekly.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(weekly.balance)}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Income</p>
              <p className="font-semibold text-green-600">{formatCurrency(weekly.income)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Expenses</p>
              <p className="font-semibold text-red-600">{formatCurrency(weekly.expenses)}</p>
            </div>
          </div>
        </Card>

        {/* Monthly Balance */}
        <Card 
          className={`p-4 bg-gradient-to-br from-emerald-50 to-green-50 cursor-pointer transition-all hover:scale-105 ${
            selectedPeriod === 'monthly' ? 'ring-2 ring-green-500 shadow-lg' : ''
          }`}
          onClick={() => setSelectedPeriod('monthly')}
        >
          <h3 className="text-sm text-muted-foreground mb-2">Monthly Balance</h3>
          <p className={`text-2xl font-bold mb-3 ${monthly.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(monthly.balance)}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Income</p>
              <p className="font-semibold text-green-600">{formatCurrency(monthly.income)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Expenses</p>
              <p className="font-semibold text-red-600">{formatCurrency(monthly.expenses)}</p>
            </div>
          </div>
        </Card>

        {/* Yearly Balance */}
        <Card 
          className={`p-4 bg-gradient-to-br from-orange-50 to-orange-100 cursor-pointer transition-all hover:scale-105 ${
            selectedPeriod === 'yearly' ? 'ring-2 ring-orange-500 shadow-lg' : ''
          }`}
          onClick={() => setSelectedPeriod('yearly')}
        >
          <h3 className="text-sm text-muted-foreground mb-2">Yearly Balance</h3>
          <p className={`text-2xl font-bold mb-3 ${yearly.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(yearly.balance)}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Income</p>
              <p className="font-semibold text-green-600">{formatCurrency(yearly.income)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Expenses</p>
              <p className="font-semibold text-red-600">{formatCurrency(yearly.expenses)}</p>
            </div>
          </div>
        </Card>
      </div>

      <MonthlyChart transactions={selectedPeriodTransactions} period={selectedPeriod} />

      <TransactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSave}
        transaction={editingTransaction}
      />
    </div>
  );
}
