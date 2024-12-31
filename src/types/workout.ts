export type WorkoutLevel = 'beginner' | 'intermediate' | 'advanced';

export interface WorkoutLevelConfig {
  sets: string;
  repsPerSet: string;
  exercisesPerBodyPart: string;
  intensity: string;
  description: string;
}

export type WorkoutType = 'push' | 'pull' | 'legs' | 'upper' | 'lower';

export interface GuidedWorkoutFormData {
  daysPerWeek: number;
  level: WorkoutLevel;
  equipment: string[];
  workoutType?: WorkoutType;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  target_muscle_group: string;
  sets: number;
  reps: number;
  primary_equipment: string;
}

export interface GeneratedWorkout {
  name: string;
  exercises: WorkoutExercise[];
  notes?: string;
}

export interface WorkoutWithExercises {
  id: string;
  name: string;
  scheduled_date: string;
  completed: boolean;
  shared_from?: string;
  is_favorite: boolean;
  custom_name?: string;
  notes?: string;
  workout_exercises?: Array<{
    id: string;
    exercise: {
      name: string;
      target_muscle_group: string;
      primary_equipment: string;
    };
  }>;
}

export const WORKOUT_LEVEL_CONFIGS: Record<WorkoutLevel, WorkoutLevelConfig> = {
  beginner: {
    sets: '2-3',
    repsPerSet: '10-12',
    exercisesPerBodyPart: '2-3',
    intensity: 'Light-moderate weights',
    description: 'Perfect for those new to working out. Focus on form and building a foundation.'
  },
  intermediate: {
    sets: '2-3',
    repsPerSet: '8-15',
    exercisesPerBodyPart: '3-4',
    intensity: 'Moderate weights',
    description: 'For those with some experience. Increased volume and intensity.'
  },
  advanced: {
    sets: '2-3',
    repsPerSet: '6-8',
    exercisesPerBodyPart: '3-5',
    intensity: 'Heavy weights',
    description: 'For experienced lifters. Focus on progressive overload and compound movements.'
  }
};