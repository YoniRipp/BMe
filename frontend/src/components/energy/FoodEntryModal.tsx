import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FoodEntry } from '@/types/energy';
import { foodEntryFormSchema, type FoodEntryFormValues } from '@/schemas/foodEntry';
import { useDebounce } from '@/hooks/useDebounce';
import { searchFoods, type FoodSearchResult } from '@/features/energy/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FoodEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: Omit<FoodEntry, 'id'>) => void;
  entry?: FoodEntry;
}

const MIN_SEARCH_LENGTH = 2;
const DEFAULT_REFERENCE_GRAMS = 100;

type Per100g = { calories: number; protein: number; carbs: number; fats: number };

function scaleFromPer100g(per100g: Per100g, portionGrams: number): Per100g {
  const factor = portionGrams / DEFAULT_REFERENCE_GRAMS;
  return {
    calories: Math.round(per100g.calories * factor),
    protein: Math.round(per100g.protein * factor * 10) / 10,
    carbs: Math.round(per100g.carbs * factor * 10) / 10,
    fats: Math.round(per100g.fats * factor * 10) / 10,
  };
}

const defaultValues: FoodEntryFormValues = {
  name: '',
  calories: '',
  protein: '',
  carbs: '',
  fats: '',
};

export function FoodEntryModal({ open, onOpenChange, onSave, entry }: FoodEntryModalProps) {
  const [portionGrams, setPortionGrams] = useState(DEFAULT_REFERENCE_GRAMS);
  const [per100g, setPer100g] = useState<Per100g | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isValid },
  } = useForm<FoodEntryFormValues>({
    resolver: zodResolver(foodEntryFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  useEffect(() => {
    if (!open) return;
    if (entry) {
      reset({
        name: entry.name,
        calories: entry.calories.toString(),
        protein: entry.protein.toString(),
        carbs: entry.carbs.toString(),
        fats: entry.fats.toString(),
      });
    } else {
      reset(defaultValues);
    }
    setPortionGrams(DEFAULT_REFERENCE_GRAMS);
    setPer100g(null);
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setDropdownOpen(false);
  }, [entry, open, reset]);

  useEffect(() => {
    const q = debouncedSearchQuery.trim();
    if (q.length < MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    setSearchError(null);
    searchFoods(q, 10)
      .then((results) => {
        if (!cancelled) {
          setSearchResults(results);
          setSearchError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setSearchError(e instanceof Error ? e.message : 'Search failed');
          setSearchResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearchQuery]);

  const handleSelectFood = useCallback(
    (item: FoodSearchResult) => {
      const refGrams = item.referenceGrams ?? DEFAULT_REFERENCE_GRAMS;
      const factor = DEFAULT_REFERENCE_GRAMS / refGrams;
      const base: Per100g = {
        calories: Math.round(item.calories * factor),
        protein: Math.round(item.protein * factor * 10) / 10,
        carbs: Math.round(item.carbs * factor * 10) / 10,
        fats: Math.round(item.fats * factor * 10) / 10,
      };
      setPer100g(base);
      setPortionGrams(DEFAULT_REFERENCE_GRAMS);
      const scaled = scaleFromPer100g(base, DEFAULT_REFERENCE_GRAMS);
      setValue('name', item.name);
      setValue('calories', scaled.calories.toString());
      setValue('protein', scaled.protein.toString());
      setValue('carbs', scaled.carbs.toString());
      setValue('fats', scaled.fats.toString());
      setSearchQuery('');
      setSearchResults([]);
      setDropdownOpen(false);
      setSearchError(null);
    },
    [setValue]
  );

  const handlePortionChange = useCallback(
    (value: string) => {
      const g = parseInt(value, 10);
      if (!Number.isFinite(g) || g < 1) {
        setPortionGrams(DEFAULT_REFERENCE_GRAMS);
        return;
      }
      setPortionGrams(g);
      if (per100g) {
        const scaled = scaleFromPer100g(per100g, g);
        setValue('calories', scaled.calories.toString());
        setValue('protein', scaled.protein.toString());
        setValue('carbs', scaled.carbs.toString());
        setValue('fats', scaled.fats.toString());
      }
    },
    [per100g, setValue]
  );

  const handleSearchBlur = useCallback(() => {
    setTimeout(() => setDropdownOpen(false), 150);
  }, []);

  const onSubmit = (data: FoodEntryFormValues) => {
    onSave({
      date: entry ? entry.date : new Date(),
      name: data.name,
      calories: parseFloat(data.calories),
      protein: parseFloat(data.protein),
      carbs: parseFloat(data.carbs),
      fats: parseFloat(data.fats),
    });
    onOpenChange(false);
  };

  const showDropdown =
    dropdownOpen &&
    searchQuery.trim().length >= MIN_SEARCH_LENGTH &&
    (isSearching || searchResults.length > 0 || !!searchError);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry ? 'Edit Food Entry' : 'Add Food Entry'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div ref={searchContainerRef} className="relative">
              <Label htmlFor="food-search">Search food (optional)</Label>
              <Input
                id="food-search"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => searchQuery.trim().length >= MIN_SEARCH_LENGTH && setDropdownOpen(true)}
                onBlur={handleSearchBlur}
                placeholder="e.g., chicken, apple"
                aria-label="Search for food to auto-fill nutrients"
                aria-autocomplete="list"
                aria-expanded={showDropdown}
                aria-controls="food-search-results"
                className={cn(showDropdown && 'rounded-b-none border-b-0')}
              />
              {showDropdown && (
                <div
                  id="food-search-results"
                  role="listbox"
                  className="absolute z-50 w-full rounded-b-md border border-t-0 border-input bg-popover shadow-md max-h-48 overflow-auto"
                >
                  {isSearching && (
                    <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching...
                    </div>
                  )}
                  {!isSearching && searchError && (
                    <p className="px-3 py-3 text-sm text-destructive">{searchError}</p>
                  )}
                  {!isSearching && !searchError && searchResults.length === 0 && (
                    <p className="px-3 py-3 text-sm text-muted-foreground">
                      No results – enter manually below.
                    </p>
                  )}
                  {!isSearching && !searchError && searchResults.length > 0 && (
                    <ul className="py-1">
                      {searchResults.map((item, idx) => (
                        <li key={`${item.name}-${idx}`} role="option">
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectFood(item);
                            }}
                          >
                            <span className="font-medium">{item.name}</span>
                            <span className="ml-2 text-muted-foreground">
                              {item.calories} cal per 100 g
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="name">Food Name</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Grilled Chicken Breast"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-destructive mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {per100g !== null && (
              <div>
                <Label htmlFor="portion-grams">Portion (g)</Label>
                <Input
                  id="portion-grams"
                  type="number"
                  min={1}
                  value={portionGrams}
                  onChange={(e) => handlePortionChange(e.target.value)}
                  aria-label="Portion size in grams; values scale from per 100 g"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Values below are scaled from {DEFAULT_REFERENCE_GRAMS} g (per 100 g).
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                min={0}
                {...register('calories', {
                  onChange: () => setPer100g(null),
                })}
                aria-invalid={!!errors.calories}
                aria-describedby={errors.calories ? 'calories-error' : undefined}
              />
              {errors.calories && (
                <p id="calories-error" className="text-sm text-destructive mt-1">
                  {errors.calories.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="protein">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  step="0.1"
                  min={0}
                  {...register('protein', { onChange: () => setPer100g(null) })}
                  aria-invalid={!!errors.protein}
                  aria-describedby={errors.protein ? 'protein-error' : undefined}
                />
                {errors.protein && (
                  <p id="protein-error" className="text-sm text-destructive mt-1">
                    {errors.protein.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  step="0.1"
                  min={0}
                  {...register('carbs', { onChange: () => setPer100g(null) })}
                  aria-invalid={!!errors.carbs}
                  aria-describedby={errors.carbs ? 'carbs-error' : undefined}
                />
                {errors.carbs && (
                  <p id="carbs-error" className="text-sm text-destructive mt-1">
                    {errors.carbs.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="fats">Fats (g)</Label>
                <Input
                  id="fats"
                  type="number"
                  step="0.1"
                  min={0}
                  {...register('fats', { onChange: () => setPer100g(null) })}
                  aria-invalid={!!errors.fats}
                  aria-describedby={errors.fats ? 'fats-error' : undefined}
                />
                {errors.fats && (
                  <p id="fats-error" className="text-sm text-destructive mt-1">
                    {errors.fats.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              {entry ? 'Update' : 'Add'} Food
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
