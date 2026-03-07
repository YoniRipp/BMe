/**
 * Domain types — single source of truth for all entity shapes.
 * Models, services, and controllers import from here.
 */

// ─── Workout ────────────────────────────────────────────────
export type WorkoutType = 'strength' | 'cardio' | 'flexibility' | 'sports';

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  repsPerSet?: number[];
  weight?: number;
  notes?: string;
}

export interface Workout {
  id: string;
  date: string;
  title: string;
  type: WorkoutType;
  durationMinutes: number;
  exercises: Exercise[];
  notes?: string;
  source?: string;
  externalId?: string;
}

export interface CreateWorkoutInput {
  userId: string;
  date: string;
  title: string;
  type: WorkoutType;
  durationMinutes: number;
  exercises: Exercise[];
  notes?: string;
}

export interface UpdateWorkoutInput {
  date?: string;
  title?: string;
  type?: WorkoutType;
  durationMinutes?: number;
  exercises?: Exercise[];
  notes?: string;
}

// ─── Food Entry ─────────────────────────────────────────────
export interface FoodEntry {
  id: string;
  date: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  portionAmount?: number;
  portionUnit?: string;
  servingType?: string;
  startTime?: string;
  endTime?: string;
  source?: string;
  externalId?: string;
}

export interface CreateFoodEntryInput {
  userId: string;
  date: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  portionAmount?: number;
  portionUnit?: string;
  servingType?: string;
  startTime?: string;
  endTime?: string;
}

export interface UpdateFoodEntryInput {
  date?: string;
  name?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  portionAmount?: number;
  portionUnit?: string;
  servingType?: string;
  startTime?: string;
  endTime?: string;
}

// ─── Daily Check-In ─────────────────────────────────────────
export interface DailyCheckIn {
  id: string;
  date: string;
  sleepHours?: number;
  source?: string;
  externalId?: string;
}

export interface CreateCheckInInput {
  userId: string;
  date: string;
  sleepHours?: number | null;
}

export interface UpdateCheckInInput {
  date?: string;
  sleepHours?: number | null;
}

// ─── Goal ───────────────────────────────────────────────────
export type GoalType = 'calories' | 'workouts' | 'sleep';
export type GoalPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Goal {
  id: string;
  type: GoalType;
  target: number;
  period: GoalPeriod;
  createdAt?: string;
}

export interface CreateGoalInput {
  userId: string;
  type: GoalType;
  target: number;
  period: GoalPeriod;
}

export interface UpdateGoalInput {
  type?: GoalType;
  target?: number;
  period?: GoalPeriod;
}

// ─── Pagination ─────────────────────────────────────────────
export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ─── Health Sync ───────────────────────────────────────────
export type HealthPlatform = 'apple_health' | 'health_connect';
export type HealthMetricType = 'steps' | 'heart_rate_avg' | 'heart_rate_resting' | 'active_calories' | 'total_calories_burned';

export interface HealthSyncState {
  id: string;
  platform: HealthPlatform;
  dataType: string;
  lastSyncedAt: string;
  enabled: boolean;
}

export interface HealthMetric {
  id: string;
  date: string;
  metricType: HealthMetricType;
  value: number;
  source: string;
}

export interface SyncWorkoutItem {
  externalId: string;
  date: string;
  title: string;
  type: string;
  durationMinutes: number;
  caloriesBurned?: number;
  heartRateAvg?: number;
  exercises?: Exercise[];
}

export interface SyncSleepItem {
  externalId: string;
  date: string;
  sleepHours: number;
  stages?: { deep: number; light: number; rem: number; awake: number };
}

export interface SyncNutritionItem {
  externalId: string;
  date: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  mealType?: string;
}

export interface SyncMetricsItem {
  date: string;
  steps?: number;
  activeCalories?: number;
  heartRateAvg?: number;
  heartRateResting?: number;
}

export interface HealthSyncPayload {
  platform: HealthPlatform;
  workouts?: SyncWorkoutItem[];
  sleep?: SyncSleepItem[];
  nutrition?: SyncNutritionItem[];
  metrics?: SyncMetricsItem[];
  syncedAt: string;
}

export interface HealthSyncResult {
  workoutsCreated: number;
  workoutsUpdated: number;
  sleepSynced: number;
  nutritionSynced: number;
  metricsSynced: number;
}

// ─── API Error ──────────────────────────────────────────────
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
