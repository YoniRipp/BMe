import { Transaction } from '@/types/transaction';
import { TransactionCard } from './TransactionCard';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  convertToDisplay?: (amount: number, currency: string) => number;
  displayCurrency?: string;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  onAdd?: () => void;
}

export function TransactionList({
  transactions,
  convertToDisplay,
  displayCurrency,
  onEdit,
  onDelete,
  onAdd,
}: TransactionListProps) {
  return (
    <div className="space-y-2">
      {transactions.length === 0 ? (
        <Card
          className="p-8 border-2 border-dashed cursor-pointer hover:border-primary transition-colors text-center"
          onClick={onAdd}
          role="button"
          tabIndex={0}
          aria-label="Add your first transaction"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onAdd?.();
            }
          }}
        >
          <Plus className="w-12 h-12 mx-auto mb-3 text-muted-foreground" aria-hidden />
          <p className="text-lg font-medium mb-1">Add your first transaction</p>
          <p className="text-sm text-muted-foreground">Tap to start tracking your finances</p>
        </Card>
      ) : (
        <>
          {transactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              convertedAmount={convertToDisplay ? convertToDisplay(transaction.amount, transaction.currency ?? 'USD') : undefined}
              displayCurrency={displayCurrency}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
          <Card
            className="p-6 border-2 border-dashed cursor-pointer hover:border-primary transition-colors text-center bg-muted/50"
            onClick={onAdd}
            role="button"
            tabIndex={0}
            aria-label="Add another transaction"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onAdd?.();
              }
            }}
          >
            <Plus className="w-8 h-8 mx-auto text-primary" aria-hidden />
            <p className="text-sm font-medium mt-2 text-muted-foreground">
              Add another transaction
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
