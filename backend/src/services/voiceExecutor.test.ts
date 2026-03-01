/**
 * Voice executor — executeActions with mocked services.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeActions } from './voiceExecutor.js';

const mockTransactionCreate = vi.fn();
const mockTransactionUpdate = vi.fn();
const mockTransactionRemove = vi.fn();
const mockTransactionList = vi.fn();

const mockScheduleCreateBatch = vi.fn();
const mockScheduleUpdate = vi.fn();
const mockScheduleRemove = vi.fn();
const mockScheduleList = vi.fn();

const mockWorkoutCreate = vi.fn();
const mockWorkoutUpdate = vi.fn();
const mockWorkoutRemove = vi.fn();
const mockWorkoutList = vi.fn();

const mockFoodEntryCreate = vi.fn();
const mockFoodEntryUpdate = vi.fn();
const mockFoodEntryRemove = vi.fn();
const mockFoodEntryList = vi.fn();

const mockDailyCheckInCreate = vi.fn();
const mockDailyCheckInUpdate = vi.fn();
const mockDailyCheckInRemove = vi.fn();
const mockDailyCheckInList = vi.fn();

const mockGoalCreate = vi.fn();
const mockGoalUpdate = vi.fn();
const mockGoalRemove = vi.fn();
const mockGoalList = vi.fn();

vi.mock('./transaction.js', () => ({
  create: (...args: unknown[]) => mockTransactionCreate(...args),
  update: (...args: unknown[]) => mockTransactionUpdate(...args),
  remove: (...args: unknown[]) => mockTransactionRemove(...args),
  list: (...args: unknown[]) => mockTransactionList(...args),
}));

vi.mock('./schedule.js', () => ({
  createBatch: (...args: unknown[]) => mockScheduleCreateBatch(...args),
  update: (...args: unknown[]) => mockScheduleUpdate(...args),
  remove: (...args: unknown[]) => mockScheduleRemove(...args),
  list: (...args: unknown[]) => mockScheduleList(...args),
}));

vi.mock('./workout.js', () => ({
  create: (...args: unknown[]) => mockWorkoutCreate(...args),
  update: (...args: unknown[]) => mockWorkoutUpdate(...args),
  remove: (...args: unknown[]) => mockWorkoutRemove(...args),
  list: (...args: unknown[]) => mockWorkoutList(...args),
}));

vi.mock('./foodEntry.js', () => ({
  create: (...args: unknown[]) => mockFoodEntryCreate(...args),
  update: (...args: unknown[]) => mockFoodEntryUpdate(...args),
  remove: (...args: unknown[]) => mockFoodEntryRemove(...args),
  list: (...args: unknown[]) => mockFoodEntryList(...args),
}));

vi.mock('./dailyCheckIn.js', () => ({
  create: (...args: unknown[]) => mockDailyCheckInCreate(...args),
  update: (...args: unknown[]) => mockDailyCheckInUpdate(...args),
  remove: (...args: unknown[]) => mockDailyCheckInRemove(...args),
  list: (...args: unknown[]) => mockDailyCheckInList(...args),
}));

vi.mock('./goal.js', () => ({
  create: (...args: unknown[]) => mockGoalCreate(...args),
  update: (...args: unknown[]) => mockGoalUpdate(...args),
  remove: (...args: unknown[]) => mockGoalRemove(...args),
  list: (...args: unknown[]) => mockGoalList(...args),
}));

vi.mock('../db/index.js', () => ({
  isDbConfigured: vi.fn().mockReturnValue(true),
}));

import { isDbConfigured } from '../db/index.js';

describe('voiceExecutor', () => {
  const userId = 'user-1';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isDbConfigured).mockReturnValue(true);
  });

  describe('DB not configured', () => {
    it('returns failure for all actions when DB not configured', async () => {
      vi.mocked(isDbConfigured).mockReturnValue(false);

      const results = await executeActions(
        [
          { intent: 'add_transaction', type: 'expense', amount: 10 },
          { intent: 'add_workout', title: 'Run' },
        ],
        userId
      );

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ intent: 'add_transaction', success: false, message: 'Database not configured' });
      expect(results[1]).toEqual({ intent: 'add_workout', success: false, message: 'Database not configured' });
      expect(mockTransactionCreate).not.toHaveBeenCalled();
      expect(mockWorkoutCreate).not.toHaveBeenCalled();
    });
  });

  describe('unknown intent', () => {
    it('returns failure for unknown intent', async () => {
      const results = await executeActions([{ intent: 'unknown', message: 'Could not understand' }], userId);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({ intent: 'unknown', success: false, message: 'Could not understand' });
    });
  });

  describe('add_transaction', () => {
    it('creates transaction and returns success', async () => {
      mockTransactionCreate.mockResolvedValue(undefined);

      const results = await executeActions(
        [
          {
            intent: 'add_transaction',
            type: 'expense',
            amount: 50,
            category: 'Food',
            description: 'Coffee',
          },
        ],
        userId
      );

      expect(results).toEqual([{ intent: 'add_transaction', success: true }]);
      expect(mockTransactionCreate).toHaveBeenCalledWith(userId, {
        type: 'expense',
        amount: 50,
        currency: 'USD',
        category: 'Food',
        description: 'Coffee',
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        isRecurring: false,
      });
    });
  });

  describe('edit_transaction', () => {
    it('returns failure when transaction not found (by id)', async () => {
      mockTransactionList.mockResolvedValue({ items: [], total: 0 });

      const results = await executeActions(
        [{ intent: 'edit_transaction', transactionId: 'tx-99', amount: 20 }],
        userId
      );

      expect(results).toEqual([{ intent: 'edit_transaction', success: false, message: 'Transaction not found' }]);
      expect(mockTransactionUpdate).not.toHaveBeenCalled();
    });

    it('updates transaction when found by description', async () => {
      const tx = { id: 'tx-1', description: 'Coffee purchase', date: '2025-02-24' };
      mockTransactionList.mockResolvedValue({ items: [tx], total: 1 });
      mockTransactionUpdate.mockResolvedValue(undefined);

      const results = await executeActions(
        [{ intent: 'edit_transaction', description: 'coffee', amount: 25 }],
        userId
      );

      expect(results).toEqual([{ intent: 'edit_transaction', success: true }]);
      expect(mockTransactionUpdate).toHaveBeenCalledWith(userId, 'tx-1', expect.objectContaining({ amount: 25 }));
    });
  });

  describe('delete_transaction', () => {
    it('returns failure when transaction not found', async () => {
      mockTransactionList.mockResolvedValue({ items: [], total: 0 });

      const results = await executeActions(
        [{ intent: 'delete_transaction', transactionId: 'tx-99' }],
        userId
      );

      expect(results).toEqual([{ intent: 'delete_transaction', success: false, message: 'Transaction not found' }]);
      expect(mockTransactionRemove).not.toHaveBeenCalled();
    });

    it('removes transaction when found by transactionId', async () => {
      const tx = { id: 'tx-1', description: 'Coffee' };
      mockTransactionList.mockResolvedValue({ items: [tx], total: 1 });
      mockTransactionRemove.mockResolvedValue(undefined);

      const results = await executeActions(
        [{ intent: 'delete_transaction', transactionId: 'tx-1' }],
        userId
      );

      expect(results).toEqual([{ intent: 'delete_transaction', success: true }]);
      expect(mockTransactionRemove).toHaveBeenCalledWith(userId, 'tx-1');
    });
  });

  describe('add_schedule', () => {
    it('returns failure when no items', async () => {
      const results = await executeActions([{ intent: 'add_schedule', items: [] }], userId);

      expect(results).toEqual([{ intent: 'add_schedule', success: false, message: 'No schedule items' }]);
      expect(mockScheduleCreateBatch).not.toHaveBeenCalled();
    });

    it('creates schedule batch and returns success', async () => {
      mockScheduleCreateBatch.mockResolvedValue(undefined);

      const results = await executeActions(
        [
          {
            intent: 'add_schedule',
            items: [{ title: 'Meeting', startTime: '09:00', endTime: '10:00', category: 'Work' }],
          },
        ],
        userId
      );

      expect(results).toEqual([{ intent: 'add_schedule', success: true, message: 'Added 1 item(s)' }]);
      expect(mockScheduleCreateBatch).toHaveBeenCalledWith(userId, [
        expect.objectContaining({
          title: 'Meeting',
          startTime: '09:00',
          endTime: '10:00',
          category: 'Work',
        }),
      ]);
    });
  });

  describe('edit_schedule', () => {
    it('returns failure when schedule item not found', async () => {
      mockScheduleList.mockResolvedValue([]);

      const results = await executeActions(
        [{ intent: 'edit_schedule', itemTitle: 'Unknown', startTime: '10:00' }],
        userId
      );

      expect(results).toEqual([{ intent: 'edit_schedule', success: false, message: 'Schedule item not found' }]);
      expect(mockScheduleUpdate).not.toHaveBeenCalled();
    });

    it('updates schedule when found by itemId', async () => {
      const item = { id: 's1', title: 'Meeting', date: '2025-02-24' };
      mockScheduleList.mockResolvedValue([item]);
      mockScheduleUpdate.mockResolvedValue(undefined);

      const results = await executeActions(
        [{ intent: 'edit_schedule', itemId: 's1', startTime: '10:00', endTime: '11:00' }],
        userId
      );

      expect(results).toEqual([{ intent: 'edit_schedule', success: true }]);
      expect(mockScheduleUpdate).toHaveBeenCalledWith(userId, 's1', {
        startTime: '10:00',
        endTime: '11:00',
        title: undefined,
        category: undefined,
      });
    });
  });

  describe('add_workout', () => {
    it('creates workout and returns success', async () => {
      mockWorkoutCreate.mockResolvedValue(undefined);

      const results = await executeActions(
        [
          {
            intent: 'add_workout',
            title: 'Run',
            type: 'cardio',
            durationMinutes: 30,
          },
        ],
        userId
      );

      expect(results).toEqual([{ intent: 'add_workout', success: true }]);
      expect(mockWorkoutCreate).toHaveBeenCalledWith(userId, {
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        title: 'Run',
        type: 'cardio',
        durationMinutes: 30,
        exercises: [],
        notes: undefined,
      });
    });
  });

  describe('edit_workout', () => {
    it('returns failure when workout not found', async () => {
      mockWorkoutList.mockResolvedValue([]);

      const results = await executeActions(
        [{ intent: 'edit_workout', workoutTitle: 'Unknown', title: 'New Title' }],
        userId
      );

      expect(results).toEqual([{ intent: 'edit_workout', success: false, message: 'Workout not found' }]);
    });
  });

  describe('add_food', () => {
    it('creates food entry and returns success', async () => {
      mockFoodEntryCreate.mockResolvedValue(undefined);

      const results = await executeActions(
        [
          {
            intent: 'add_food',
            name: 'Apple',
            calories: 50,
            protein: 0,
            carbs: 12,
            fats: 0,
          },
        ],
        userId
      );

      expect(results).toEqual([{ intent: 'add_food', success: true }]);
      expect(mockFoodEntryCreate).toHaveBeenCalledWith(userId, {
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        name: 'Apple',
        calories: 50,
        protein: 0,
        carbs: 12,
        fats: 0,
        portionAmount: undefined,
        portionUnit: undefined,
        startTime: undefined,
        endTime: undefined,
      });
    });
  });

  describe('log_sleep', () => {
    it('creates check-in when none exists', async () => {
      mockDailyCheckInList.mockResolvedValue([]);
      mockDailyCheckInCreate.mockResolvedValue(undefined);

      const results = await executeActions(
        [{ intent: 'log_sleep', sleepHours: 7, date: '2025-02-24' }],
        userId
      );

      expect(results).toEqual([{ intent: 'log_sleep', success: true }]);
      expect(mockDailyCheckInCreate).toHaveBeenCalledWith(userId, {
        date: '2025-02-24',
        sleepHours: 7,
      });
    });

    it('updates check-in when one exists for date', async () => {
      const existing = { id: 'c1', date: '2025-02-24', sleepHours: 6 };
      mockDailyCheckInList.mockResolvedValue([existing]);
      mockDailyCheckInUpdate.mockResolvedValue(undefined);

      const results = await executeActions(
        [{ intent: 'log_sleep', sleepHours: 8, date: '2025-02-24' }],
        userId
      );

      expect(results).toEqual([{ intent: 'log_sleep', success: true }]);
      expect(mockDailyCheckInUpdate).toHaveBeenCalledWith(userId, 'c1', { sleepHours: 8 });
    });
  });

  describe('add_goal', () => {
    it('creates goal and returns success', async () => {
      mockGoalCreate.mockResolvedValue(undefined);

      const results = await executeActions(
        [
          {
            intent: 'add_goal',
            type: 'workouts',
            target: 3,
            period: 'weekly',
          },
        ],
        userId
      );

      expect(results).toEqual([{ intent: 'add_goal', success: true }]);
      expect(mockGoalCreate).toHaveBeenCalledWith(userId, {
        type: 'workouts',
        target: 3,
        period: 'weekly',
      });
    });
  });

  describe('error handling', () => {
    it('captures service errors and returns failure', async () => {
      mockTransactionCreate.mockRejectedValue(new Error('DB connection failed'));

      const results = await executeActions(
        [{ intent: 'add_transaction', type: 'expense', amount: 10 }],
        userId
      );

      expect(results).toEqual([
        { intent: 'add_transaction', success: false, message: 'DB connection failed' },
      ]);
    });
  });
});
