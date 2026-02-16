import { LIMITS, VALIDATION_RULES } from './constants';

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Basic validators
export function isPositiveNumber(value: number): boolean {
  return value > 0 && isFinite(value);
}

export function isNonNegativeNumber(value: number): boolean {
  return value >= 0 && isFinite(value);
}

export function isDateInRange(date: Date, maxDaysFuture: number = 0, maxDaysPast: number = 365): boolean {
  const now = new Date();
  const futureLimit = new Date();
  futureLimit.setDate(now.getDate() + maxDaysFuture);
  const pastLimit = new Date();
  pastLimit.setDate(now.getDate() - maxDaysPast);
  
  return date >= pastLimit && date <= futureLimit;
}

export function isValidEmail(email: string): boolean {
  return VALIDATION_RULES.EMAIL_REGEX.test(email);
}

export function isValidTime(time: string): boolean {
  return VALIDATION_RULES.TIME_REGEX.test(time);
}

export function isStringNotEmpty(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

// Transaction validators
export function validateTransactionAmount(amount: number): ValidationResult {
  if (!isPositiveNumber(amount)) {
    return {
      isValid: false,
      error: `Amount must be a positive number.`,
    };
  }
  
  if (amount < LIMITS.MIN_TRANSACTION_AMOUNT) {
    return {
      isValid: false,
      error: `Amount must be at least ${LIMITS.MIN_TRANSACTION_AMOUNT}.`,
    };
  }
  
  if (amount > LIMITS.MAX_TRANSACTION_AMOUNT) {
    return {
      isValid: false,
      error: `Amount cannot exceed ${LIMITS.MAX_TRANSACTION_AMOUNT.toLocaleString()}.`,
    };
  }
  
  return { isValid: true };
}

export function validateTransactionDate(date: Date): ValidationResult {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return {
      isValid: false,
      error: 'Invalid date.',
    };
  }
  
  // Don't allow future dates (more than 1 day ahead)
  if (!isDateInRange(date, 1, 365)) {
    return {
      isValid: false,
      error: 'Date cannot be more than 1 day in the future or more than 1 year in the past.',
    };
  }
  
  return { isValid: true };
}

export function validateCategory(category: string, allowedCategories: readonly string[]): ValidationResult {
  if (!isStringNotEmpty(category)) {
    return {
      isValid: false,
      error: 'Category is required.',
    };
  }
  
  if (!allowedCategories.includes(category)) {
    return {
      isValid: false,
      error: `Category must be one of: ${allowedCategories.join(', ')}.`,
    };
  }
  
  return { isValid: true };
}

// Food entry validators
export function validateCalories(calories: number): ValidationResult {
  if (!isNonNegativeNumber(calories)) {
    return {
      isValid: false,
      error: 'Calories must be a non-negative number.',
    };
  }
  
  if (calories > LIMITS.MAX_CALORIES) {
    return {
      isValid: false,
      error: `Calories cannot exceed ${LIMITS.MAX_CALORIES.toLocaleString()}.`,
    };
  }
  
  return { isValid: true };
}

export function validateMacro(macro: number, maxValue: number, name: string): ValidationResult {
  if (!isNonNegativeNumber(macro)) {
    return {
      isValid: false,
      error: `${name} must be a non-negative number.`,
    };
  }
  
  if (macro > maxValue) {
    return {
      isValid: false,
      error: `${name} cannot exceed ${maxValue}g.`,
    };
  }
  
  return { isValid: true };
}

export function validateProtein(protein: number): ValidationResult {
  return validateMacro(protein, LIMITS.MAX_PROTEIN, 'Protein');
}

export function validateCarbs(carbs: number): ValidationResult {
  return validateMacro(carbs, LIMITS.MAX_CARBS, 'Carbs');
}

export function validateFats(fats: number): ValidationResult {
  return validateMacro(fats, LIMITS.MAX_FATS, 'Fats');
}

export function validateFoodName(name: string): ValidationResult {
  if (!isStringNotEmpty(name)) {
    return {
      isValid: false,
      error: 'Food name is required.',
    };
  }
  
  if (name.length > 100) {
    return {
      isValid: false,
      error: 'Food name cannot exceed 100 characters.',
    };
  }
  
  return { isValid: true };
}

// Workout validators
export function validateWorkoutDuration(duration: number): ValidationResult {
  if (!isPositiveNumber(duration)) {
    return {
      isValid: false,
      error: 'Duration must be a positive number.',
    };
  }
  
  if (duration < LIMITS.MIN_WORKOUT_DURATION) {
    return {
      isValid: false,
      error: `Duration must be at least ${LIMITS.MIN_WORKOUT_DURATION} minute.`,
    };
  }
  
  if (duration > LIMITS.MAX_WORKOUT_DURATION) {
    return {
      isValid: false,
      error: `Duration cannot exceed ${LIMITS.MAX_WORKOUT_DURATION} minutes.`,
    };
  }
  
  return { isValid: true };
}

export function validateExerciseSets(sets: number): ValidationResult {
  if (!isPositiveNumber(sets)) {
    return {
      isValid: false,
      error: 'Sets must be a positive number.',
    };
  }
  
  if (sets > LIMITS.MAX_EXERCISE_SETS) {
    return {
      isValid: false,
      error: `Sets cannot exceed ${LIMITS.MAX_EXERCISE_SETS}.`,
    };
  }
  
  return { isValid: true };
}

export function validateExerciseReps(reps: number): ValidationResult {
  if (!isPositiveNumber(reps)) {
    return {
      isValid: false,
      error: 'Reps must be a positive number.',
    };
  }
  
  if (reps > LIMITS.MAX_EXERCISE_REPS) {
    return {
      isValid: false,
      error: `Reps cannot exceed ${LIMITS.MAX_EXERCISE_REPS}.`,
    };
  }
  
  return { isValid: true };
}

export function validateExerciseWeight(weight: number | undefined): ValidationResult {
  if (weight === undefined) {
    return { isValid: true }; // Weight is optional
  }
  
  if (!isNonNegativeNumber(weight)) {
    return {
      isValid: false,
      error: 'Weight must be a non-negative number.',
    };
  }
  
  if (weight > LIMITS.MAX_EXERCISE_WEIGHT) {
    return {
      isValid: false,
      error: `Weight cannot exceed ${LIMITS.MAX_EXERCISE_WEIGHT} lbs/kg.`,
    };
  }
  
  return { isValid: true };
}

export function validateExerciseName(name: string): ValidationResult {
  if (!isStringNotEmpty(name)) {
    return {
      isValid: false,
      error: 'Exercise name is required.',
    };
  }
  
  if (name.length > 100) {
    return {
      isValid: false,
      error: 'Exercise name cannot exceed 100 characters.',
    };
  }
  
  return { isValid: true };
}

// Sleep validators
export function validateSleepHours(hours: number): ValidationResult {
  if (!isNonNegativeNumber(hours)) {
    return {
      isValid: false,
      error: 'Sleep hours must be a non-negative number.',
    };
  }
  
  if (hours < LIMITS.MIN_SLEEP_HOURS) {
    return {
      isValid: false,
      error: 'Sleep hours cannot be negative.',
    };
  }
  
  if (hours > LIMITS.MAX_SLEEP_HOURS) {
    return {
      isValid: false,
      error: `Sleep hours cannot exceed ${LIMITS.MAX_SLEEP_HOURS}.`,
    };
  }
  
  return { isValid: true };
}

// Schedule validators
export function validateScheduleTime(time: string): ValidationResult {
  if (!isValidTime(time)) {
    return {
      isValid: false,
      error: 'Time must be in HH:MM format (e.g., 09:30).',
    };
  }
  
  return { isValid: true };
}

export function validateTimeRange(startTime: string, endTime: string): ValidationResult {
  const startValidation = validateScheduleTime(startTime);
  if (!startValidation.isValid) {
    return startValidation;
  }
  
  const endValidation = validateScheduleTime(endTime);
  if (!endValidation.isValid) {
    return endValidation;
  }
  
  // Convert times to minutes for comparison
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  const startTotal = startHours * 60 + startMinutes;
  let endTotal = endHours * 60 + endMinutes;
  
  // Handle overnight times (e.g., 23:00 to 07:00); reject same-day reverse (e.g. 17:00 to 09:00) or overly long overnight (> 12h)
  if (endTotal <= startTotal) {
    const overnightMinutes = endTotal + 24 * 60 - startTotal;
    if (overnightMinutes > 12 * 60) {
      return {
        isValid: false,
        error: 'End time must be after start time.',
      };
    }
  }
  
  return { isValid: true };
}

// Combined validators for common form scenarios
export function validateAllFields(
  validations: ValidationResult[]
): { isValid: boolean; errors: string[] } {
  const errors = validations
    .filter(v => !v.isValid)
    .map(v => v.error || 'Invalid value');
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
