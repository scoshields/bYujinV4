import { supabase } from '../../lib/supabase';
import { WorkoutLevel, WorkoutExercise } from '../../types/workout';
import { getRandomInRange, shuffleArray } from '../randomUtils';
import { LEVEL_CONFIGS } from '../workoutConfigs';

// Define pull day muscle groups with priority
const PULL_MUSCLE_GROUPS = [
  { name: 'Back', priority: 2 },      // Primary pulling muscle
  { name: 'Biceps', priority: 1 },    // Secondary/assistance muscle
  { name: 'Forearms', priority: 1 }   // Secondary/assistance muscle
];

export async function generatePullWorkout(
  level: WorkoutLevel,
  availableEquipment: string[]
): Promise<WorkoutExercise[]> {
  const config = LEVEL_CONFIGS[level];
  let exercises: WorkoutExercise[] = [];

  const getRandomExerciseCount = () => {
    return Math.floor(Math.random() * (config.totalExercises.max - config.totalExercises.min + 1)) + config.totalExercises.min;
  };

  // First, get exercises for primary muscle groups (back)
  const primaryGroup = PULL_MUSCLE_GROUPS.find(mg => mg.priority === 2);
  if (primaryGroup) {
    const { data: primaryExercises } = await supabase
      .from('exercises')
      .select('*')
      .ilike('target_muscle_group', `%${primaryGroup.name}%`)
      .in('primary_equipment', availableEquipment)
      .limit(3); // Get up to 3 back exercises for variety

    if (primaryExercises) {
      const selectedExercises = primaryExercises.map(exercise => ({
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

  // Then get exercises for secondary muscle groups (biceps and forearms)
  const secondaryGroups = PULL_MUSCLE_GROUPS.filter(mg => mg.priority === 1);
  for (const muscleGroup of secondaryGroups) {
    const { data: secondaryExercises } = await supabase
      .from('exercises')
      .select('*')
      .ilike('target_muscle_group', `%${muscleGroup.name}%`)
      .in('primary_equipment', availableEquipment)
      .limit(2); // Get up to 2 exercises for secondary muscles

    if (secondaryExercises) {
      const selectedExercises = secondaryExercises.map(exercise => ({
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
  const targetExerciseCount = getRandomExerciseCount();
  exercises = shuffleArray(exercises).slice(0, targetExerciseCount);

  // Sort exercises by muscle group priority
  return exercises.sort((a, b) => {
    const priorityA = PULL_MUSCLE_GROUPS.find(mg => 
      a.target_muscle_group.includes(mg.name))?.priority || 0;
    const priorityB = PULL_MUSCLE_GROUPS.find(mg => 
      b.target_muscle_group.includes(mg.name))?.priority || 0;
    return priorityB - priorityA;
  });
}