import { supabase } from '../lib/supabase';
import { Exercise, ExerciseType, MuscleGroup, DifficultyLevel } from '../types/database';

export async function generateWorkout(
  exerciseTypes: ExerciseType[],
  muscleGroups: MuscleGroup[],
  difficulty: DifficultyLevel,
  duration: number
): Promise<Exercise[]> {
  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('*')
    .in('exercise_type', exerciseTypes)
    .in('primary_muscle_group', muscleGroups)
    .eq('difficulty', difficulty);

  if (error) throw error;
  if (!exercises) return [];

  // Shuffle exercises and select a subset based on duration
  const shuffled = exercises.sort(() => Math.random() - 0.5);
  const numExercises = Math.floor(duration / 15) * 2; // 2 exercises per 15 minutes
  
  return shuffled.slice(0, numExercises);
}