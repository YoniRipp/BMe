import { useContext } from 'react';
import { WorkoutContext } from '@/context/WorkoutContext';

export function useWorkouts() {
  const context = useContext(WorkoutContext);
  
  if (!context) {
    throw new Error('useWorkouts must be used within WorkoutProvider');
  }
  
  return context;
}
