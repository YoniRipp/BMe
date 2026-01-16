export type GoalType = 'calories' | 'workouts' | 'savings';
export type GoalPeriod = 'weekly' | 'monthly' | 'yearly';

export interface Goal {
  id: string;
  type: GoalType;
  target: number;
  period: GoalPeriod;
  createdAt: Date;
  // Note: 'current' is calculated, not stored
}

export const GOAL_TYPES: GoalType[] = ['calories', 'workouts', 'savings'];
export const GOAL_PERIODS: GoalPeriod[] = ['weekly', 'monthly', 'yearly'];
