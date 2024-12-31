import React, { useState } from 'react';
import { Dumbbell, Brain } from 'lucide-react';
import GuidedWorkoutForm from '../components/GuidedWorkoutForm';
import ExpertWorkoutForm from '../components/ExpertWorkoutForm';
import { Exercise } from '../types/database';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { GuidedWorkoutFormData, GeneratedWorkout } from '../types/workout';
import { generateFullWorkoutPlan } from '../utils/workoutGenerators';
import type { ExpertWorkoutData } from '../components/ExpertWorkoutForm';

type Mode = 'select' | 'guided' | 'expert';

export default function WorkoutGenerator() {
  const [mode, setMode] = useState<Mode>('select');
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [generatedWorkouts, setGeneratedWorkouts] = useState<GeneratedWorkout[]>([]);
  const { session } = useAuthStore();

  React.useEffect(() => {
    if (mode === 'expert') {
      loadExercises();
    }
  }, [mode]);

  const loadExercises = async () => {
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .order('name');
    
    if (data) {
      setExercises(data);
    }
  };

  const handleGuidedSubmit = async (data: GuidedWorkoutFormData) => {
    if (!session?.user.id) return;
    
    setLoading(true);
    try {
      const workouts = await generateFullWorkoutPlan(
        {
          userId: session.user.id,
          level: data.level,
          equipment: data.equipment,
          workoutType: data.workoutType,
          daysPerWeek: data.daysPerWeek
        }
      );

      setGeneratedWorkouts(workouts.map(workout => ({
        name: workout.name,
        exercises: workout.exercises,
        notes: `${data.level} level ${data.workoutType ? 'single-day' : ''} ${workout.name.toLowerCase()}`
      })));
    } catch (error) {
      console.error('Error generating workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetWorkoutGenerator = () => {
    setMode('select');
    setGeneratedWorkouts([]);
  };

  const handleExpertSubmit = async (data: ExpertWorkoutData) => {
    if (!session?.user.id) return;
    
    setLoading(true);
    try {
      // Create a new workout
      const { data: workoutData, error: workoutError } = await supabase
        .from('user_workouts')
        .insert({
          user_id: session.user.id,
          name: 'Custom Workout',
          scheduled_date: new Date().toISOString(),
          completed: false,
          notes: data.notes
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Add exercises to the workout
      const workoutExercises = data.selectedExercises.map((exerciseId, index) => ({
        workout_id: workoutData.id,
        exercise_id: exerciseId,
        sets: data.sets[exerciseId] || 3,
        reps_per_set: data.reps[exerciseId] || 10,
        order_in_workout: index + 1
      }));

      const { error: exerciseError } = await supabase
        .from('workout_exercises')
        .insert(workoutExercises);

      if (exerciseError) throw exerciseError;

      // Reset form
      setMode('select');
    } catch (error) {
      console.error('Error creating custom workout:', error);
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'select') {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-text-highlight mb-8">Generate a Workout</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => {
              setMode('guided');
              setGeneratedWorkouts([]);
            }}
            className="card p-6 hover:border-accent-blue transition-all duration-200 text-left"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-accent-blue/20 rounded-lg">
                <Dumbbell className="h-6 w-6 text-accent-blue" />
              </div>
              <h2 className="text-xl font-semibold text-text-highlight">Guided Approach</h2>
            </div>
            <p className="text-text-secondary">
              Perfect for beginners. We'll guide you through a series of questions
              to create the perfect workout for your needs.
            </p>
          </button>

          <button
            disabled
            className="card p-6 opacity-50 cursor-not-allowed text-left"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-accent-blue/20 rounded-lg">
                <Brain className="h-6 w-6 text-accent-blue" />
              </div>
              <h2 className="text-xl font-semibold text-text-highlight">Expert Mode</h2>
            </div>
            <p className="text-text-secondary">
              Coming soon! Create custom workouts by selecting specific exercises
              and configuring sets and reps.
            </p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={resetWorkoutGenerator}
          className="text-sm text-accent-blue hover:text-accent-blue-hover"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-text-highlight">
          {mode === 'guided' ? 'Guided Workout Generator' : 'Expert Workout Creator'}
        </h1>
        <div className="w-16" /> {/* Spacer for alignment */}
      </div>

      {generatedWorkouts.length > 0 ? (
        <div className="space-y-8">
          {generatedWorkouts.map((workout, index) => (
            <div key={index} className="card p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4">{workout.name}</h2>
              {workout.notes && (
                <p className="text-text-secondary mb-6">{workout.notes}</p>
              )}
              <div className="space-y-6">
                {workout.exercises.map((exercise, exerciseIndex) => (
                  <div key={exerciseIndex} className="border-b pb-4 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-text-primary">{exercise.name}</h3>
                        <p className="text-sm text-text-secondary">{exercise.target_muscle_group}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-text-primary">{exercise.sets} sets × {exercise.reps} reps</p>
                        <p className="text-sm text-text-secondary">{exercise.primary_equipment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : mode === 'guided' ? (
        <GuidedWorkoutForm onSubmit={handleGuidedSubmit} loading={loading} />
      ) : (
        <ExpertWorkoutForm
          onSubmit={handleExpertSubmit}
          loading={loading}
          exercises={exercises}
        />
      )}
    </div>
  );
}