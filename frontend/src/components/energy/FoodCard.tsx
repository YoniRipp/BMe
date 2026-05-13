import { memo } from 'react';
import { Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImagePlaceholder } from '@/components/shared/ImagePlaceholder';
import { getFoodImageUrl } from '@/hooks/useFoodImages';
import type { FoodEntry } from '@/types/energy';

interface FoodCardProps {
  entry: FoodEntry;
  onEdit: (entry: FoodEntry) => void;
  onDelete: (id: string) => void;
  onToggleChecked?: (id: string, checked: boolean) => void;
}

export const FoodCard = memo(function FoodCard({ entry, onEdit, onDelete, onToggleChecked }: FoodCardProps) {
  const portionText = entry.portionAmount != null
    ? `${entry.portionAmount}${entry.portionUnit ? ` ${entry.portionUnit}` : ''}`
    : null;

  return (
    <div
      className={`group flex items-center gap-3.5 rounded-2xl border border-border bg-card p-3 shadow-card hover:border-primary/35 transition-colors cursor-pointer tap-target ${entry.checked ? 'opacity-60' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`Food entry: ${entry.name}, ${entry.calories} calories`}
      onClick={() => onEdit(entry)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit(entry);
        }
      }}
    >
      {onToggleChecked && (
        <button
          type="button"
          className="shrink-0 flex items-center justify-center rounded-full press"
          onClick={(e) => {
            e.stopPropagation();
            onToggleChecked(entry.id, !entry.checked);
          }}
          aria-label={entry.checked ? 'Mark as not eaten' : 'Mark as eaten'}
        >
          {entry.checked
            ? <CheckCircle2 className="w-5 h-5 text-success" />
            : <Circle className="w-5 h-5 text-muted-foreground/50 hover:text-primary transition-colors" />
          }
        </button>
      )}

      <div className="shrink-0">
        <ImagePlaceholder type="food" size="md" imageUrl={getFoodImageUrl(entry.name)} className="rounded-xl" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-[15px] font-extrabold truncate leading-tight ${entry.checked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {entry.name}
        </p>
        {portionText && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{portionText}</p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <div className="text-right pr-1">
          <p className={`text-[18px] font-extrabold leading-none tabular-nums ${entry.checked ? 'text-muted-foreground' : 'text-primary'}`}>{entry.calories}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">kcal</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(entry.id);
          }}
          aria-label={`Delete food entry: ${entry.name}`}
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
});
