/*
  # Fix workout exercises and add sample data

  1. Changes
    - Add sample exercises for push, pull, and leg workouts
    - Ensure proper foreign key relationships
    - Update workout_exercises table structure

  2. Security
    - No changes to security policies
*/

-- First, let's add a comprehensive set of exercises
INSERT INTO exercises (name, target_muscle_group, primary_equipment, grip, mechanics) VALUES
  -- Push Exercises
  ('Bench Press', 'Chest', 'Barbell', 'Pronated', 'Compound'),
  ('Incline Dumbbell Press', 'Upper Chest', 'Dumbbells', 'Neutral', 'Compound'),
  ('Overhead Press', 'Shoulders', 'Barbell', 'Pronated', 'Compound'),
  ('Lateral Raises', 'Shoulders', 'Dumbbells', 'Neutral', 'Isolation'),
  ('Tricep Pushdowns', 'Triceps', 'Cable Machine', 'Pronated', 'Isolation'),
  ('Close Grip Bench Press', 'Triceps', 'Barbell', 'Pronated', 'Compound'),

  -- Pull Exercises
  ('Barbell Row', 'Back', 'Barbell', 'Pronated', 'Compound'),
  ('Pull-ups', 'Back', 'Bodyweight', 'Pronated', 'Compound'),
  ('Face Pulls', 'Back', 'Cable Machine', 'Neutral', 'Compound'),
  ('Dumbbell Curls', 'Biceps', 'Dumbbells', 'Supinated', 'Isolation'),
  ('Hammer Curls', 'Biceps', 'Dumbbells', 'Neutral', 'Isolation'),
  ('Cable Rows', 'Back', 'Cable Machine', 'Neutral', 'Compound'),

  -- Leg Exercises
  ('Squats', 'Quadriceps', 'Barbell', 'Pronated', 'Compound'),
  ('Romanian Deadlift', 'Hamstrings', 'Barbell', 'Pronated', 'Compound'),
  ('Leg Press', 'Quadriceps', 'Machine', 'No Grip', 'Compound'),
  ('Calf Raises', 'Calves', 'Machine', 'No Grip', 'Isolation'),
  ('Hip Thrust', 'Glutes', 'Barbell', 'No Grip', 'Compound'),
  ('Bulgarian Split Squats', 'Quadriceps', 'Dumbbells', 'Neutral', 'Compound');

-- Ensure the foreign key constraint exists and is correct
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'workout_exercises_exercise_id_fkey'
  ) THEN
    ALTER TABLE workout_exercises
    ADD CONSTRAINT workout_exercises_exercise_id_fkey
    FOREIGN KEY (exercise_id) REFERENCES exercises(id);
  END IF;
END $$;