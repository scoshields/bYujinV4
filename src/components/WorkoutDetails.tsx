import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Plus, Video, FileDown, Share2 } from 'lucide-react';
import ShareWorkoutDialog from './ShareWorkoutDialog';
import { debounce } from '../utils/debounce';
import { exportWorkoutToPDF } from '../utils/pdfExport';

interface ExerciseSet {
  id: string;
  set_number: number;
  weight_lbs: number | null;
  reps: number;
  completed: boolean;
}

interface WorkoutExercise {
  id: string;
  exercise: {
    name: string;
    target_muscle_group: string;
    primary_equipment: string;
    video_link?: string;
  };
  sets: number;
  reps_per_set: number;
  exercise_sets: ExerciseSet[];
}

interface WorkoutDetailsProps {
  workoutId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function WorkoutDetails({ workoutId, onClose, onUpdate }: WorkoutDetailsProps) {
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [replacingExerciseId, setReplacingExerciseId] = useState<string | null>(null);
  const [userWeight, setUserWeight] = useState<number | null>(null);

  useEffect(() => {
    loadUserWeight();
  }, []);

  const loadUserWeight = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('weight_lbs')
        .eq('id', user.id)
        .single();

      if (profile?.weight_lbs) {
        setUserWeight(profile.weight_lbs);
      }
    } catch (error) {
      console.error('Error loading user weight:', error);
    }
  };

  const getDefaultWeight = (exercise: WorkoutExercise['exercise']) => {
    if (exercise.primary_equipment.toLowerCase() === 'bodyweight' && userWeight) {
      return userWeight;
    }
    return null;
  };

  useEffect(() => {
    loadExercises();
  }, [workoutId]);

  const loadExercises = async () => {
    try {
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('workout_exercises')
        .select(`
          id,
          exercise:exercises (
            name,
            target_muscle_group,
            primary_equipment,
            video_link
          ),
          sets,
          reps_per_set
        `)
        .eq('workout_id', workoutId)
        .order('order_in_workout');

      if (exercisesError) throw exercisesError;

      // Load sets for each exercise
      const exercisesWithSets = await Promise.all(
        exercisesData.map(async (exercise) => {
          const { data: setsData, error: setsError } = await supabase
            .from('exercise_sets')
            .select('*')
            .eq('workout_exercise_id', exercise.id)
            .order('set_number');

          if (setsError) throw setsError;

          return {
            ...exercise,
            exercise_sets: setsData || []
          };
        })
      );

      setExercises(exercisesWithSets);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSave = useCallback(
    debounce(async (setId: string, field: string, value: number | boolean) => {
      try {
        const { error } = await supabase
          .from('exercise_sets')
          .update({ [field]: value })
          .eq('id', setId);

        if (error) throw error;
      } catch (err) {
        console.error('Error updating set:', err);
      } finally {
        onUpdate(); // Trigger workout list refresh
      }
    }, 500),
    [onUpdate]
  );

  const handleSetChange = (
    exerciseId: string,
    setId: string,
    field: 'weight_lbs' | 'reps' | 'completed',
    value: number | boolean
  ) => {
    setExercises(prev => prev.map(e => {
      if (e.id === exerciseId) {
        return {
          ...e,
          exercise_sets: e.exercise_sets.map(s => {
            if (s.id === setId) {
              return { ...s, [field]: value };
            }
            return s;
          })
        };
      }
      return e;
    }));

    debouncedSave(setId, field, value);
  };

  const handleDeleteSet = async (exerciseId: string, setId: string) => {
    try {
      const { error } = await supabase
        .from('exercise_sets')
        .delete()
        .eq('id', setId);

      if (error) throw error;

      setExercises(prev => prev.map(e => {
        if (e.id === exerciseId) {
          return {
            ...e,
            exercise_sets: e.exercise_sets.filter(s => s.id !== setId)
          };
        }
        return e;
      }));
    } catch (error) {
      console.error('Error deleting set:', error);
    }
  };

  const handleAddSet = async (exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    const newSetNumber = exercise.exercise_sets.length + 1;

    try {
      const { data, error } = await supabase
        .from('exercise_sets')
        .insert({
          workout_exercise_id: exerciseId,
          set_number: newSetNumber,
          reps: exercise.reps_per_set,
          weight_lbs: null,
          completed: false
        })
        .select()
        .single();

      if (error) throw error;

      setExercises(prev => prev.map(e => {
        if (e.id === exerciseId) {
          return {
            ...e,
            exercise_sets: [...e.exercise_sets, data]
          };
        }
        return e;
      }));
    } catch (error) {
      console.error('Error adding set:', error);
    }
  };

  const handleReplaceExercise = async (exerciseId: string) => {
    try {
      setReplacingExerciseId(exerciseId);
      
      // Get the current exercise details
      const currentExercise = exercises.find(e => e.id === exerciseId);
      if (!currentExercise) return;

      // Get all equipment used in this workout
      const workoutEquipment = exercises.map(e => e.exercise.primary_equipment);
      
      // Get a replacement exercise
      const { data: newExercise, error } = await supabase
        .rpc('get_replacement_exercise', {
          p_target_muscle_group: currentExercise.exercise.target_muscle_group,
          p_equipment: workoutEquipment
        })
        .single();

      if (error) throw error;
      if (!newExercise) throw new Error('No replacement exercise found');

      // Update the exercise
      const { error: updateError } = await supabase
        .from('workout_exercises')
        .update({ exercise_id: newExercise.id })
        .eq('id', exerciseId);

      if (updateError) throw updateError;

      // Reload exercises to show the change
      await loadExercises();
    } catch (error) {
      console.error('Error replacing exercise:', error);
    } finally {
      setReplacingExerciseId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="card p-3 sm:p-6">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg sm:text-xl font-semibold">Workout Details</h3>
          <button
            onClick={() => setShowShareDialog(true)}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-accent-blue hover:text-accent-blue-hover rounded-md transition-colors"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button
            onClick={() => exportWorkoutToPDF({
              name: exercises[0]?.exercise.name || 'Workout',
              scheduled_date: new Date().toISOString(),
              completed: exercises.every(e => 
                e.exercise_sets?.every(s => s.completed)
              ),
              notes: '',
              workout_exercises: exercises
            })}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-accent-blue hover:text-accent-blue-hover rounded-md transition-colors"
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
        <button onClick={onClose} className="text-text-secondary hover:text-text-primary">Close</button>
      </div>

      <div className="space-y-6 sm:space-y-8">
        {exercises.map((exercise) => (
          <div key={exercise.id} className="border-b pb-6 last:border-b-0">
            <div className="mb-4 space-y-2">
              <h4 className="font-medium text-lg">{exercise.exercise.name}</h4>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="px-2 py-1 bg-background rounded-md border border-divider">
                  {exercise.exercise.target_muscle_group}
                </span>
                <span className="px-2 py-1 bg-background rounded-md border border-divider">
                  {exercise.exercise.primary_equipment}
                </span>
                {exercise.exercise.video_link && (
                  <a
                    href={exercise.exercise.video_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium text-accent-blue hover:text-accent-blue-hover bg-background rounded-md border border-accent-blue hover:border-accent-blue-hover transition-colors whitespace-nowrap"
                  >
                    <Video className="h-4 w-4" />
                    <span className="hidden sm:inline">Watch Demo</span>
                    <span className="sm:hidden">Demo</span>
                  </a>
                )}
                <button
                  onClick={() => handleReplaceExercise(exercise.id)}
                  disabled={replacingExerciseId === exercise.id}
                  className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium text-text-secondary hover:text-text-primary bg-background rounded-md border border-divider hover:border-text-secondary transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {replacingExerciseId === exercise.id ? (
                    <span>Replacing...</span>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Replace Exercise</span>
                      <span className="sm:hidden">Replace</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="text-left">
                    <th className="py-2 px-1 sm:px-4 font-medium w-12 sm:w-16">Set</th>
                    <th className="py-2 px-1 sm:px-4 font-medium w-20 sm:w-32">Weight</th>
                    <th className="py-2 px-1 sm:px-4 font-medium w-16 sm:w-20">Reps</th>
                    <th className="py-2 px-1 sm:px-4 font-medium w-10 sm:w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {exercise.exercise_sets.map((set) => (
                    <tr key={set.id} className="border-t">
                      <td className="py-2 sm:py-3 px-1 sm:px-4 text-center">{set.set_number}</td>
                      <td className="py-2 sm:py-3 px-1 sm:px-4">
                        <input
                          type="number"
                          value={set.weight_lbs ?? getDefaultWeight(exercise.exercise) ?? ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : parseFloat(e.target.value);
                            if (!isNaN(value as number)) {
                              handleSetChange(exercise.id, set.id, 'weight_lbs', value as number);
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value);
                            if (isNaN(value)) {
                              e.target.value = '';
                              handleSetChange(exercise.id, set.id, 'weight_lbs', null);
                            }
                          }}
                          className="w-16 sm:w-24 px-2 sm:px-3 py-1 border border-divider rounded-md shadow-sm focus:ring-1 focus:ring-accent-blue focus:border-accent-blue bg-background text-text-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="Weight"
                          min="0"
                          step="2.5"
                        />
                      </td>
                      <td className="py-2 sm:py-3 px-1 sm:px-4">
                        <input
                          type="number"
                          value={set.reps || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                              handleSetChange(exercise.id, set.id, 'reps', value);
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseInt(e.target.value);
                            if (isNaN(value)) {
                              e.target.value = '';
                              handleSetChange(exercise.id, set.id, 'reps', 0);
                            }
                          }}
                          className="w-12 sm:w-20 px-2 sm:px-3 py-1 border border-divider rounded-md shadow-sm focus:ring-1 focus:ring-accent-blue focus:border-accent-blue bg-background text-text-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="Reps"
                          min="0"
                        />
                      </td>
                      <td className="py-2 sm:py-3 px-1 sm:px-4 text-center">
                        <button
                          onClick={() => handleDeleteSet(exercise.id, set.id)}
                          className="text-error hover:text-error/80"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => handleAddSet(exercise.id)}
              className="mt-4 flex items-center text-accent-blue hover:text-accent-blue-hover"
            >
              <Plus className="h-5 w-5 mr-1" />
              Add Set
            </button>
          </div>
        ))}
      </div>
      
      {showShareDialog && (
        <ShareWorkoutDialog
          workoutId={workoutId}
          onClose={() => setShowShareDialog(false)}
          onShare={() => {
            setShowShareDialog(false);
            onUpdate();
          }}
        />
      )}
    </div>
  );
}