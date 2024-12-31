import { supabase } from '../lib/supabase';
import { WorkoutLevel, WorkoutExercise } from '../types/workout';

// Define muscle groups with priority
const PUSH_MUSCLE_GROUPS = [
  { name: 'Chest', priority: 2 },     // Primary pushing muscle
  { name: 'Shoulders', priority: 2 }, // Primary pushing muscle
  { name: 'Triceps', priority: 1 },   // Secondary/assistance muscle
  { name: 'Trapezius', priority: 1 }  // Secondary/assistance muscle
];

interface SetRange {
  min: number;
  max: number;
}

interface ExerciseConfig {
  totalExercises: number;
  sets: SetRange;
  reps: SetRange;
}

const LEVEL_CONFIGS: Record<WorkoutLevel, ExerciseConfig> = {
  beginner: {
    totalExercises: 6,
    sets: { min: 2, max: 3 },
    reps: { min: 10, max: 12 }
  },
  intermediate: {
    totalExercises: 8,
    sets: { min: 3, max: 4 },
    reps: { min: 8, max: 12 }
  },
  advanced: {
    totalExercises: 10,
    sets: { min: 3, max: 5 },
    reps: { min: 6, max: 10 }
  }
};

function getRandomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function generatePushWorkout(
  level: WorkoutLevel,
  availableEquipment: string[]
): Promise<WorkoutExercise[]> {
  const config = LEVEL_CONFIGS[level];
  let exercises: WorkoutExercise[] = [];

  // First, get at least one exercise for each primary muscle group
  for (const muscleGroup of PUSH_MUSCLE_GROUPS) {
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .ilike('target_muscle_group', `%${muscleGroup.name}%`)
      .in('primary_equipment', availableEquipment)
      .limit(muscleGroup.priority === 2 ? 2 : 1); // Get more exercises for primary muscles

    if (data) {
      const selectedExercises = data.map(exercise => ({
        id: exercise.id,
        name: exercise.name,
        target_muscle_group: exercise.target_muscle_group,
        sets: getRandomInRange(config.sets.min, config.sets.max),
        reps: getRandomInRange(config.reps.min, config.reps.max),
        primary_equipment: exercise.primary_equipment
      }));

      exercises.push(...selectedExercises);
    }
  }

  // Shuffle and limit to configured total exercises
  exercises = shuffleArray(exercises).slice(0, config.totalExercises);

  // Sort exercises by muscle group priority
  return exercises.sort((a, b) => {
    const priorityA = PUSH_MUSCLE_GROUPS.find(mg => 
      a.target_muscle_group.includes(mg.name))?.priority || 0;
    const priorityB = PUSH_MUSCLE_GROUPS.find(mg => 
      b.target_muscle_group.includes(mg.name))?.priority || 0;
    return priorityB - priorityA;
  });
}

interface WorkoutExercise {
  exercise_sets: Array<{
    weight_lbs: number | null;
    reps: number | null;
  }>;
}

/**
 * Checks if a workout is complete by verifying all sets have weight and reps
 * @param workoutExercises Array of exercises with their sets
 * @returns boolean indicating if the workout is complete
 */
export function checkWorkoutCompletion(workoutExercises: WorkoutExercise[]): boolean {
  if (!workoutExercises?.length) return false;

  return workoutExercises.every(exercise => {
    // Check if exercise has any sets
    if (!exercise.exercise_sets?.length) return false;

    // Check if all sets have weight and reps
    return exercise.exercise_sets.every(set => 
      set.weight_lbs != null && 
      set.reps != null && 
      set.weight_lbs > 0 && 
      set.reps > 0
    );
  });
}