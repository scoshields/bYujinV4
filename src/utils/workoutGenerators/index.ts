import { generatePushWorkout } from './pushWorkout';
import { generatePullWorkout } from './pullWorkout';
import { generateLegWorkout } from './legWorkout';
import { generateUpperBodyWorkout } from './upperBodyWorkout';
import { generateLowerBodyWorkout } from './lowerBodyWorkout';
import { generateFiveDaySplit } from './fiveDaySplit';
import { WorkoutLevel, WorkoutType, WorkoutExercise } from '../../types/workout';
import { supabase } from '../../lib/supabase';

interface WorkoutPlan {
  name: string;
  exercises: WorkoutExercise[];
}

interface WorkoutGeneratorParams {
  userId: string;
  level: WorkoutLevel;
  equipment: string[];
  workoutType?: WorkoutType;
  daysPerWeek?: number;
}

export async function generateFullWorkoutPlan(
  params: WorkoutGeneratorParams
): Promise<WorkoutPlan[]> {
  const { userId, level, equipment, workoutType, daysPerWeek } = params;
  try {
    let workouts: WorkoutPlan[] = [];

    // Calculate dates for workouts
    const today = new Date();
    const dates = Array.from({ length: daysPerWeek || 1 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      return date.toISOString();
    });

    if (daysPerWeek === 4) {
      // Generate 4-day split (2 upper, 2 lower)
      const [upperWorkout1, upperWorkout2, lowerWorkout1, lowerWorkout2] = await Promise.all([
        generateUpperBodyWorkout(level, equipment),
        generateUpperBodyWorkout(level, equipment),
        generateLowerBodyWorkout(level, equipment),
        generateLowerBodyWorkout(level, equipment)
      ]);

      workouts = [
        { name: 'Upper Body A', exercises: upperWorkout1 },
        { name: 'Lower Body A', exercises: lowerWorkout1 },
        { name: 'Upper Body B', exercises: upperWorkout2 },
        { name: 'Lower Body B', exercises: lowerWorkout2 }
      ];
    } else if (daysPerWeek === 5) {
      // Generate 5-day split
      workouts = await generateFiveDaySplit(level, equipment);
    } else if (workoutType) {
      // Single day workout
      let exercises: WorkoutExercise[] = [];
      
      switch (workoutType) {
        case 'push':
          exercises = await generatePushWorkout(level, equipment);
          workouts.push({ name: 'Push Day', exercises });
          break;
        case 'pull':
          exercises = await generatePullWorkout(level, equipment);
          workouts.push({ name: 'Pull Day', exercises });
          break;
        case 'legs':
          exercises = await generateLegWorkout(level, equipment);
          workouts.push({ name: 'Legs Day', exercises });
          break;
        case 'upper':
          exercises = await generateUpperBodyWorkout(level, equipment);
          workouts.push({ name: 'Upper Body Workout', exercises });
          break;
        case 'lower':
          exercises = await generateLowerBodyWorkout(level, equipment);
          workouts.push({ name: 'Lower Body Workout', exercises });
          break;
      }
    } else {
      // Multi-day workout
      const [pushExercises, pullExercises, legExercises] = await Promise.all([
        generatePushWorkout(level, equipment),
        generatePullWorkout(level, equipment),
        generateLegWorkout(level, equipment)
      ]);

      workouts = [
        { name: 'Push Day', exercises: pushExercises },
        { name: 'Pull Day', exercises: pullExercises },
        { name: 'Legs Day', exercises: legExercises }
      ];
    }

    // Save workouts to database
    for (let i = 0; i < workouts.length; i++) {
      const workout = workouts[i];
      try {
        // Create the workout
        const { data: workoutData, error: workoutError } = await supabase
          .from('user_workouts')
          .insert({
            user_id: userId,
            name: workout.name,
            scheduled_date: dates[i],
            completed: false,
            notes: `${level} ${workoutType ? 'single-day' : 'split'} workout`
          })
          .select()
          .single();

        if (workoutError) throw workoutError;
        if (!workoutData) throw new Error('No workout data returned after insert');

        // Add exercises to the workout
        const workoutExercises = workout.exercises.map((exercise, index) => ({
          workout_id: workoutData.id,
          exercise_id: exercise.id,
          sets: exercise.sets,
          reps_per_set: exercise.reps,
          order_in_workout: index + 1
        }));

        const { data: insertedExercises, error: exerciseError } = await supabase
          .from('workout_exercises')
          .insert(workoutExercises)
          .select();

        if (exerciseError) throw exerciseError;

        // Create sets for each exercise
        if (insertedExercises) {
          for (const workoutExercise of insertedExercises) {
            const exercise = workout.exercises.find(e => e.id === workoutExercise.exercise_id);
            if (!exercise) continue;

            const sets = Array.from({ length: exercise.sets }, (_, i) => ({
              workout_exercise_id: workoutExercise.id,
              set_number: i + 1,
              reps: exercise.reps,
              weight_lbs: null,
              completed: false
            }));

            const { error: setsError } = await supabase
              .from('exercise_sets')
              .insert(sets);

            if (setsError) throw setsError;
          }
        }
      } catch (error) {
        console.error('Error saving workout:', error);
        throw error;
      }
    }

    return workouts;
  } catch (error) {
    console.error('Error in generateFullWorkoutPlan:', error);
    throw error;
  }
}