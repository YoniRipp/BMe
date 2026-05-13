import { useQuery } from '@tanstack/react-query';
import { request } from '@/core/api/client';

export interface CatalogExercise {
  id: string;
  name: string;
  muscleGroup?: string;
  category?: string;
  imageUrl?: string;
  videoUrl?: string;
}

// Stop-words that shouldn't count toward fuzzy match scoring
const STOP_WORDS = new Set(['the', 'a', 'an', 'with', 'and', 'or', 'of', 'for', 'to']);

function significantWords(name: string): string[] {
  return name.toLowerCase().split(/[\s\-_/]+/).filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

function fuzzyMatch(catalog: CatalogExercise[], query: string): CatalogExercise | undefined {
  const q = query.toLowerCase().trim();
  if (!q) return undefined;

  // 1. Exact match
  const exact = catalog.find(ex => ex.name.toLowerCase().trim() === q);
  if (exact) return exact;

  // 2. Catalog name contains query OR query contains catalog name (substring)
  const substring = catalog.find(ex => {
    const cn = ex.name.toLowerCase().trim();
    return cn.includes(q) || q.includes(cn);
  });
  if (substring) return substring;

  // 3. Significant word overlap — pick the catalog entry with the most matching words
  const queryWords = significantWords(q);
  if (queryWords.length === 0) return undefined;

  let best: CatalogExercise | undefined;
  let bestScore = 0;

  for (const ex of catalog) {
    const exWords = significantWords(ex.name);
    const overlap = queryWords.filter(w => exWords.includes(w)).length;
    // Require at least half the query words to match
    if (overlap > 0 && overlap >= Math.ceil(queryWords.length / 2) && overlap > bestScore) {
      bestScore = overlap;
      best = ex;
    }
  }

  return best;
}

export function useExercises() {
  const { data } = useQuery({
    queryKey: ['exercises'],
    queryFn: (): Promise<CatalogExercise[]> => request('/api/exercises'),
    staleTime: 10 * 60 * 1000,
  });

  const getImageUrl = (exerciseName: string): string | undefined => {
    if (!data) return undefined;
    return fuzzyMatch(data, exerciseName)?.imageUrl;
  };

  const getVideoUrl = (exerciseName: string): string | undefined => {
    if (!data) return undefined;
    return fuzzyMatch(data, exerciseName)?.videoUrl;
  };

  /** Returns the canonical catalog name for an exercise, or the original if no match. */
  const resolveExerciseName = (exerciseName: string): string => {
    if (!data) return exerciseName;
    return fuzzyMatch(data, exerciseName)?.name ?? exerciseName;
  };

  const searchExercises = (query: string): CatalogExercise[] => {
    if (!data || !query.trim()) return data ?? [];
    const normalized = query.toLowerCase().trim();
    return data.filter(ex => ex.name.toLowerCase().includes(normalized));
  };

  return { exercises: data ?? [], getImageUrl, getVideoUrl, resolveExerciseName, searchExercises };
}

/** @deprecated Use useExercises instead */
export function useExerciseImages() {
  const { exercises, getImageUrl } = useExercises();
  return { exerciseImages: exercises, getImageUrl };
}
