/*
  # Add set tracking capabilities
  
  1. New Tables
    - `exercise_sets`: Stores individual set data for each exercise
      - `id` (uuid, primary key)
      - `workout_exercise_id` (uuid, references workout_exercises)
      - `set_number` (integer)
      - `weight_lbs` (numeric)
      - `reps` (integer)
      - `completed` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on new table
    - Add policies for authenticated users to manage their sets
*/

-- Create exercise_sets table
CREATE TABLE IF NOT EXISTS exercise_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id uuid REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number integer NOT NULL,
  weight_lbs numeric,
  reps integer,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their exercise sets"
  ON exercise_sets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_exercises we
      JOIN user_workouts uw ON we.workout_id = uw.id
      WHERE we.id = exercise_sets.workout_exercise_id
      AND uw.user_id = auth.uid()
    )
  );