import { useState, useMemo } from 'react';
import { useWorkouts } from '@/hooks/useWorkouts';
import { Workout, WORKOUT_TYPES } from '@/types/workout';
import { PageHeader } from '@/components/shared/PageHeader';
import { WorkoutCard } from '@/components/body/WorkoutCard';
import { WorkoutModal } from '@/components/body/WorkoutModal';
import { WeeklyWorkoutGrid } from '@/components/body/WeeklyWorkoutGrid';
import { SearchBar } from '@/components/shared/SearchBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Dumbbell, Plus, Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';

export function Body() {
  const { workouts, addWorkout, updateWorkout, deleteWorkout } = useWorkouts();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [durationRange, setDurationRange] = useState<{ min: string; max: string }>({ min: '', max: '' });

  const filteredWorkouts = useMemo(() => {
    let filtered = workouts;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(w =>
        w.title.toLowerCase().includes(query) ||
        w.type.toLowerCase().includes(query) ||
        w.notes?.toLowerCase().includes(query) ||
        w.exercises.some(e => e.name.toLowerCase().includes(query))
      );
    }
    
    // Date range filter
    if (dateRange.start) {
      const startDate = startOfDay(new Date(dateRange.start));
      filtered = filtered.filter(w => new Date(w.date) >= startDate);
    }
    if (dateRange.end) {
      const endDate = endOfDay(new Date(dateRange.end));
      filtered = filtered.filter(w => new Date(w.date) <= endDate);
    }
    
    // Type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(w => selectedTypes.includes(w.type));
    }
    
    // Duration range filter
    if (durationRange.min) {
      const min = parseInt(durationRange.min);
      filtered = filtered.filter(w => w.durationMinutes >= min);
    }
    if (durationRange.max) {
      const max = parseInt(durationRange.max);
      filtered = filtered.filter(w => w.durationMinutes <= max);
    }
    
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [workouts, searchQuery, dateRange, selectedTypes, durationRange]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (dateRange.start || dateRange.end) count++;
    if (durationRange.min || durationRange.max) count++;
    if (selectedTypes.length > 0) count++;
    return count;
  }, [dateRange, durationRange, selectedTypes]);

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const clearFilters = () => {
    setDateRange({ start: '', end: '' });
    setDurationRange({ min: '', max: '' });
    setSelectedTypes([]);
  };

  const handleSave = (workout: Omit<Workout, 'id'>) => {
    if (editingWorkout) {
      updateWorkout(editingWorkout.id, workout);
    } else {
      addWorkout(workout);
    }
    setEditingWorkout(undefined);
  };

  const handleEdit = (workout: Workout) => {
    setEditingWorkout(workout);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingWorkout(undefined);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Body"
        subtitle="Workouts & Tracking"
        icon={Dumbbell}
        iconColor="text-blue-600"
      />

      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-semibold flex-1">Workouts</h2>
          <div className="flex items-center gap-2">
            <div className="w-64">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search workouts..."
              />
            </div>
            <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Filter Workouts</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Date Range</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      />
                      <Input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Duration Range (minutes)</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Input
                        type="number"
                        value={durationRange.min}
                        onChange={(e) => setDurationRange({ ...durationRange, min: e.target.value })}
                        placeholder="Min"
                      />
                      <Input
                        type="number"
                        value={durationRange.max}
                        onChange={(e) => setDurationRange({ ...durationRange, max: e.target.value })}
                        placeholder="Max"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Workout Type</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {WORKOUT_TYPES.map(type => (
                        <Badge
                          key={type}
                          variant={selectedTypes.includes(type) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => toggleType(type)}
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {activeFiltersCount > 0 && (
                    <Button variant="outline" onClick={clearFilters} className="w-full">
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="space-y-2">
          {filteredWorkouts.length === 0 ? (
            <Card 
              className="p-8 border-2 border-dashed cursor-pointer hover:border-primary transition-colors text-center"
              onClick={handleAddNew}
            >
              <Plus className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-lg font-medium mb-1">Add your first workout</p>
              <p className="text-sm text-muted-foreground">Tap to start tracking your fitness</p>
            </Card>
          ) : (
            <>
              {filteredWorkouts.map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  workout={workout}
                  onEdit={handleEdit}
                  onDelete={deleteWorkout}
                />
              ))}
              <Card 
                className="p-6 border-2 border-dashed cursor-pointer hover:border-primary transition-colors text-center bg-muted/50"
                onClick={handleAddNew}
              >
                <Plus className="w-8 h-8 mx-auto text-primary" />
                <p className="text-sm font-medium mt-2 text-muted-foreground">Add another workout</p>
              </Card>
            </>
          )}
        </div>
      </div>

      <WeeklyWorkoutGrid workouts={workouts} />

      <WorkoutModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSave}
        workout={editingWorkout}
      />
    </div>
  );
}
