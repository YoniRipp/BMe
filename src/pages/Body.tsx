import { useState, useMemo } from 'react';
import { useWorkouts } from '@/hooks/useWorkouts';
import { Workout } from '@/types/workout';
import { PageHeader } from '@/components/shared/PageHeader';
import { WorkoutCard } from '@/components/body/WorkoutCard';
import { WorkoutModal } from '@/components/body/WorkoutModal';
import { WeeklyWorkoutGrid } from '@/components/body/WeeklyWorkoutGrid';
import { SearchBar } from '@/components/shared/SearchBar';
import { Card } from '@/components/ui/card';
import { Dumbbell, Plus } from 'lucide-react';

export function Body() {
  const { workouts, addWorkout, updateWorkout, deleteWorkout } = useWorkouts();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

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
    
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [workouts, searchQuery]);

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
          <div className="w-64">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search workouts..."
            />
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
