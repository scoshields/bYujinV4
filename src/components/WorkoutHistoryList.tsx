import React from 'react';
import { Trash2 } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

interface WorkoutHistoryItem {
  id: string;
  name: string;
  scheduled_date: string;
  completed: boolean;
  notes?: string;
}

interface WorkoutHistoryListProps {
  workouts: WorkoutHistoryItem[];
  onSelect: (workoutId: string) => void;
  onDelete: (workoutId: string) => void;
}

export default function WorkoutHistoryList({ workouts, onSelect, onDelete }: WorkoutHistoryListProps) {
  return (
    <div className="space-y-4">
      {workouts.map((workout) => (
        <div
          key={workout.id}
          className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-center" onClick={() => onSelect(workout.id)}>
            <h3 className="font-medium">{workout.name}</h3>
            <span className={`px-2 py-1 rounded text-sm ${
              workout.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {workout.completed ? 'Completed' : 'Pending'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1" onClick={() => onSelect(workout.id)}>
            {formatDate(workout.scheduled_date)}
          </p>
          {workout.notes && (
            <p className="text-sm text-gray-500 mt-2" onClick={() => onSelect(workout.id)}>{workout.notes}</p>
          )}
          <div className="mt-3 flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(workout.id);
              }}
              className="text-red-600 hover:text-red-800 p-1"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}