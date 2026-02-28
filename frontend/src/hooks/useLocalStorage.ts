import { useState } from 'react';
import { storage } from '@/lib/storage';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = storage.get<T>(key);
      return item !== null ? item : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      storage.set(key, valueToStore);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred. Please try again.';
      console.error(`Error setting ${key} in localStorage:`, errorMessage);
      // Show user-friendly error message (will be replaced with toast notifications later)
      // For now, we'll log it and the UI will show stale data
      // TODO: Integrate with error notification system when toast notifications are implemented
    }
  };

  return [storedValue, setValue] as const;
}
