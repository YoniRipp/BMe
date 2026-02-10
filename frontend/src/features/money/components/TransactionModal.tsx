import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Transaction, TRANSACTION_CATEGORIES } from '@/types/transaction';
import { transactionFormSchema, type TransactionFormValues } from '@/schemas/transaction';
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

const defaultValues: TransactionFormValues = {
  type: 'expense',
  amount: '',
  category: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  isRecurring: false,
};

export function TransactionModal({
  open,
  onOpenChange,
  onSave,
  transaction,
}: TransactionModalProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  const type = watch('type');
  const categories = type === 'income' ? TRANSACTION_CATEGORIES.income : TRANSACTION_CATEGORIES.expense;

  useEffect(() => {
    if (!open) return;
    if (transaction) {
      reset({
        type: transaction.type,
        amount: transaction.amount.toString(),
        category: transaction.category,
        description: transaction.description ?? '',
        date: new Date(transaction.date).toISOString().split('T')[0],
        isRecurring: transaction.isRecurring,
      });
    } else {
      reset({ ...defaultValues, date: new Date().toISOString().split('T')[0] });
    }
  }, [open, transaction, reset]);

  const onSubmit = (data: TransactionFormValues) => {
    onSave({
      type: data.type,
      amount: parseFloat(data.amount),
      category: data.category,
      description: data.description,
      date: new Date(data.date),
      isRecurring: data.isRecurring,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{transaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value: 'income' | 'expense') => {
                      field.onChange(value);
                      setValue('category', '');
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
                )}
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register('amount')}
                aria-invalid={!!errors.amount}
                aria-describedby={errors.amount ? 'amount-error' : undefined}
              />
              {errors.amount && (
                <p id="amount-error" className="text-sm text-destructive mt-1">
                  {errors.amount.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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
                )}
              />
              {errors.category && (
                <p id="category-error" className="text-sm text-destructive mt-1">
                  {errors.category.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                {...register('date')}
                aria-invalid={!!errors.date}
                aria-describedby={errors.date ? 'date-error' : undefined}
              />
              {errors.date && (
                <p id="date-error" className="text-sm text-destructive mt-1">
                  {errors.date.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea id="description" {...register('description')} />
            </div>
            <div className="flex items-center space-x-2">
              <Controller
                name="isRecurring"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="rounded"
                  />
                )}
              />
              <Label htmlFor="isRecurring">Recurring transaction</Label>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              {transaction ? 'Update' : 'Add'} Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
