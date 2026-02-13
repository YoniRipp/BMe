import { useMemo, useState } from 'react';
import { Transaction } from '@/types/transaction';
import { useSettings } from '@/hooks/useSettings';
import { useExchangeRates } from '@/features/money/useExchangeRates';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchBar } from '@/components/shared/SearchBar';
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
import { DollarSign, Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ContentWithLoading } from '@/components/shared/ContentWithLoading';
import { useTransactions } from '@/features/money/useTransactions';
import { useTransactionFilters } from '@/features/money/useTransactionFilters';
import { useBalanceByPeriod } from '@/features/money/useBalanceByPeriod';
import { TransactionList } from '@/features/money/components/TransactionList';
import { TransactionModal } from '@/features/money/components/TransactionModal';
import { MonthlyChart } from '@/features/money/components/MonthlyChart';
import { BalancePeriodCards } from '@/features/money/components/BalancePeriodCards';

export function Money() {
  const {
    transactions,
    transactionsLoading,
    transactionsError,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions();
  const { settings } = useSettings();
  const displayCurrency = settings.currency;
  const fromCurrencies = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.currency ?? 'USD'))),
    [transactions]
  );
  const { convertToDisplay } = useExchangeRates(displayCurrency, fromCurrencies);
  const { selectedPeriod, setSelectedPeriod, selectedPeriodTransactions, balances } =
    useBalanceByPeriod(transactions, convertToDisplay);
  const {
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    amountRange,
    setAmountRange,
    selectedCategories,
    toggleCategory,
    clearFilters,
    activeFiltersCount,
    allCategories,
    filteredTransactions,
  } = useTransactionFilters(transactions, selectedPeriodTransactions);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);

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

      <ContentWithLoading
        loading={transactionsLoading}
        loadingText="Loading transactions..."
        error={transactionsError}
      >
        <div className="flex items-center gap-3 mb-4">
              <div className="flex-1">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search transactions..."
                />
              </div>
              <FilterDialog
                dateRange={dateRange}
                setDateRange={setDateRange}
                amountRange={amountRange}
                setAmountRange={setAmountRange}
                allCategories={allCategories}
                selectedCategories={selectedCategories}
                toggleCategory={toggleCategory}
                activeFiltersCount={activeFiltersCount}
                clearFilters={clearFilters}
              />
            </div>
            <Tabs
              value={filter}
              onValueChange={(v) => setFilter(v as 'all' | 'income' | 'expense')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="income">Income</TabsTrigger>
                <TabsTrigger value="expense">Expenses</TabsTrigger>
              </TabsList>
              <TabsContent value={filter} className="mt-4">
                <TransactionList
                  transactions={filteredTransactions}
                  convertToDisplay={convertToDisplay}
                  displayCurrency={displayCurrency}
                  onEdit={handleEdit}
                  onDelete={deleteTransaction}
                  onAdd={handleAddNew}
                />
              </TabsContent>
            </Tabs>
      </ContentWithLoading>

      <BalancePeriodCards
        balances={balances}
        displayCurrency={displayCurrency}
        selectedPeriod={selectedPeriod}
        onSelectPeriod={setSelectedPeriod}
      />

      <MonthlyChart
        transactions={selectedPeriodTransactions}
        period={selectedPeriod}
        convertToDisplay={convertToDisplay}
      />

      <TransactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSave}
        transaction={editingTransaction}
      />
    </div>
  );
}

function FilterDialog({
  dateRange,
  setDateRange,
  amountRange,
  setAmountRange,
  allCategories,
  selectedCategories,
  toggleCategory,
  activeFiltersCount,
  clearFilters,
}: {
  dateRange: { start: string; end: string };
  setDateRange: (v: { start: string; end: string }) => void;
  amountRange: { min: string; max: string };
  setAmountRange: (v: { min: string; max: string }) => void;
  allCategories: string[];
  selectedCategories: string[];
  toggleCategory: (category: string) => void;
  activeFiltersCount: number;
  clearFilters: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
              {allCategories.map((cat) => (
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
  );
}
