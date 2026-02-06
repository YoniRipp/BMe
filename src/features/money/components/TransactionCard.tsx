import { memo } from 'react';
import { Transaction } from '@/types/transaction';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
}

export const TransactionCard = memo(function TransactionCard({
  transaction,
  onEdit,
  onDelete,
}: TransactionCardProps) {
  const isIncome = transaction.type === 'income';

  return (
    <div
      className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
      onClick={() => onEdit?.(transaction)}
    >
      <div className="flex items-center gap-3 flex-1">
        <div
          className={cn(
            'p-2 rounded-lg',
            isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          )}
        >
          {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{transaction.category}</p>
            {transaction.isRecurring && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                Recurring
              </span>
            )}
          </div>
          {transaction.description && (
            <p className="text-sm text-muted-foreground">{transaction.description}</p>
          )}
          <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
        </div>
        <div className="text-right">
          <p
            className={cn('font-semibold', isIncome ? 'text-green-600' : 'text-red-600')}
          >
            {isIncome ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </p>
        </div>
      </div>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(transaction.id);
          }}
          aria-label={`Delete transaction: ${transaction.category}`}
        >
          <Trash2 className="w-4 h-4" aria-hidden />
        </Button>
      )}
    </div>
  );
});
