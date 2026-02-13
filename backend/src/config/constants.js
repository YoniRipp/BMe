/**
 * Application constants. Single source of truth for enums and allowed values.
 */

export const SCHEDULE_CATEGORIES = ['Work', 'Exercise', 'Meal', 'Sleep', 'Personal', 'Social', 'Other'];

export const VALID_RECURRENCE = ['daily', 'weekdays', 'weekends'];

export const TRANSACTION_CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
  expense: ['Food', 'Housing', 'Transportation', 'Entertainment', 'Shopping', 'Healthcare', 'Education', 'Other'],
};

export const WORKOUT_TYPES = ['strength', 'cardio', 'flexibility', 'sports'];

export const GOAL_TYPES = ['calories', 'workouts', 'savings'];

export const GOAL_PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];
