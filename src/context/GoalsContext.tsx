import React, { createContext, useCallback, useMemo } from 'react';
import { Goal, GoalType, GoalPeriod } from '@/types/goals';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { useTransactions } from '@/hooks/useTransactions';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useEnergy } from '@/hooks/useEnergy';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
} from 'date-fns';

interface GoalProgress {
  current: number;
  target: number;
  percentage: number;
}

interface GoalsContextType {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  getGoalById: (id: string) => Goal | undefined;
  getGoalProgress: (id: string) => GoalProgress;
}

export const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useLocalStorage<Goal[]>(STORAGE_KEYS.GOALS, []);
  const { transactions } = useTransactions();
  const { workouts } = useWorkouts();
  const { foodEntries } = useEnergy();

  const addGoal = useCallback((goal: Omit<Goal, 'id' | 'createdAt'>) => {
    const newGoal: Goal = {
      ...goal,
      id: generateId(),
      createdAt: new Date(),
    };
    setGoals(prev => [...prev, newGoal]);
  }, [setGoals]);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    setGoals(prev =>
      prev.map(g => g.id === id ? { ...g, ...updates } : g)
    );
  }, [setGoals]);

  const deleteGoal = useCallback((id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  }, [setGoals]);

  const getGoalById = useCallback((id: string) => {
    return goals.find(g => g.id === id);
  }, [goals]);

  const getGoalProgress = useCallback((id: string): GoalProgress => {
    const goal = goals.find(g => g.id === id);
    if (!goal) {
      return { current: 0, target: 0, percentage: 0 };
    }

    const now = new Date();
    let dateRange: { start: Date; end: Date };

    switch (goal.period) {
      case 'weekly':
        dateRange = { start: startOfWeek(now), end: endOfWeek(now) };
        break;
      case 'monthly':
        dateRange = { start: startOfMonth(now), end: endOfMonth(now) };
        break;
      case 'yearly':
        dateRange = { start: startOfYear(now), end: endOfYear(now) };
        break;
    }

    let current = 0;

    switch (goal.type) {
      case 'calories':
        current = foodEntries
          .filter(f => isWithinInterval(new Date(f.date), dateRange))
          .reduce((sum, f) => sum + f.calories, 0);
        break;
      case 'workouts':
        current = workouts
          .filter(w => isWithinInterval(new Date(w.date), dateRange))
          .length;
        break;
      case 'savings':
        const periodTransactions = transactions.filter(t =>
          isWithinInterval(new Date(t.date), dateRange)
        );
        const income = periodTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const expenses = periodTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expenses;
        // For savings goal, target is percentage, current is actual savings rate
        current = income > 0 ? Math.round((balance / income) * 100) : 0;
        break;
    }

    const percentage = goal.target > 0 ? Math.min((current / goal.target) * 100, 100) : 0;

    return { current, target: goal.target, percentage };
  }, [goals, foodEntries, workouts, transactions]);

  return (
    <GoalsContext.Provider value={{
      goals,
      addGoal,
      updateGoal,
      deleteGoal,
      getGoalById,
      getGoalProgress,
    }}>
      {children}
    </GoalsContext.Provider>
  );
}
