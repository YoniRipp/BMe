import { Exercise } from '@/types/workout';

interface ExerciseListProps {
  exercises: Exercise[];
}

export function ExerciseList({ exercises }: ExerciseListProps) {
  if (exercises.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No exercises added</p>
    );
  }

  return (
    <div className="space-y-2">
      {exercises.map((exercise, idx) => (
        <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-lg">
          <div>
            <p className="font-medium">{exercise.name}</p>
            <p className="text-sm text-muted-foreground">
              {exercise.sets} sets × {exercise.reps} reps
              {exercise.weight && ` @ ${exercise.weight}lbs`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
