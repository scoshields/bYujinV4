import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Copy, Plus, Star, Trash2 } from 'lucide-react';
import { formatDate, getWeekRange } from '../../utils/dateUtils';
import { supabase } from '../../lib/supabase';
import { WorkoutWithExercises } from '../../types/workout';

interface WeeklyWorkoutsProps {
  workouts: WorkoutWithExercises[];
  currentWeekStart: Date;
  onWeekChange: (date: Date) => void;
  onWorkoutSelect: (workoutId: string) => void;
  onDelete: (workoutId: string) => void;
  onCopyWeek: () => void;
  onRename: (workoutId: string, name: string) => void;
  onToggleFavorite: (workoutId: string) => void;
  onAddWorkout?: () => void;
}

export default function WeeklyWorkouts({
  workouts,
  currentWeekStart,
  onWeekChange,
  onWorkoutSelect,
  onDelete,
  onCopyWeek,
  onRename,
  onToggleFavorite,
  onAddWorkout
}: WeeklyWorkoutsProps) {
  const { startDate, endDate } = getWeekRange(currentWeekStart);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [sharedWorkouts, setSharedWorkouts] = useState<any[]>([]);
  const [loadingShared, setLoadingShared] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState<string | null>(null);

  useEffect(() => {
    loadSharedWorkouts();
  }, []);

  const loadSharedWorkouts = async () => {
    setLoadingShared(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('get_shared_workouts', {
          p_user_id: user.id,
          p_limit: 5
        });

      if (error) throw error;
      setSharedWorkouts(data || []);
    } catch (error) {
      console.error('Error loading shared workouts:', error);
    } finally {
      setLoadingShared(false);
    }
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    onWeekChange(newDate);
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      const workout = workouts.find(w => w.id === workoutId);
      if (!workout) return;

      // If it's a favorite, just remove it from this week
      if (workout.is_favorite) {
        onDelete(workoutId);
        return;
      }

      // Otherwise, confirm before deleting
      if (window.confirm('Are you sure you want to delete this workout?')) {
        onDelete(workoutId);
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    onWeekChange(newDate);
  };

  // Filter workouts for current week
  const weeklyWorkouts = workouts.filter(workout => {
    if (!workout.scheduled_date) return false;
    const workoutDate = new Date(workout.scheduled_date);
    return workoutDate >= startDate && workoutDate <= endDate;
  });

  return (
    <div className="card">
      <div className="p-4 border-b border-divider flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={handlePreviousWeek}
            className="p-1 hover:bg-surface rounded text-text-secondary hover:text-text-primary"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-sm sm:text-lg font-semibold text-text-primary">
            Week of {formatDate(startDate, { month: 'long', day: 'numeric' })}
          </h2>
          <button
            onClick={handleNextWeek}
            className="p-1 hover:bg-surface rounded text-text-secondary hover:text-text-primary"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {onAddWorkout && (
            <button
              onClick={onAddWorkout}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-accent-green hover:text-accent-green-hover bg-accent-green/10 rounded-md hover:bg-accent-green/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Workout</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
          <button
            onClick={onCopyWeek}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-accent-blue hover:text-accent-blue-hover bg-accent-blue/10 rounded-md hover:bg-accent-blue/20 transition-colors"
          >
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">Copy to Next Week</span>
            <span className="sm:hidden">Copy</span>
          </button>
        </div>
      </div>
      
      <div className="p-2 sm:p-4 grid gap-2 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Shared Workouts Section */}
        {sharedWorkouts.length > 0 && (
          <div className="md:col-span-2 lg:col-span-3 mb-6" key="shared-workouts">
            <h3 className="text-lg font-medium text-text-highlight mb-4">
              Shared With You
            </h3>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {sharedWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  onClick={() => onWorkoutSelect(workout.id)}
                  className="card hover:border-accent-blue transition-all duration-200 cursor-pointer p-3 sm:p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-text-primary">
                      {workout.name}
                    </h3>
                    <span className="px-2 py-1 text-xs rounded-full bg-accent-blue/20 text-accent-blue">
                      {workout.completed_exercise_count}/{workout.exercise_count} Exercises
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(workout.id);
                      }}
                      className={`text-accent-blue hover:text-accent-blue-hover ${
                        workout.is_favorite ? 'opacity-100' : 'opacity-50'
                      }`}
                      disabled={loadingFavorite === workout.id}
                    >
                      <Star className={`h-4 w-4 ${workout.is_favorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    {workout.sharer_avatar_url ? (
                      <img
                        src={workout.sharer_avatar_url}
                        alt={workout.sharer_username}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-accent-blue/10 flex items-center justify-center">
                        <span className="text-accent-blue text-xs font-medium">
                          {workout.sharer_first_name[0]}
                        </span>
                      </div>
                    )}
                    <span className="text-sm text-text-secondary">
                      Shared by {workout.sharer_first_name} {workout.sharer_last_name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {loadingShared && (
          <div className="md:col-span-2 lg:col-span-3 text-center py-4 text-text-secondary">
            Loading shared workouts...
          </div>
        )}

        {weeklyWorkouts.map((workout) => (
          <div
            key={workout.id} 
            onClick={() => onWorkoutSelect(workout.id)}
            className="card hover:border-accent-blue transition-all duration-200 cursor-pointer p-3 sm:p-4"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingWorkoutId(workout.id);
              setNewName(workout.custom_name || workout.name);
            }}
          >
            <div className="flex items-center justify-between mb-2">
              {editingWorkoutId === workout.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onRename(workout.id, newName);
                    setEditingWorkoutId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 mr-2"
                >
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                    autoFocus
                    onBlur={() => setEditingWorkoutId(null)}
                  />
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(workout.id);
                    }}
                    className={`text-accent-blue hover:text-accent-blue-hover ${
                      workout.is_favorite ? 'opacity-100' : 'opacity-50'
                    }`}
                  >
                    <Star className="h-4 w-4" />
                  </button>
                  <h3 className="font-medium text-text-primary">
                    {workout.custom_name || workout.name}
                  </h3>
                </div>
              )}
              <span className={`px-2 py-1 text-xs rounded-full ${
                workout.completed 
                  ? 'bg-accent-green/20 text-accent-green' 
                  : 'bg-accent-blue/20 text-accent-blue'
              }`}>
                {workout.completed ? 'Done' : 'Todo'}
              </span>
            </div>
            
            {workout.workout_exercises && (
              <div className="text-sm text-text-secondary">
                {workout.workout_exercises.length} exercises
              </div>
            )}
            
            <div className="mt-2 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteWorkout(workout.id);
                }}
                className="text-error hover:text-error/80 p-1 -m-1"
              >
                <span className="sr-only">Delete workout</span>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}