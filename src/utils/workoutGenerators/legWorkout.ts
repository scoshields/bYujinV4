import { supabase } from '../../lib/supabase';
import { WorkoutLevel, WorkoutExercise } from '../../types/workout';
import { getRandomInRange, shuffleArray } from '../randomUtils';
import { LEVEL_CONFIGS } from '../workoutConfigs';

// Define leg day muscle groups with priority
const LEG_MUSCLE_GROUPS = [
  { name: 'Quadriceps', priority: 2 },  // Primary leg muscles
  { name: 'Hamstrings', priority: 2 },  // Primary leg muscles
  { name: 'Calves', priority: 1 },      // Secondary leg muscles
  { name: 'Glutes', priority: 1 }       // Secondary leg muscles
];

export async function generateLegWorkout(
  level: WorkoutLevel,
  availableEquipment: string[]
): Promise<WorkoutExercise[]> {
  const config = LEVEL_CONFIGS[level];
  let exercises: WorkoutExercise[] = [];

  const getRandomExerciseCount = () => {
    return Math.floor(Math.random() * (config.totalExercises.max - config.totalExercises.min + 1)) + config.totalExercises.min;
  };

  // First, get exercises for primary muscle groups
  const primaryGroups = LEG_MUSCLE_GROUPS.filter(mg => mg.priority === 2);
  for (const muscleGroup of primaryGroups) {
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .ilike('target_muscle_group', `%${muscleGroup.name}%`)
      .in('primary_equipment', availableEquipment)
      .limit(2);

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

  // Then get exercises for secondary muscle groups
  const secondaryGroups = LEG_MUSCLE_GROUPS.filter(mg => mg.priority === 1);
  for (const muscleGroup of secondaryGroups) {
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .ilike('target_muscle_group', `%${muscleGroup.name}%`)
      .in('primary_equipment', availableEquipment)
      .limit(1);

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
    const priorityA = LEG_MUSCLE_GROUPS.find(mg => 
      a.target_muscle_group.includes(mg.name))?.priority || 0;
    const priorityB = LEG_MUSCLE_GROUPS.find(mg => 
      b.target_muscle_group.includes(mg.name))?.priority || 0;
    return priorityB - priorityA;
  });
}