import { memo } from 'react';
import { Workout } from '@/types/workout';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WorkoutCardProps {
  workout: Workout;
  onEdit?: (workout: Workout) => void;
  onDelete?: (id: string) => void;
}

export const WorkoutCard = memo(function WorkoutCard({ workout, onEdit, onDelete }: WorkoutCardProps) {
  return (
    <div 
      className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
      onClick={() => onEdit && onEdit(workout)}
      role="button"
      tabIndex={0}
      aria-label={`Workout: ${workout.title}, ${workout.type}, ${workout.durationMinutes} minutes`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit && onEdit(workout);
        }
      }}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium">{workout.title}</p>
          <Badge variant="secondary">{workout.type}</Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
          <span>{formatDate(workout.date)}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {workout.durationMinutes} min
          </span>
        </div>
        {workout.exercises.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {workout.exercises.length} {workout.exercises.length === 1 ? 'exercise' : 'exercises'}
          </p>
        )}
      </div>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(workout.id);
          }}
          aria-label={`Delete workout: ${workout.title}`}
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
});
