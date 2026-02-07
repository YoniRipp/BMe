import { describe, it, expect } from 'vitest';
import {
  calculateTrends,
  getSpendingInsights,
  getFitnessInsights,
  getHealthInsights,
} from './analytics';
import { Transaction } from '@/types/transaction';
import { Workout } from '@/types/workout';
import { FoodEntry, DailyCheckIn } from '@/types/energy';

describe('analytics', () => {
  describe('calculateTrends', () => {
    it('calculates weekly trends', () => {
      const data = [
        { date: new Date(), amount: 100 },
        { date: new Date(), amount: 200 },
      ];
      
      const result = calculateTrends(data, (item) => item.amount, 'week');
      
      expect(result).toBeDefined();
      expect(result.current).toBe(300);
    });

    it('calculates monthly trends', () => {
      const data = [
        { date: new Date(), amount: 100 },
        { date: new Date(), amount: 200 },
      ];
      
      const result = calculateTrends(data, (item) => item.amount, 'month');
      
      expect(result).toBeDefined();
      expect(result.current).toBe(300);
    });

    it('calculates yearly trends', () => {
      const data = [
        { date: new Date(), amount: 100 },
        { date: new Date(), amount: 200 },
      ];
      
      const result = calculateTrends(data, (item) => item.amount, 'year');
      
      expect(result).toBeDefined();
      expect(result.current).toBe(300);
    });
  });

  describe('getSpendingInsights', () => {
    it('calculates spending insights from transactions', () => {
      const transactions: Transaction[] = [
        {
          id: '1',
          type: 'expense',
          amount: 100,
          category: 'Food',
          date: new Date(),
          isRecurring: false,
        },
        {
          id: '2',
          type: 'expense',
          amount: 50,
          category: 'Food',
          date: new Date(),
          isRecurring: false,
        },
        {
          id: '3',
          type: 'income',
          amount: 500,
          category: 'Salary',
          date: new Date(),
          isRecurring: false,
        },
      ];

      const insights = getSpendingInsights(transactions);
      
      expect(insights).toBeDefined();
      expect(insights.totalSpent).toBe(150);
      expect(insights.totalIncome).toBe(500);
      expect(insights.topCategories.length).toBeGreaterThan(0);
    });

    it('handles empty transactions', () => {
      const insights = getSpendingInsights([]);
      
      expect(insights.totalSpent).toBe(0);
      expect(insights.totalIncome).toBe(0);
    });
  });

  describe('getFitnessInsights', () => {
    it('calculates fitness insights from workouts', () => {
      const workouts: Workout[] = [
        {
          id: '1',
          title: 'Morning Run',
          type: 'cardio',
          date: new Date(),
          durationMinutes: 30,
          exercises: [],
        },
        {
          id: '2',
          title: 'Strength Training',
          type: 'strength',
          date: new Date(),
          durationMinutes: 45,
          exercises: [],
        },
      ];

      const insights = getFitnessInsights(workouts);
      
      expect(insights).toBeDefined();
      expect(insights.totalWorkouts).toBe(2);
      expect(insights.averageDuration).toBe(37.5);
    });

    it('handles empty workouts', () => {
      const insights = getFitnessInsights([]);
      
      expect(insights.totalWorkouts).toBe(0);
      expect(insights.averageDuration).toBe(0);
    });
  });

  describe('getHealthInsights', () => {
    it('calculates health insights from food entries and check-ins', () => {
      const foodEntries: FoodEntry[] = [
        {
          id: '1',
          date: new Date(),
          name: 'Chicken',
          calories: 300,
          protein: 50,
          carbs: 0,
          fats: 10,
        },
        {
          id: '2',
          date: new Date(),
          name: 'Rice',
          calories: 200,
          protein: 5,
          carbs: 45,
          fats: 1,
        },
      ];

      const checkIns: DailyCheckIn[] = [
        {
          id: '1',
          date: new Date(),
          sleepHours: 7.5,
        },
        {
          id: '2',
          date: new Date(),
          sleepHours: 8,
        },
      ];

      const insights = getHealthInsights(foodEntries, checkIns);
      
      expect(insights).toBeDefined();
      expect(insights.averageDailyCalories).toBe(250);
      expect(insights.averageSleepHours).toBe(7.75);
    });

    it('handles empty data', () => {
      const insights = getHealthInsights([], []);
      
      expect(insights.averageDailyCalories).toBe(0);
      expect(insights.averageSleepHours).toBe(0);
    });
  });
});
