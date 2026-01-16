import { ScheduleItem as ScheduleItemType } from '@/types/schedule';
import { formatTime } from '@/lib/utils';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScheduleItemProps {
  item: ScheduleItemType;
  onEdit?: (item: ScheduleItemType) => void;
  onDelete?: (id: string) => void;
}

export function ScheduleItem({ item, onEdit, onDelete }: ScheduleItemProps) {
  return (
    <div 
      className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
      onClick={() => onEdit && onEdit(item)}
      role="button"
      tabIndex={0}
      aria-label={`Schedule item: ${item.title}, ${item.startTime} to ${item.endTime}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit && onEdit(item);
        }
      }}
    >
      <div className="flex items-center gap-3 flex-1">
        {item.emoji && (
          <div className="text-2xl">{item.emoji}</div>
        )}
        <div className="flex-1">
          <p className="font-medium">{item.title}</p>
          <p className="text-sm text-muted-foreground">
            {formatTime(item.startTime)} - {formatTime(item.endTime)}
          </p>
        </div>
      </div>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          aria-label={`Delete schedule item: ${item.title}`}
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
