import { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Workout, Exercise, WORKOUT_TYPES } from '@/types/workout';
import { workoutFormSchema, type WorkoutFormValues } from '@/schemas/workout';
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
import { Plus, Trash2, Copy, Save } from 'lucide-react';
import { STORAGE_KEYS, storage } from '@/lib/storage';
import { toast } from 'sonner';

export type WorkoutTemplate = Omit<Workout, 'id' | 'date'>;

interface WorkoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (workout: Omit<Workout, 'id'>) => void;
  workout?: Workout;
}

const defaultExercise: WorkoutFormValues['exercises'][0] = {
  name: '',
  sets: 3,
  reps: 10,
  weight: undefined,
};

const defaultValues: WorkoutFormValues = {
  title: '',
  type: 'strength',
  date: new Date().toISOString().split('T')[0],
  durationMinutes: '',
  notes: '',
  exercises: [defaultExercise],
};

export function WorkoutModal({ open, onOpenChange, onSave, workout }: WorkoutModalProps) {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'exercises' });
  const watchedTitle = watch('title');
  const watchedExercises = watch('exercises');

  useEffect(() => {
    if (open) {
      const savedTemplates = storage.get<WorkoutTemplate[]>(STORAGE_KEYS.WORKOUT_TEMPLATES) || [];
      setTemplates(savedTemplates);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (workout) {
      reset({
        title: workout.title,
        type: workout.type,
        date: new Date(workout.date).toISOString().split('T')[0],
        durationMinutes: workout.durationMinutes.toString(),
        notes: workout.notes ?? '',
        exercises: workout.exercises.length
          ? workout.exercises.map((e) => ({ name: e.name, sets: e.sets, reps: e.reps, weight: e.weight }))
          : [defaultExercise],
      });
    } else {
      reset({ ...defaultValues, date: new Date().toISOString().split('T')[0] });
    }
  }, [open, workout, reset]);

  const addExercise = () => append({ ...defaultExercise });

  const loadTemplate = (template: WorkoutTemplate) => {
    reset({
      title: template.title,
      type: template.type,
      date: new Date().toISOString().split('T')[0],
      durationMinutes: template.durationMinutes.toString(),
      notes: template.notes ?? '',
      exercises: template.exercises.length
        ? template.exercises.map((e) => ({ name: e.name, sets: e.sets, reps: e.reps, weight: e.weight }))
        : [defaultExercise],
    });
  };

  const saveAsTemplate = () => {
    const title = watchedTitle?.trim();
    const exercises = (watchedExercises ?? []).filter((ex) => ex.name?.trim());
    if (!title || exercises.length === 0) {
      toast.error('Please add a title and at least one exercise before saving as template');
      return;
    }
    const template: WorkoutTemplate = {
      title,
      type: watch('type'),
      durationMinutes: parseInt(watch('durationMinutes') || '0', 10),
      notes: watch('notes'),
      exercises: exercises.map((e) => ({ name: e.name, sets: e.sets, reps: e.reps, weight: e.weight })),
    };
    try {
      const updatedTemplates = [...templates, template];
      storage.set(STORAGE_KEYS.WORKOUT_TEMPLATES, updatedTemplates);
      setTemplates(updatedTemplates);
      toast.success('Workout saved as template!');
    } catch {
      toast.error('Failed to save template. Please try again.');
    }
  };

  const onSubmit = (data: WorkoutFormValues) => {
    const exercises: Exercise[] = data.exercises
      .filter((ex) => ex.name.trim() !== '')
      .map((ex) => ({ name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight }));
    onSave({
      title: data.title,
      type: data.type,
      date: new Date(data.date),
      durationMinutes: parseInt(data.durationMinutes, 10),
      notes: data.notes,
      exercises,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{workout ? 'Edit Workout' : 'Add Workout'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {templates.length > 0 && !workout && (
              <div className="p-3 bg-muted rounded-lg">
                <Label className="mb-2 block">Saved Workouts</Label>
                <div className="flex flex-wrap gap-2">
                  {templates.map((t, idx) => (
                    <Button
                      key={idx}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => loadTemplate(t)}
                      className="text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      {t.title}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="e.g., Chest and Shoulders"
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'title-error' : undefined}
              />
              {errors.title && (
                <p id="title-error" className="text-sm text-destructive mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WORKOUT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  {...register('durationMinutes')}
                  aria-invalid={!!errors.durationMinutes}
                  aria-describedby={errors.durationMinutes ? 'duration-error' : undefined}
                />
                {errors.durationMinutes && (
                  <p id="duration-error" className="text-sm text-destructive mt-1">
                    {errors.durationMinutes.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register('date')} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Exercises</Label>
                <Button type="button" variant="outline" size="sm" onClick={addExercise}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Exercise
                </Button>
              </div>
              <div className="space-y-3">
                {fields.map((field, idx) => (
                  <div key={field.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Exercise name"
                          {...register(`exercises.${idx}.name`)}
                          aria-invalid={!!errors.exercises?.[idx]?.name}
                          aria-describedby={errors.exercises?.[idx]?.name ? `exercise-${idx}-name-error` : undefined}
                        />
                        {errors.exercises?.[idx]?.name && (
                          <p id={`exercise-${idx}-name-error`} className="text-sm text-destructive mt-1">
                            {errors.exercises[idx]?.name?.message}
                          </p>
                        )}
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Input
                          type="number"
                          placeholder="Sets"
                          {...register(`exercises.${idx}.sets`)}
                          aria-invalid={!!errors.exercises?.[idx]?.sets}
                        />
                        {errors.exercises?.[idx]?.sets && (
                          <p className="text-xs text-destructive mt-1">{errors.exercises[idx]?.sets?.message}</p>
                        )}
                      </div>
                      <div>
                        <Input
                          type="number"
                          placeholder="Reps"
                          {...register(`exercises.${idx}.reps`)}
                          aria-invalid={!!errors.exercises?.[idx]?.reps}
                        />
                        {errors.exercises?.[idx]?.reps && (
                          <p className="text-xs text-destructive mt-1">{errors.exercises[idx]?.reps?.message}</p>
                        )}
                      </div>
                      <div>
                        <Controller
                          name={`exercises.${idx}.weight`}
                          control={control}
                          render={({ field }) => (
                            <Input
                              type="number"
                              placeholder="Weight (lbs)"
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              aria-invalid={!!errors.exercises?.[idx]?.weight}
                            />
                          )}
                        />
                        {errors.exercises?.[idx]?.weight && (
                          <p className="text-xs text-destructive mt-1">{errors.exercises[idx]?.weight?.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {errors.exercises?.root && (
                <p className="text-sm text-destructive mt-1">{errors.exercises.root.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea id="notes" {...register('notes')} placeholder="How did it go?" />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <div className="flex justify-between w-full">
              {!workout && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={saveAsTemplate}
                  disabled={!watchedTitle?.trim() || (watchedExercises?.length ?? 0) === 0}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save as Template
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!isValid}>
                  {workout ? 'Update' : 'Add'} Workout
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
