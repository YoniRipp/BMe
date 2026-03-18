import { memo } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImagePlaceholder } from '@/components/shared/ImagePlaceholder';
import { getFoodImageUrl } from '@/hooks/useFoodImages';
import type { FoodEntry } from '@/types/energy';

interface FoodCardProps {
  entry: FoodEntry;
  onEdit: (entry: FoodEntry) => void;
  onDelete: (id: string) => void;
}

export const FoodCard = memo(function FoodCard({ entry, onEdit, onDelete }: FoodCardProps) {
  const portionText = entry.portionAmount != null
    ? `${entry.portionAmount}${entry.portionUnit ? ` ${entry.portionUnit}` : ''}`
    : null;

  return (
    <div
      className="group flex items-center gap-3 p-3.5 rounded-xl bg-card border-l-[3px] border-l-terracotta/50 border border-border/30 cursor-pointer hover:bg-sage-50/50 transition-colors tap-target"
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
      <div className="shrink-0">
        <ImagePlaceholder type="food" size="md" imageUrl={getFoodImageUrl(entry.name)} className="rounded-full" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold truncate">{entry.name}</p>
        {portionText && (
          <p className="text-xs text-muted-foreground truncate">{portionText}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-base font-bold tabular-nums text-terracotta">{entry.calories} <span className="text-xs font-medium">cal</span></span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(entry.id);
          }}
          aria-label={`Delete food entry: ${entry.name}`}
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
});
