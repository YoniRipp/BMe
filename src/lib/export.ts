import { storage, STORAGE_KEYS } from './storage';
import { Transaction } from '@/types/transaction';
import { Workout } from '@/types/workout';
import { FoodEntry } from '@/types/energy';
import { ScheduleItem } from '@/types/schedule';
import { Group } from '@/types/group';

export interface ExportData {
  version: string;
  exportDate: string;
  transactions: Transaction[];
  workouts: Workout[];
  foodEntries: FoodEntry[];
  checkIns: any[];
  scheduleItems: ScheduleItem[];
  groups: Group[];
  settings?: any;
}

/**
 * Export all application data as JSON
 */
export function exportAllData(): string {
  const data: ExportData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    transactions: storage.get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS) || [],
    workouts: storage.get<Workout[]>(STORAGE_KEYS.WORKOUTS) || [],
    foodEntries: storage.get<FoodEntry[]>(STORAGE_KEYS.FOOD_ENTRIES) || [],
    checkIns: storage.get<any[]>(STORAGE_KEYS.ENERGY) || [],
    scheduleItems: storage.get<ScheduleItem[]>(STORAGE_KEYS.SCHEDULE) || [],
    groups: storage.get<Group[]>(STORAGE_KEYS.GROUPS) || [],
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Import data from JSON string
 */
export function importAllData(jsonString: string): { success: boolean; error?: string } {
  try {
    const data: ExportData = JSON.parse(jsonString);

    // Validate data structure
    if (!data.version || !data.exportDate) {
      return { success: false, error: 'Invalid data format: missing version or export date' };
    }

    // Validate and import each data type
    if (data.transactions && Array.isArray(data.transactions)) {
      storage.set(STORAGE_KEYS.TRANSACTIONS, data.transactions);
    }

    if (data.workouts && Array.isArray(data.workouts)) {
      storage.set(STORAGE_KEYS.WORKOUTS, data.workouts);
    }

    if (data.foodEntries && Array.isArray(data.foodEntries)) {
      storage.set(STORAGE_KEYS.FOOD_ENTRIES, data.foodEntries);
    }

    if (data.checkIns && Array.isArray(data.checkIns)) {
      storage.set(STORAGE_KEYS.ENERGY, data.checkIns);
    }

    if (data.scheduleItems && Array.isArray(data.scheduleItems)) {
      storage.set(STORAGE_KEYS.SCHEDULE, data.scheduleItems);
    }

    if (data.groups && Array.isArray(data.groups)) {
      storage.set(STORAGE_KEYS.GROUPS, data.groups);
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to import data: ${errorMessage}` };
  }
}

/**
 * Export transactions to CSV
 */
export function exportToCSV(type: 'transactions' | 'workouts' | 'food'): string {
  let csv = '';
  let headers: string[] = [];
  let rows: any[] = [];

  switch (type) {
    case 'transactions':
      headers = ['Date', 'Type', 'Amount', 'Category', 'Description', 'Recurring'];
      const transactions = storage.get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS) || [];
      rows = transactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.type,
        t.amount.toString(),
        t.category,
        t.description || '',
        t.isRecurring ? 'Yes' : 'No',
      ]);
      break;

    case 'workouts':
      headers = ['Date', 'Title', 'Type', 'Duration (min)', 'Exercises'];
      const workouts = storage.get<Workout[]>(STORAGE_KEYS.WORKOUTS) || [];
      rows = workouts.map(w => [
        new Date(w.date).toLocaleDateString(),
        w.title,
        w.type,
        w.durationMinutes.toString(),
        w.exercises.map(e => `${e.name} (${e.sets}x${e.reps}${e.weight ? ` @ ${e.weight}lbs` : ''})`).join('; '),
      ]);
      break;

    case 'food':
      headers = ['Date', 'Name', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fats (g)'];
      const foodEntries = storage.get<FoodEntry[]>(STORAGE_KEYS.FOOD_ENTRIES) || [];
      rows = foodEntries.map(f => [
        new Date(f.date).toLocaleDateString(),
        f.name,
        f.calories.toString(),
        f.protein.toString(),
        f.carbs.toString(),
        f.fats.toString(),
      ]);
      break;
  }

  // Escape CSV values (handle commas and quotes)
  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  // Build CSV
  csv = headers.map(escapeCSV).join(',') + '\n';
  csv += rows.map(row => row.map(escapeCSV).join(',')).join('\n');

  return csv;
}

/**
 * Download data as file
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'application/json') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
