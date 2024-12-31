/*
  # Fix workout exercises relationship

  1. Changes
    - Add exercise_id foreign key reference to exercises table
    - Update RLS policy for workout exercises

  2. Security
    - Maintain existing RLS policies
    - Ensure users can only view their own workout details
*/

-- Add foreign key constraint to workout_exercises
ALTER TABLE workout_exercises
ADD CONSTRAINT workout_exercises_exercise_id_fkey
FOREIGN KEY (exercise_id) REFERENCES exercises(id);

-- Update RLS policy for workout_exercises to include exercise details
DROP POLICY IF EXISTS "Users can manage exercises in their workouts" ON workout_exercises;

CREATE POLICY "Users can view workout exercises"
  ON workout_exercises
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_workouts
      WHERE user_workouts.id = workout_exercises.workout_id
      AND user_workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their workout exercises"
  ON workout_exercises
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_workouts
      WHERE user_workouts.id = workout_exercises.workout_id
      AND user_workouts.user_id = auth.uid()
    )
  );