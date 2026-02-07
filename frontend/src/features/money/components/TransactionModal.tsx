import { useState, useEffect } from 'react';
import { Transaction, TRANSACTION_CATEGORIES } from '@/types/transaction';
import {
  validateTransactionAmount,
  validateTransactionDate,
  validateCategory,
} from '@/lib/validation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  transaction?: Transaction;
}

export function TransactionModal({
  open,
  onOpenChange,
  onSave,
  transaction,
}: TransactionModalProps) {
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        amount: transaction.amount.toString(),
        category: transaction.category,
        description: transaction.description || '',
        date: new Date(transaction.date).toISOString().split('T')[0],
        isRecurring: transaction.isRecurring,
      });
    } else {
      setFormData({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        isRecurring: false,
      });
    }
    setErrors({});
  }, [transaction, open]);

  const categories =
    formData.type === 'income' ? TRANSACTION_CATEGORIES.income : TRANSACTION_CATEGORIES.expense;

  const validateField = (field: string, value: string) => {
    if (field === 'amount') {
      if (!value) {
        setErrors((prev) => ({ ...prev, amount: '' }));
        return;
      }
      const result = validateTransactionAmount(parseFloat(value));
      setErrors((prev) => ({ ...prev, amount: result.isValid ? '' : (result.error ?? '') }));
      return;
    }
    if (field === 'date') {
      if (!value) {
        setErrors((prev) => ({ ...prev, date: '' }));
        return;
      }
      const result = validateTransactionDate(new Date(value));
      setErrors((prev) => ({ ...prev, date: result.isValid ? '' : (result.error ?? '') }));
      return;
    }
    if (field === 'category') {
      const result = validateCategory(value, categories);
      setErrors((prev) => ({ ...prev, category: result.isValid ? '' : (result.error ?? '') }));
    }
  };

  const isFormValid = () => {
    if (!formData.amount || !formData.category || !formData.date) return false;
    const amountValid = validateTransactionAmount(parseFloat(formData.amount)).isValid;
    const dateValid = validateTransactionDate(new Date(formData.date)).isValid;
    const categoryValid = validateCategory(formData.category, categories).isValid;
    return amountValid && dateValid && categoryValid && Object.values(errors).every((e) => !e);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateField('amount', formData.amount);
    validateField('date', formData.date);
    validateField('category', formData.category);
    if (!isFormValid()) return;
    onSave({
      type: formData.type,
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      date: new Date(formData.date),
      isRecurring: formData.isRecurring,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{transaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'income' | 'expense') => {
                  setFormData({ ...formData, type: value, category: '' });
                  setErrors((prev) => ({ ...prev, category: '' }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => {
                  setFormData({ ...formData, amount: e.target.value });
                  if (e.target.value) validateField('amount', e.target.value);
                  else setErrors((prev) => ({ ...prev, amount: '' }));
                }}
                onBlur={(e) => validateField('amount', e.target.value)}
                aria-invalid={!!errors.amount}
                aria-describedby={errors.amount ? 'amount-error' : undefined}
              />
              {errors.amount && (
                <p id="amount-error" className="text-sm text-destructive mt-1">
                  {errors.amount}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => {
                  setFormData({ ...formData, category: value });
                  validateField('category', value);
                }}
              >
                <SelectTrigger
                  aria-invalid={!!errors.category}
                  aria-describedby={errors.category ? 'category-error' : undefined}
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p id="category-error" className="text-sm text-destructive mt-1">
                  {errors.category}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                required
                value={formData.date}
                onChange={(e) => {
                  setFormData({ ...formData, date: e.target.value });
                  validateField('date', e.target.value);
                }}
                aria-invalid={!!errors.date}
                aria-describedby={errors.date ? 'date-error' : undefined}
              />
              {errors.date && (
                <p id="date-error" className="text-sm text-destructive mt-1">
                  {errors.date}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isRecurring">Recurring transaction</Label>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid()}>
              {transaction ? 'Update' : 'Add'} Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
