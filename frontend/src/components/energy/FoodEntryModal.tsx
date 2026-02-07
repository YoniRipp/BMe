import { useState, useEffect, useRef, useCallback } from 'react';
import { FoodEntry } from '@/types/energy';
import { validateFoodName, validateCalories, validateProtein, validateCarbs, validateFats, ValidationResult } from '@/lib/validation';
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

export function FoodEntryModal({ open, onOpenChange, onSave, entry }: FoodEntryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [portionGrams, setPortionGrams] = useState(DEFAULT_REFERENCE_GRAMS);
  const [per100g, setPer100g] = useState<Per100g | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (entry) {
      setFormData({
        name: entry.name,
        calories: entry.calories.toString(),
        protein: entry.protein.toString(),
        carbs: entry.carbs.toString(),
        fats: entry.fats.toString(),
      });
      setPortionGrams(DEFAULT_REFERENCE_GRAMS);
      setPer100g(null);
    } else {
      setFormData({
        name: '',
        calories: '',
        protein: '',
        carbs: '',
        fats: '',
      });
      setPortionGrams(DEFAULT_REFERENCE_GRAMS);
      setPer100g(null);
    }
    setErrors({});
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setDropdownOpen(false);
  }, [entry, open]);

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

  const handleSelectFood = useCallback((item: FoodSearchResult) => {
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
    setFormData({
      name: item.name,
      calories: scaled.calories.toString(),
      protein: scaled.protein.toString(),
      carbs: scaled.carbs.toString(),
      fats: scaled.fats.toString(),
    });
    setSearchQuery('');
    setSearchResults([]);
    setDropdownOpen(false);
    setSearchError(null);
  }, []);

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
        setFormData((prev) => ({
          ...prev,
          calories: scaled.calories.toString(),
          protein: scaled.protein.toString(),
          carbs: scaled.carbs.toString(),
          fats: scaled.fats.toString(),
        }));
      }
    },
    [per100g]
  );

  const handleSearchBlur = useCallback(() => {
    setTimeout(() => setDropdownOpen(false), 150);
  }, []);

  const validateField = (field: string, value: string) => {
    let result: ValidationResult;
    switch (field) {
      case 'name':
        result = validateFoodName(value);
        setErrors(prev => ({
          ...prev,
          name: result.isValid ? '' : (result.error || '')
        }));
        break;
      case 'calories':
        if (!value) {
          setErrors(prev => ({ ...prev, calories: '' }));
          return;
        }
        result = validateCalories(parseInt(value) || 0);
        setErrors(prev => ({
          ...prev,
          calories: result.isValid ? '' : (result.error || '')
        }));
        break;
      case 'protein':
        if (!value) {
          setErrors(prev => ({ ...prev, protein: '' }));
          return;
        }
        result = validateProtein(parseFloat(value) || 0);
        setErrors(prev => ({
          ...prev,
          protein: result.isValid ? '' : (result.error || '')
        }));
        break;
      case 'carbs':
        if (!value) {
          setErrors(prev => ({ ...prev, carbs: '' }));
          return;
        }
        result = validateCarbs(parseFloat(value) || 0);
        setErrors(prev => ({
          ...prev,
          carbs: result.isValid ? '' : (result.error || '')
        }));
        break;
      case 'fats':
        if (!value) {
          setErrors(prev => ({ ...prev, fats: '' }));
          return;
        }
        result = validateFats(parseFloat(value) || 0);
        setErrors(prev => ({
          ...prev,
          fats: result.isValid ? '' : (result.error || '')
        }));
        break;
    }
  };

  const isFormValid = () => {
    if (!formData.name) return false;
    const nameValid = validateFoodName(formData.name).isValid;
    const caloriesValid = !formData.calories || validateCalories(parseInt(formData.calories) || 0).isValid;
    const proteinValid = !formData.protein || validateProtein(parseFloat(formData.protein) || 0).isValid;
    const carbsValid = !formData.carbs || validateCarbs(parseFloat(formData.carbs) || 0).isValid;
    const fatsValid = !formData.fats || validateFats(parseFloat(formData.fats) || 0).isValid;
    return nameValid && caloriesValid && proteinValid && carbsValid && fatsValid && Object.values(errors).every(e => !e);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateField('name', formData.name);
    if (formData.calories) validateField('calories', formData.calories);
    if (formData.protein) validateField('protein', formData.protein);
    if (formData.carbs) validateField('carbs', formData.carbs);
    if (formData.fats) validateField('fats', formData.fats);
    if (!isFormValid()) return;
    onSave({
      date: entry ? entry.date : new Date(),
      name: formData.name,
      calories: parseInt(formData.calories) || 0,
      protein: parseFloat(formData.protein) || 0,
      carbs: parseFloat(formData.carbs) || 0,
      fats: parseFloat(formData.fats) || 0,
    });
    onOpenChange(false);
  };

  const showDropdown = dropdownOpen && searchQuery.trim().length >= MIN_SEARCH_LENGTH && (isSearching || searchResults.length > 0 || !!searchError);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry ? 'Edit Food Entry' : 'Add Food Entry'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Search / dropdown section */}
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

            {/* Manual entry fields */}
            <div>
              <Label htmlFor="name">Food Name</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  validateField('name', e.target.value);
                }}
                onBlur={(e) => validateField('name', e.target.value)}
                placeholder="e.g., Grilled Chicken Breast"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-destructive mt-1">
                  {errors.name}
                </p>
              )}
            </div>

            {per100g !== null && (
              <div>
                <Label htmlFor="portion-grams">Portion (g)</Label>
                <Input
                  id="portion-grams"
                  type="number"
                  min="1"
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
                min="0"
                required
                value={formData.calories}
                onChange={(e) => {
                  setPer100g(null);
                  setFormData({ ...formData, calories: e.target.value });
                  if (e.target.value) validateField('calories', e.target.value);
                  else setErrors(prev => ({ ...prev, calories: '' }));
                }}
                onBlur={(e) => { if (e.target.value) validateField('calories', e.target.value); }}
                aria-invalid={!!errors.calories}
                aria-describedby={errors.calories ? 'calories-error' : undefined}
              />
              {errors.calories && (
                <p id="calories-error" className="text-sm text-destructive mt-1">
                  {errors.calories}
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
                  min="0"
                  value={formData.protein}
                  onChange={(e) => {
                    setPer100g(null);
                    setFormData({ ...formData, protein: e.target.value });
                    if (e.target.value) validateField('protein', e.target.value);
                    else setErrors(prev => ({ ...prev, protein: '' }));
                  }}
                  onBlur={(e) => { if (e.target.value) validateField('protein', e.target.value); }}
                  aria-invalid={!!errors.protein}
                  aria-describedby={errors.protein ? 'protein-error' : undefined}
                />
                {errors.protein && (
                  <p id="protein-error" className="text-sm text-destructive mt-1">
                    {errors.protein}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.carbs}
                  onChange={(e) => {
                    setPer100g(null);
                    setFormData({ ...formData, carbs: e.target.value });
                    if (e.target.value) validateField('carbs', e.target.value);
                    else setErrors(prev => ({ ...prev, carbs: '' }));
                  }}
                  onBlur={(e) => { if (e.target.value) validateField('carbs', e.target.value); }}
                  aria-invalid={!!errors.carbs}
                  aria-describedby={errors.carbs ? 'carbs-error' : undefined}
                />
                {errors.carbs && (
                  <p id="carbs-error" className="text-sm text-destructive mt-1">
                    {errors.carbs}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="fats">Fats (g)</Label>
                <Input
                  id="fats"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.fats}
                  onChange={(e) => {
                    setPer100g(null);
                    setFormData({ ...formData, fats: e.target.value });
                    if (e.target.value) validateField('fats', e.target.value);
                    else setErrors(prev => ({ ...prev, fats: '' }));
                  }}
                  onBlur={(e) => { if (e.target.value) validateField('fats', e.target.value); }}
                  aria-invalid={!!errors.fats}
                  aria-describedby={errors.fats ? 'fats-error' : undefined}
                />
                {errors.fats && (
                  <p id="fats-error" className="text-sm text-destructive mt-1">
                    {errors.fats}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid()}>
              {entry ? 'Update' : 'Add'} Food
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
