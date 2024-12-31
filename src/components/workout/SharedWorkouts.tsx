import React from 'react';
import { Star, Plus } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import { WorkoutWithExercises } from '../../types/workout';

interface SharedWorkoutsProps {
  workouts: WorkoutWithExercises[];
  onSelect: (workoutId: string) => void;
  onAddToWeek: (workoutId: string) => void;
  onToggleFavorite: (workoutId: string) => void;
}

export default function SharedWorkouts({
  workouts,
  onSelect,
  onAddToWeek,
  onToggleFavorite
}: SharedWorkoutsProps) {
  const sharedWorkouts = workouts.filter(w => w.shared_from);

  if (sharedWorkouts.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-text-highlight mb-4">Shared With You</h2>
      <div className="grid gap-2 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {sharedWorkouts.map((workout) => (
          <div
            key={workout.id}
            className="card p-3 sm:p-4 hover:border-accent-blue transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(workout.id);
                  }}
                  className="text-accent-blue hover:text-accent-blue-hover"
                >
                  <Star className={`h-4 w-4 ${workout.is_favorite ? 'fill-current' : ''}`} />
                </button>
                <h3 className="font-medium text-text-primary">
                  {workout.custom_name || workout.name}
                </h3>
              </div>
            </div>

            <div className="text-sm text-text-secondary mb-3">
              Last performed: {formatDate(workout.scheduled_date)}
            </div>

            {workout.workout_exercises && (
              <div className="text-sm text-text-secondary mb-4">
                {workout.workout_exercises.length} exercises
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => onSelect(workout.id)}
                className="text-sm text-accent-blue hover:text-accent-blue-hover"
              >
                View Details
              </button>
              <button
                onClick={() => onAddToWeek(workout.id)}
                className="flex items-center gap-1 text-sm text-accent-green hover:text-accent-green-hover"
              >
                <Plus className="h-4 w-4" />
                Add to Week
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}