import React from 'react';
import { Exercise } from '../types/database';

interface ExpertWorkoutFormProps {
  onSubmit: (data: ExpertWorkoutData) => void;
  loading: boolean;
  exercises: Exercise[];
}

export interface ExpertWorkoutData {
  selectedExercises: string[];
  sets: Record<string, number>;
  reps: Record<string, number>;
  notes: string;
}

export default function ExpertWorkoutForm({ onSubmit, loading, exercises }: ExpertWorkoutFormProps) {
  const [selectedExercises, setSelectedExercises] = React.useState<string[]>([]);
  const [sets, setSets] = React.useState<Record<string, number>>({});
  const [reps, setReps] = React.useState<Record<string, number>>({});
  const [notes, setNotes] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      selectedExercises,
      sets,
      reps,
      notes
    });
  };

  const handleExerciseToggle = (exerciseId: string) => {
    setSelectedExercises(prev => {
      if (prev.includes(exerciseId)) {
        return prev.filter(id => id !== exerciseId);
      }
      return [...prev, exerciseId];
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Select Exercises</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              className={`p-4 border rounded-lg cursor-pointer ${
                selectedExercises.includes(exercise.id)
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleExerciseToggle(exercise.id)}
            >
              <h4 className="font-medium">{exercise.name}</h4>
              <p className="text-sm text-gray-500">{exercise.target_muscle_group}</p>
            </div>
          ))}
        </div>
      </div>

      {selectedExercises.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Configure Sets & Reps</h3>
          <div className="space-y-4">
            {selectedExercises.map((exerciseId) => {
              const exercise = exercises.find(e => e.id === exerciseId);
              if (!exercise) return null;

              return (
                <div key={exerciseId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{exercise.name}</h4>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <label className="block text-sm text-gray-600">Sets</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={sets[exerciseId] || 3}
                        onChange={(e) => setSets(prev => ({
                          ...prev,
                          [exerciseId]: parseInt(e.target.value)
                        }))}
                        className="w-20 rounded-md border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Reps</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={reps[exerciseId] || 10}
                        onChange={(e) => setReps(prev => ({
                          ...prev,
                          [exerciseId]: parseInt(e.target.value)
                        }))}
                        className="w-20 rounded-md border-gray-300"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full rounded-md border-gray-300"
          placeholder="Add any specific instructions or notes for your workout..."
        />
      </div>

      <button
        type="submit"
        disabled={loading || selectedExercises.length === 0}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {loading ? 'Creating Workout...' : 'Create Custom Workout'}
      </button>
    </form>
  );
}