import { WorkoutLevel } from '../types/workout';

interface SetRange {
  min: number;
  max: number;
}

interface ExerciseConfig {
  totalExercises: SetRange;
  sets: SetRange;
  reps: SetRange;
}

export const LEVEL_CONFIGS: Record<WorkoutLevel, ExerciseConfig> = {
  beginner: {
    totalExercises: { min: 4, max: 6 },
    sets: { min: 2, max: 3 },
    reps: { min: 10, max: 12 }
  },
  intermediate: {
    totalExercises: { min: 4, max: 6 },
    sets: { min: 3, max: 4 },
    reps: { min: 8, max: 12 }
  },
  advanced: {
    totalExercises: { min: 4, max: 6 },
    sets: { min: 3, max: 5 },
    reps: { min: 6, max: 10 }
  }
};