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
 * Export all application data as JSON.
 * Callers (DataManagementSection, DataExportModal) pass API-backed data from TanStack Query cache.
 * See backend README for backup and migration runbook.
 */
export function exportAllData(data: ExportData): string {
  const payload: ExportData = {
    version: data.version ?? '1.0.0',
    exportDate: data.exportDate ?? new Date().toISOString(),
    transactions: data.transactions ?? [],
    workouts: data.workouts ?? [],
    foodEntries: data.foodEntries ?? [],
    checkIns: data.checkIns ?? [],
    scheduleItems: data.scheduleItems ?? [],
    groups: data.groups ?? [],
    settings: data.settings,
  };
  return JSON.stringify(payload, null, 2);
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

export type ExportCSVType = 'transactions' | 'workouts' | 'food';

export interface ExportCSVData {
  transactions: Transaction[];
  workouts: Workout[];
  foodEntries: FoodEntry[];
}

function getCSVRows(
  type: ExportCSVType,
  data: ExportCSVData
): (string | number)[][] {
  switch (type) {
    case 'transactions':
      return (data.transactions ?? []).map(t => [
        new Date(t.date).toLocaleDateString(),
        t.type,
        t.amount.toString(),
        t.category,
        t.description || '',
        t.isRecurring ? 'Yes' : 'No',
      ]);
    case 'workouts':
      return (data.workouts ?? []).map(w => [
        new Date(w.date).toLocaleDateString(),
        w.title,
        w.type,
        w.durationMinutes.toString(),
        (w.exercises ?? [])
          .map(e =>
            `${e.name} (${e.sets}x${e.reps}${e.weight ? ` @ ${e.weight}lbs` : ''})`
          )
          .join('; '),
      ]);
    case 'food':
      return (data.foodEntries ?? []).map(f => [
        new Date(f.date).toLocaleDateString(),
        f.name,
        f.calories.toString(),
        f.protein.toString(),
        f.carbs.toString(),
        f.fats.toString(),
      ]);
    default:
      return [];
  }
}

const EXPORT_CSV_HEADERS: Record<ExportCSVType, string[]> = {
  transactions: ['Date', 'Type', 'Amount', 'Category', 'Description', 'Recurring'],
  workouts: ['Date', 'Title', 'Type', 'Duration (min)', 'Exercises'],
  food: ['Date', 'Name', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fats (g)'],
};

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Export data to CSV. Use API-backed data (e.g. from TanStack Query cache).
 */
export function exportToCSV(type: ExportCSVType, data: ExportCSVData): string {
  const headers = EXPORT_CSV_HEADERS[type];
  const rows = getCSVRows(type, data);
  const csv =
    headers.map(escapeCSV).join(',') + '\n' +
    rows.map(row => row.map(cell => escapeCSV(String(cell))).join(',')).join('\n');
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
