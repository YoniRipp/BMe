import { useState, useMemo, useCallback } from 'react';
import { Transaction } from '@/types/transaction';

export interface TransactionFilterState {
  filter: 'all' | 'income' | 'expense';
  setFilter: (v: 'all' | 'income' | 'expense') => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  dateRange: { start: string; end: string };
  setDateRange: (v: { start: string; end: string }) => void;
  amountRange: { min: string; max: string };
  setAmountRange: (v: { min: string; max: string }) => void;
  selectedCategories: string[];
  toggleCategory: (category: string) => void;
  clearFilters: () => void;
  activeFiltersCount: number;
  allCategories: string[];
  filteredTransactions: Transaction[];
}

export function useTransactionFilters(
  transactions: Transaction[],
  selectedPeriodTransactions: Transaction[]
): TransactionFilterState {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const filteredTransactions = useMemo(() => {
    let filtered = selectedPeriodTransactions;
    if (filter !== 'all') filtered = filtered.filter((t) => t.type === filter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.category.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.amount.toString().includes(q)
      );
    }
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      filtered = filtered.filter((t) => new Date(t.date) >= startDate);
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((t) => new Date(t.date) <= endDate);
    }
    if (amountRange.min) {
      const min = parseFloat(amountRange.min);
      filtered = filtered.filter((t) => t.amount >= min);
    }
    if (amountRange.max) {
      const max = parseFloat(amountRange.max);
      filtered = filtered.filter((t) => t.amount <= max);
    }
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((t) => selectedCategories.includes(t.category));
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    selectedPeriodTransactions,
    filter,
    searchQuery,
    dateRange,
    amountRange,
    selectedCategories,
  ]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (dateRange.start || dateRange.end) count++;
    if (amountRange.min || amountRange.max) count++;
    if (selectedCategories.length > 0) count++;
    return count;
  }, [dateRange, amountRange, selectedCategories]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((t) => cats.add(t.category));
    return Array.from(cats).sort();
  }, [transactions]);

  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setDateRange({ start: '', end: '' });
    setAmountRange({ min: '', max: '' });
    setSelectedCategories([]);
  }, []);

  return {
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
  };
}
