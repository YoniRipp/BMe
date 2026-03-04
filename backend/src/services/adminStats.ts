import * as adminStatsModel from '../models/adminStats.js';
import { logger } from '../lib/logger.js';

async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    logger.error({ err, label }, 'Admin stats query failed, using fallback');
    return fallback;
  }
}

export async function getAll() {
  const [overview, userGrowth, activityByDay, featureAdoption, recentErrors, tableSizes] =
    await Promise.all([
      safe('overview', () => adminStatsModel.getOverviewStats(), { totalUsers: 0, newUsersToday: 0, newUsersThisWeek: 0, workoutsToday: 0, foodEntriesToday: 0, checkInsToday: 0, activeGoals: 0 }),
      safe('userGrowth', () => adminStatsModel.getUserGrowth(), []),
      safe('activityByDay', () => adminStatsModel.getActivityByDay(), []),
      safe('featureAdoption', () => adminStatsModel.getFeatureAdoption(), { workouts: 0, foodEntries: 0, checkIns: 0, goals: 0, totalUsers: 0 }),
      safe('recentErrors', () => adminStatsModel.getRecentErrors(), { count: 0, lastErrorMessage: null }),
      safe('tableSizes', () => adminStatsModel.getTableSizes(), []),
    ]);

  return { overview, userGrowth, activityByDay, featureAdoption, recentErrors, tableSizes };
}
