import React from 'react';
import { ExerciseType, MuscleGroup, DifficultyLevel } from '../types/database';

interface WorkoutFormProps {
  onSubmit: (data: WorkoutFormData) => void;
  loading: boolean;
}

export interface WorkoutFormData {
  exerciseTypes: ExerciseType[];
  muscleGroups: MuscleGroup[];
  difficulty: DifficultyLevel;
  duration: number;
}

export default function WorkoutForm({ onSubmit, loading }: WorkoutFormProps) {
  const [formData, setFormData] = React.useState<WorkoutFormData>({
    exerciseTypes: [],
    muscleGroups: [],
    difficulty: 'intermediate',
    duration: 45,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleCheckboxChange = (field: 'exerciseTypes' | 'muscleGroups', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value as any)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Exercise Types</h3>
        <div className="grid grid-cols-2 gap-2">
          {['strength', 'cardio', 'flexibility', 'balance'].map((type) => (
            <label key={type} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.exerciseTypes.includes(type as ExerciseType)}
                onChange={() => handleCheckboxChange('exerciseTypes', type)}
                className="rounded text-indigo-600"
              />
              <span className="capitalize">{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Target Muscle Groups</h3>
        <div className="grid grid-cols-2 gap-2">
          {['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full_body'].map((group) => (
            <label key={group} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.muscleGroups.includes(group as MuscleGroup)}
                onChange={() => handleCheckboxChange('muscleGroups', group)}
                className="rounded text-indigo-600"
              />
              <span className="capitalize">{group.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Difficulty Level</h3>
        <select
          value={formData.difficulty}
          onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as DifficultyLevel }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Workout Duration (minutes)</h3>
        <input
          type="number"
          min="15"
          max="120"
          step="15"
          value={formData.duration}
          onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading || formData.exerciseTypes.length === 0 || formData.muscleGroups.length === 0}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate Workout'}
      </button>
    </form>
  );
}