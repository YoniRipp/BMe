import { useState, useEffect } from 'react';
import { Workout, Exercise, WORKOUT_TYPES } from '@/types/workout';
import { validateWorkoutDuration, validateExerciseName, validateExerciseSets, validateExerciseReps, validateExerciseWeight, isStringNotEmpty } from '@/lib/validation';
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

// Workout template type (same as Workout but without id and date)
export type WorkoutTemplate = Omit<Workout, 'id' | 'date'>;

interface WorkoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (workout: Omit<Workout, 'id'>) => void;
  workout?: Workout;
}

export function WorkoutModal({ open, onOpenChange, onSave, workout }: WorkoutModalProps) {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    type: 'strength' as typeof WORKOUT_TYPES[number],
    date: new Date().toISOString().split('T')[0],
    durationMinutes: '',
    notes: '',
    exercises: [] as Exercise[],
  });
  const [errors, setErrors] = useState<{
    title?: string;
    duration?: string;
    exercises?: Array<{
      name?: string;
      sets?: string;
      reps?: string;
      weight?: string;
    }>;
  }>({});

  // Load templates when modal opens
  useEffect(() => {
    if (open) {
      const savedTemplates = storage.get<WorkoutTemplate[]>(STORAGE_KEYS.WORKOUT_TEMPLATES) || [];
      setTemplates(savedTemplates);
    }
  }, [open]);

  useEffect(() => {
    if (workout) {
      setFormData({
        title: workout.title,
        type: workout.type,
        date: new Date(workout.date).toISOString().split('T')[0],
        durationMinutes: workout.durationMinutes.toString(),
        notes: workout.notes || '',
        exercises: workout.exercises,
      });
    } else {
      setFormData({
        title: '',
        type: 'strength',
        date: new Date().toISOString().split('T')[0],
        durationMinutes: '',
        notes: '',
        exercises: [],
      });
    }
    setErrors({});
  }, [workout, open]);

  const validateTitle = (title: string) => {
    if (!isStringNotEmpty(title)) {
      return { isValid: false, error: 'Title is required.' };
    }
    if (title.length > 100) {
      return { isValid: false, error: 'Title cannot exceed 100 characters.' };
    }
    return { isValid: true };
  };

  const validateField = (field: 'title' | 'duration', value: string) => {
    let result;
    switch (field) {
      case 'title':
        result = validateTitle(value);
        setErrors(prev => ({
          ...prev,
          title: result.isValid ? undefined : result.error
        }));
        break;
      case 'duration':
        if (!value) {
          setErrors(prev => ({ ...prev, duration: undefined }));
          return;
        }
        result = validateWorkoutDuration(parseInt(value) || 0);
        setErrors(prev => ({
          ...prev,
          duration: result.isValid ? undefined : result.error
        }));
        break;
    }
  };

  const validateExercise = (index: number, field: 'name' | 'sets' | 'reps' | 'weight', value: string | number | undefined) => {
    let result;
    const exerciseErrors = errors.exercises || [];
    const currentErrors = exerciseErrors[index] || {};

    switch (field) {
      case 'name':
        result = validateExerciseName(value as string);
        exerciseErrors[index] = {
          ...currentErrors,
          name: result.isValid ? undefined : result.error
        };
        break;
      case 'sets':
        if (value === undefined || value === null || value === '') {
          exerciseErrors[index] = {
            ...currentErrors,
            sets: undefined
          };
        } else {
          result = validateExerciseSets(typeof value === 'number' ? value : parseInt(value as string) || 0);
          exerciseErrors[index] = {
            ...currentErrors,
            sets: result.isValid ? undefined : result.error
          };
        }
        break;
      case 'reps':
        if (value === undefined || value === null || value === '') {
          exerciseErrors[index] = {
            ...currentErrors,
            reps: undefined
          };
        } else {
          result = validateExerciseReps(typeof value === 'number' ? value : parseInt(value as string) || 0);
          exerciseErrors[index] = {
            ...currentErrors,
            reps: result.isValid ? undefined : result.error
          };
        }
        break;
      case 'weight':
        result = validateExerciseWeight(value === '' ? undefined : (typeof value === 'number' ? value : parseFloat(value as string)));
        exerciseErrors[index] = {
          ...currentErrors,
          weight: result.isValid ? undefined : result.error
        };
        break;
    }

    setErrors(prev => ({
      ...prev,
      exercises: [...exerciseErrors]
    }));
  };

  const isFormValid = () => {
    const titleValid = validateTitle(formData.title).isValid;
    const durationValid = !formData.durationMinutes || validateWorkoutDuration(parseInt(formData.durationMinutes) || 0).isValid;
    
    const exercisesValid = formData.exercises.every((ex, idx) => {
      const nameValid = validateExerciseName(ex.name).isValid;
      const setsValid = validateExerciseSets(ex.sets).isValid;
      const repsValid = validateExerciseReps(ex.reps).isValid;
      const weightValid = validateExerciseWeight(ex.weight).isValid;
      return nameValid && setsValid && repsValid && weightValid;
    });

    const exerciseErrors = errors.exercises || [];
    const hasExerciseErrors = exerciseErrors.some(e => e.name || e.sets || e.reps || e.weight);

    return titleValid && durationValid && exercisesValid && !errors.title && !errors.duration && !hasExerciseErrors;
  };

  const addExercise = () => {
    setFormData({
      ...formData,
      exercises: [
        ...formData.exercises,
        { name: '', sets: 3, reps: 10, weight: undefined },
      ],
    });
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string | number | undefined) => {
    const newExercises = [...formData.exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setFormData({ ...formData, exercises: newExercises });
    
    // Validate the updated field
    if (field === 'name' || field === 'sets' || field === 'reps' || field === 'weight') {
      validateExercise(index, field, value);
    }
  };

  const removeExercise = (index: number) => {
    setFormData({
      ...formData,
      exercises: formData.exercises.filter((_, i) => i !== index),
    });
  };

  const loadTemplate = (template: WorkoutTemplate) => {
    setFormData({
      ...formData,
      title: template.title,
      type: template.type,
      durationMinutes: template.durationMinutes.toString(),
      notes: template.notes || '',
      exercises: template.exercises,
    });
  };

  const saveAsTemplate = () => {
    if (!formData.title.trim() || formData.exercises.length === 0) {
      toast.error('Please add a title and at least one exercise before saving as template');
      return;
    }

    const template: WorkoutTemplate = {
      title: formData.title,
      type: formData.type,
      durationMinutes: parseInt(formData.durationMinutes) || 0,
      notes: formData.notes,
      exercises: formData.exercises.filter(ex => ex.name.trim() !== ''),
    };

    try {
      const updatedTemplates = [...templates, template];
      storage.set(STORAGE_KEYS.WORKOUT_TEMPLATES, updatedTemplates);
      setTemplates(updatedTemplates);
      toast.success('Workout saved as template!');
    } catch (error) {
      toast.error('Failed to save template. Please try again.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    validateField('title', formData.title);
    if (formData.durationMinutes) {
      validateField('duration', formData.durationMinutes);
    }

    // Validate all exercises
    formData.exercises.forEach((ex, idx) => {
      validateExercise(idx, 'name', ex.name);
      validateExercise(idx, 'sets', ex.sets);
      validateExercise(idx, 'reps', ex.reps);
      validateExercise(idx, 'weight', ex.weight);
    });

    if (!isFormValid()) {
      return;
    }

    onSave({
      title: formData.title,
      type: formData.type,
      date: new Date(formData.date),
      durationMinutes: parseInt(formData.durationMinutes),
      notes: formData.notes,
      exercises: formData.exercises.filter(ex => ex.name.trim() !== ''),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{workout ? 'Edit Workout' : 'Add Workout'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Templates section */}
            {templates.length > 0 && !workout && (
              <div className="p-3 bg-muted rounded-lg">
                <Label className="mb-2 block">Saved Workouts</Label>
                <div className="flex flex-wrap gap-2">
                  {templates.map((template, idx) => (
                    <Button
                      key={idx}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => loadTemplate(template)}
                      className="text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      {template.title}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  validateField('title', e.target.value);
                }}
                onBlur={(e) => validateField('title', e.target.value)}
                placeholder="e.g., Chest and Shoulders"
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'title-error' : undefined}
              />
              {errors.title && (
                <p id="title-error" className="text-sm text-destructive mt-1">
                  {errors.title}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: typeof WORKOUT_TYPES[number]) =>
                    setFormData({ ...formData, type: value })
                  }
                >
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
              </div>

              <div>
                <Label htmlFor="duration">Duration (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  required
                  value={formData.durationMinutes}
                  onChange={(e) => {
                    setFormData({ ...formData, durationMinutes: e.target.value });
                    if (e.target.value) {
                      validateField('duration', e.target.value);
                    } else {
                      setErrors(prev => ({ ...prev, duration: undefined }));
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value) validateField('duration', e.target.value);
                  }}
                  aria-invalid={!!errors.duration}
                  aria-describedby={errors.duration ? 'duration-error' : undefined}
                />
                {errors.duration && (
                  <p id="duration-error" className="text-sm text-destructive mt-1">
                    {errors.duration}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
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
                {formData.exercises.map((exercise, idx) => {
                  const exerciseErrors = errors.exercises?.[idx] || {};
                  return (
                    <div key={idx} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="Exercise name"
                            value={exercise.name}
                            onChange={(e) => updateExercise(idx, 'name', e.target.value)}
                            onBlur={(e) => validateExercise(idx, 'name', e.target.value)}
                            aria-invalid={!!exerciseErrors.name}
                            aria-describedby={exerciseErrors.name ? `exercise-${idx}-name-error` : undefined}
                          />
                          {exerciseErrors.name && (
                            <p id={`exercise-${idx}-name-error`} className="text-sm text-destructive mt-1">
                              {exerciseErrors.name}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            removeExercise(idx);
                            // Remove errors for this exercise
                            const newExerciseErrors = [...(errors.exercises || [])];
                            newExerciseErrors.splice(idx, 1);
                            setErrors(prev => ({ ...prev, exercises: newExerciseErrors }));
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Input
                            type="number"
                            placeholder="Sets"
                            value={exercise.sets}
                            onChange={(e) => updateExercise(idx, 'sets', e.target.value ? parseInt(e.target.value) : undefined)}
                            onBlur={(e) => validateExercise(idx, 'sets', e.target.value ? parseInt(e.target.value) : undefined)}
                            aria-invalid={!!exerciseErrors.sets}
                            aria-describedby={exerciseErrors.sets ? `exercise-${idx}-sets-error` : undefined}
                          />
                          {exerciseErrors.sets && (
                            <p id={`exercise-${idx}-sets-error`} className="text-xs text-destructive mt-1">
                              {exerciseErrors.sets}
                            </p>
                          )}
                        </div>
                        <div>
                          <Input
                            type="number"
                            placeholder="Reps"
                            value={exercise.reps}
                            onChange={(e) => updateExercise(idx, 'reps', e.target.value ? parseInt(e.target.value) : undefined)}
                            onBlur={(e) => validateExercise(idx, 'reps', e.target.value ? parseInt(e.target.value) : undefined)}
                            aria-invalid={!!exerciseErrors.reps}
                            aria-describedby={exerciseErrors.reps ? `exercise-${idx}-reps-error` : undefined}
                          />
                          {exerciseErrors.reps && (
                            <p id={`exercise-${idx}-reps-error`} className="text-xs text-destructive mt-1">
                              {exerciseErrors.reps}
                            </p>
                          )}
                        </div>
                        <div>
                          <Input
                            type="number"
                            placeholder="Weight (lbs)"
                            value={exercise.weight || ''}
                            onChange={(e) => updateExercise(idx, 'weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                            onBlur={(e) => validateExercise(idx, 'weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                            aria-invalid={!!exerciseErrors.weight}
                            aria-describedby={exerciseErrors.weight ? `exercise-${idx}-weight-error` : undefined}
                          />
                          {exerciseErrors.weight && (
                            <p id={`exercise-${idx}-weight-error`} className="text-xs text-destructive mt-1">
                              {exerciseErrors.weight}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="How did it go?"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <div className="flex justify-between w-full">
              {!workout && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={saveAsTemplate}
                  disabled={!formData.title.trim() || formData.exercises.length === 0}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save as Template
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!isFormValid()}>
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
