import { supabase } from '../../lib/supabase';
import { WorkoutLevel, WorkoutExercise } from '../../types/workout';
import { getRandomInRange, shuffleArray } from '../randomUtils';
import { LEVEL_CONFIGS } from '../workoutConfigs';

// Define muscle group configurations for each day
const SPLIT_CONFIG = {
  'Chest/Triceps': {
    primary: ['Chest'],
    secondary: ['Triceps'],
    ratio: { primary: 3, secondary: 2 } // 3 chest exercises, 2 tricep exercises
  },
  'Back/Biceps': {
    primary: ['Back'],
    secondary: ['Biceps'],
    ratio: { primary: 3, secondary: 2 } // 3 back exercises, 2 bicep exercises
  },
  'Legs': {
    primary: ['Quadriceps', 'Hamstrings', 'Glutes'],
    secondary: ['Calves', 'Hip Flexors', 'Adductors', 'Abductors'],
    ratio: { primary: 4, secondary: 2 } // 4 primary leg exercises, 2 secondary
  },
  'Shoulders': {
    primary: ['Shoulders'],
    secondary: ['Trapezius'],
    ratio: { primary: 4, secondary: 2 } // 4 shoulder exercises, 2 trap exercises
  },
  'Full Body': {
    compounds: ['Chest', 'Back', 'Quadriceps', 'Shoulders'],
    ratio: { compounds: 4 } // One compound exercise from each major group
  }
};

async function generateDayWorkout(
  dayName: keyof typeof SPLIT_CONFIG,
  level: WorkoutLevel,
  equipment: string[]
): Promise<WorkoutExercise[]> {
  const config = LEVEL_CONFIGS[level];
  const dayConfig = SPLIT_CONFIG[dayName];
  let exercises: WorkoutExercise[] = [];
  const maxExercises = config.totalExercises.max;

  if (dayName === 'Full Body') {
    // Handle Full Body day differently - get compound exercises
    for (const muscleGroup of dayConfig.compounds) {
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .ilike('target_muscle_group', `%${muscleGroup}%`)
        .in('primary_equipment', equipment)
        .eq('mechanics', 'Compound')
        .limit(1);

      if (data?.length) {
        exercises.push({
          id: data[0].id,
          name: data[0].name,
          target_muscle_group: data[0].target_muscle_group,
          sets: getRandomInRange(config.sets.min, config.sets.max),
          reps: getRandomInRange(config.reps.min, config.reps.max),
          primary_equipment: data[0].primary_equipment
        });
      }
    }
  } else {
    // Handle muscle group split days
    const primaryExerciseCount = Math.min(
      Math.ceil(maxExercises * 0.7), // 70% of exercises for primary muscles
      dayConfig.ratio.primary
    );
    const secondaryExerciseCount = Math.min(
      Math.floor(maxExercises * 0.3), // 30% of exercises for secondary muscles
      dayConfig.ratio.secondary
    );

    // Get primary exercises
    for (const muscleGroup of dayConfig.primary) {
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .ilike('target_muscle_group', `%${muscleGroup}%`)
        .in('primary_equipment', equipment)
        .limit(Math.ceil(primaryExerciseCount / dayConfig.primary.length));

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

    // Get secondary exercises
    for (const muscleGroup of dayConfig.secondary) {
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .ilike('target_muscle_group', `%${muscleGroup}%`)
        .in('primary_equipment', equipment)
        .limit(Math.ceil(secondaryExerciseCount / dayConfig.secondary.length));

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
  }

  // Shuffle exercises to mix up the order
  // Limit total exercises to config maximum
  return shuffleArray(exercises).slice(0, maxExercises);
}

export async function generateFiveDaySplit(
  level: WorkoutLevel,
  equipment: string[]
): Promise<Array<{ name: string; exercises: WorkoutExercise[] }>> {
  const workoutDays = [
    'Chest/Triceps',
    'Back/Biceps',
    'Legs',
    'Shoulders',
    'Full Body'
  ] as const;

  const workouts = await Promise.all(
    workoutDays.map(async (day) => ({
      name: day,
      exercises: await generateDayWorkout(day, level, equipment)
    }))
  );

  return workouts;
}