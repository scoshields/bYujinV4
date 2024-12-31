import React from 'react';
import { Trash2 } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import { WorkoutWithExercises } from '../../types/workout';

interface DayColumnProps {
  date: Date;
  workouts: WorkoutWithExercises[];
  onWorkoutSelect: (workoutId: string) => void;
  onDelete: (workoutId: string) => void;
}

export default function DayColumn({
  date,
  workouts,
  onWorkoutSelect,
  onDelete
}: DayColumnProps) {
  const isToday = new Date().toDateString() === date.toDateString();

  return (
    <div className={`min-h-[600px] ${isToday ? 'bg-accent-blue/10' : ''}`}>
      <div className={`p-3 text-center border-b ${
        isToday ? 'bg-accent-blue/20 font-semibold' : 'bg-surface'
      }`}>
        <div className="text-sm text-text-secondary">
          {formatDate(date, { weekday: 'short' })}
        </div>
        <div className="text-lg text-text-primary">
          {formatDate(date, { day: 'numeric' })}
        </div>
      </div>
      
      <div className="p-2 space-y-2">
        {workouts.map((workout) => (
          <div
            key={workout.id}
            className="card p-3 hover:border-accent-blue transition-all duration-200"
          >
            <div 
              className="cursor-pointer"
              onClick={() => onWorkoutSelect(workout.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-text-primary">{workout.name}</h4>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  workout.completed 
                    ? 'bg-accent-green/20 text-accent-green' 
                    : 'bg-accent-blue/20 text-accent-blue'
                }`}>
                  {workout.completed ? 'Done' : 'Todo'}
                </span>
              </div>
              {workout.workout_exercises?.length > 0 && (
                <div className="text-xs text-text-secondary">
                  {workout.workout_exercises.length} exercises
                </div>
              )}
            </div>
            <div className="mt-2 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(workout.id);
                }}
                className="text-error hover:text-error/80 p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}