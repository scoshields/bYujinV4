import { supabase } from '../../lib/supabase';
import { WorkoutLevel, WorkoutExercise } from '../../types/workout';
import { getRandomInRange, shuffleArray } from '../randomUtils';
import { LEVEL_CONFIGS } from '../workoutConfigs';

// Define push day muscle groups with priority
const PUSH_MUSCLE_GROUPS = [
  { name: 'Chest', priority: 2 },     // Primary pushing muscle
  { name: 'Shoulders', priority: 2 }, // Primary pushing muscle
  { name: 'Triceps', priority: 1 },   // Secondary/assistance muscle
  { name: 'Trapezius', priority: 1 }  // Secondary/assistance muscle
];

export async function generatePushWorkout(
  level: WorkoutLevel,
  availableEquipment: string[]
): Promise<WorkoutExercise[]> {
  const config = LEVEL_CONFIGS[level];
  let exercises: WorkoutExercise[] = [];

  const getRandomExerciseCount = () => {
    return Math.floor(Math.random() * (config.totalExercises.max - config.totalExercises.min + 1)) + config.totalExercises.min;
  };

  // First, get at least one exercise for each primary muscle group
  for (const muscleGroup of PUSH_MUSCLE_GROUPS) {
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .ilike('target_muscle_group', `%${muscleGroup.name}%`)
      .in('primary_equipment', availableEquipment)
      .limit(muscleGroup.priority === 2 ? 3 : 2); // Get more exercises for primary muscles

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
  const targetExerciseCount = getRandomExerciseCount();
  exercises = shuffleArray(exercises).slice(0, targetExerciseCount);

  // Sort exercises by muscle group priority
  return exercises.sort((a, b) => {
    const priorityA = PUSH_MUSCLE_GROUPS.find(mg => 
      a.target_muscle_group.includes(mg.name))?.priority || 0;
    const priorityB = PUSH_MUSCLE_GROUPS.find(mg => 
      b.target_muscle_group.includes(mg.name))?.priority || 0;
    return priorityB - priorityA;
  });
}