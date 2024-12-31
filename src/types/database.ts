export type ExerciseType = 'strength' | 'cardio' | 'flexibility' | 'balance';
export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'full_body';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Exercise {
  id: string;
  name: string;
  description: string | null;
  exercise_type: ExerciseType;
  primary_muscle_group: MuscleGroup;
  secondary_muscle_groups: MuscleGroup[];
  difficulty: DifficultyLevel;
  equipment_needed: string[];
  created_at: string;
  updated_at: string;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  exercise_types: ExerciseType[];
  target_muscle_groups: MuscleGroup[];
  difficulty: DifficultyLevel;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}