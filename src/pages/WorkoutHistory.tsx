import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import WorkoutDetails from '../components/WorkoutDetails';
import FavoriteWorkouts from '../components/workout/FavoriteWorkouts';
import SharedWorkouts from '../components/workout/SharedWorkouts';
import { checkWorkoutCompletion } from '../utils/workoutUtils';
import WeeklyWorkouts from '../components/calendar/WeeklyWorkouts';
import { getCurrentWeekStart, getWeekRange } from '../utils/dateUtils';
import { WorkoutWithExercises } from '../types/workout';

export default function WorkoutHistory() {
  const { session } = useAuthStore();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<WorkoutWithExercises[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(getCurrentWeekStart());

  useEffect(() => {
    loadWorkouts();
  }, [session?.user.id, currentWeekStart]);

  const loadWorkouts = async () => {
    if (!session?.user.id) return;

    try {
      // First, get all workouts
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('user_workouts')
        .select(`
          *,
          workout_exercises (
            id,
            exercise:exercises (
              name,
              target_muscle_group,
              primary_equipment
            ),
            sets,
            exercise_sets (*)
          )
        `)
        .eq('user_id', session.user.id)
        .order('scheduled_date', { ascending: false });

      if (workoutsError) throw workoutsError;

      // Check completion status for each workout
      const workoutsWithCompletion = workoutsData.map(workout => ({
        ...workout,
        completed: checkWorkoutCompletion(workout.workout_exercises)
      }));

      setWorkouts(workoutsWithCompletion);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      const workout = workouts.find(w => w.id === workoutId);
      if (!workout) return;

      // If it's a shared workout, just remove it from the current week view
      if (workout.shared_from) {
        const { error } = await supabase
          .from('user_workouts')
          .update({ scheduled_date: null })
          .eq('id', workoutId)
          .eq('user_id', session?.user.id);

        if (error) throw error;
      } else {
        // For non-shared workouts, delete them completely
        const { error } = await supabase
          .from('user_workouts')
          .delete()
          .eq('id', workoutId)
          .eq('user_id', session?.user.id);

        if (error) throw error;
      }

      // Update local state
      setWorkouts(prev => prev.map(w => 
        w.id === workoutId && w.shared_from
          ? { ...w, scheduled_date: null }
          : w
      ).filter(w => w.id !== workoutId || w.shared_from));

      if (selectedWorkoutId === workoutId) {
        setSelectedWorkoutId(null);
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  const handleCopyWeek = async () => {
    try {
      setLoading(true);

      // Get workouts for current week
      const weeklyWorkouts = workouts.filter(workout => {
        const workoutDate = new Date(workout.scheduled_date);
        const { startDate, endDate } = getWeekRange(currentWeekStart);
        return workoutDate >= startDate && workoutDate <= endDate;
      });

      // Create new workouts for next week
      for (const workout of weeklyWorkouts) {
        const newDate = new Date(workout.scheduled_date);
        newDate.setDate(newDate.getDate() + 7);

        // Create new workout
        const { data: newWorkout, error: workoutError } = await supabase
          .from('user_workouts')
          .insert({
            user_id: session?.user.id,
            name: workout.name,
            scheduled_date: newDate.toISOString(),
            completed: false,
            notes: workout.notes
          })
          .select()
          .single();

        if (workoutError) throw workoutError;

        // Copy exercises for the workout
        if (workout.workout_exercises) {
          const exercisesToCopy = workout.workout_exercises.map(exercise => ({
            workout_id: newWorkout.id,
            exercise_id: exercise.exercise.id,
            sets: exercise.sets,
            reps_per_set: exercise.reps_per_set,
            order_in_workout: exercise.order_in_workout
          }));

          const { data: newExercises, error: exercisesError } = await supabase
            .from('workout_exercises')
            .insert(exercisesToCopy)
            .select();

          if (exercisesError) throw exercisesError;

          // Create sets for each exercise
          for (const exercise of newExercises) {
            const sets = Array.from({ length: exercise.sets }, (_, i) => ({
              workout_exercise_id: exercise.id,
              set_number: i + 1,
              reps: exercise.reps_per_set,
              weight_lbs: null,
              completed: false
            }));

            const { error: setsError } = await supabase
              .from('exercise_sets')
              .insert(sets);

            if (setsError) throw setsError;
          }
        }
      }

      // Reload workouts to show the new week
      await loadWorkouts();

      // Move to next week view
      const nextWeek = new Date(currentWeekStart);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setCurrentWeekStart(nextWeek);
    } catch (error) {
      console.error('Error copying week:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkoutUpdate = () => {
    loadWorkouts(); // Reload workouts to update completion status
  };

  const handleAddWorkout = () => {
    navigate('/generator');
  };

  const handleRename = async (workoutId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('user_workouts')
        .update({ custom_name: newName })
        .eq('id', workoutId);

      if (error) throw error;

      // Update local state
      setWorkouts(prev => prev.map(w => 
        w.id === workoutId ? { ...w, custom_name: newName } : w
      ));
    } catch (error) {
      console.error('Error renaming workout:', error);
    }
  };

  const handleToggleFavorite = async (workoutId: string) => {
    try {
      const workout = workouts.find(w => w.id === workoutId);
      if (!workout) return;

      const { error } = await supabase
        .from('user_workouts')
        .update({ is_favorite: !workout.is_favorite })
        .eq('id', workoutId);

      if (error) throw error;

      // Update local state
      setWorkouts(prev => prev.map(w => 
        w.id === workoutId ? { ...w, is_favorite: !w.is_favorite } : w
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleAddToWeek = async (workoutId: string) => {
    try {
      setLoading(true);
      
      // Get the workout to copy
      const workoutToCopy = workouts.find(w => w.id === workoutId);
      if (!workoutToCopy) return;

      // Create new workout for current week
      const { data: newWorkout, error: workoutError } = await supabase
        .from('user_workouts')
        .insert({
          user_id: session?.user.id,
          name: workoutToCopy.name,
          scheduled_date: new Date().toISOString(),
          completed: false,
          notes: workoutToCopy.notes,
          custom_name: workoutToCopy.custom_name
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Copy exercises
      if (workoutToCopy.workout_exercises) {
        const exercisesToCopy = workoutToCopy.workout_exercises.map(exercise => ({
          workout_id: newWorkout.id,
          exercise_id: exercise.exercise.id,
          sets: exercise.sets,
          reps_per_set: exercise.reps_per_set,
          order_in_workout: exercise.order_in_workout
        }));

        const { data: newExercises, error: exercisesError } = await supabase
          .from('workout_exercises')
          .insert(exercisesToCopy)
          .select();

        if (exercisesError) throw exercisesError;

        // Create sets for each exercise
        for (const exercise of newExercises) {
          const sets = Array.from({ length: exercise.sets }, (_, i) => ({
            workout_exercise_id: exercise.id,
            set_number: i + 1,
            reps: exercise.reps_per_set,
            weight_lbs: null,
            completed: false
          }));

          const { error: setsError } = await supabase
            .from('exercise_sets')
            .insert(sets);

          if (setsError) throw setsError;
        }
      }

      // Reload workouts
      await loadWorkouts();
    } catch (error) {
      console.error('Error adding workout to week:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-text-secondary">Loading your workout history...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-text-highlight mb-6">Your Workouts</h1>
      
      {selectedWorkoutId ? (
        <WorkoutDetails
          workoutId={selectedWorkoutId}
          onClose={() => setSelectedWorkoutId(null)}
          onUpdate={handleWorkoutUpdate}
        />
      ) : (
        <div className="space-y-6">
          <WeeklyWorkouts
            workouts={workouts}
            currentWeekStart={currentWeekStart}
            onWeekChange={setCurrentWeekStart}
            onWorkoutSelect={setSelectedWorkoutId}
            onDelete={handleDeleteWorkout}
            onCopyWeek={handleCopyWeek}
            onRename={handleRename}
            onToggleFavorite={handleToggleFavorite}
            onAddWorkout={handleAddWorkout}
          />
          <SharedWorkouts
            workouts={workouts}
            onSelect={setSelectedWorkoutId}
            onAddToWeek={handleAddToWeek}
            onToggleFavorite={handleToggleFavorite}
          />
          <FavoriteWorkouts
            workouts={workouts}
            onSelect={setSelectedWorkoutId}
            onAddToWeek={handleAddToWeek}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>
      )}
    </div>
  );
}