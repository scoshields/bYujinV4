/*
  # Workout Generator Schema

  1. New Tables
    - `exercises`
      - Basic exercise information and categorization
    - `workout_templates`
      - Template configurations for generating workouts
    - `user_workouts`
      - Generated workouts for users
    - `workout_exercises`
      - Exercises within a workout with sets/reps
    - `exercise_logs`
      - User's completed sets/reps tracking

  2. Security
    - Enable RLS on all tables
    - Policies for user data access
    - Public read access for exercises table
*/

-- Create enum types for categorization
CREATE TYPE exercise_type AS ENUM (
  'strength',
  'cardio',
  'flexibility',
  'balance'
);

CREATE TYPE muscle_group AS ENUM (
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'core',
  'full_body'
);

CREATE TYPE difficulty_level AS ENUM (
  'beginner',
  'intermediate',
  'advanced'
);

-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  exercise_type exercise_type NOT NULL,
  primary_muscle_group muscle_group NOT NULL,
  secondary_muscle_groups muscle_group[] DEFAULT '{}',
  difficulty difficulty_level NOT NULL DEFAULT 'intermediate',
  equipment_needed text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Workout templates
CREATE TABLE IF NOT EXISTS workout_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  description text,
  exercise_types exercise_type[] NOT NULL,
  target_muscle_groups muscle_group[] NOT NULL,
  difficulty difficulty_level NOT NULL,
  duration_minutes integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User workouts
CREATE TABLE IF NOT EXISTS user_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  template_id uuid REFERENCES workout_templates(id),
  name text NOT NULL,
  scheduled_date date NOT NULL,
  completed boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Workout exercises (sets/reps planning)
CREATE TABLE IF NOT EXISTS workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid REFERENCES user_workouts(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES exercises(id),
  sets integer NOT NULL,
  reps_per_set integer,
  weight_lbs numeric,
  duration_minutes integer,
  order_in_workout integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Exercise logs (actual performed sets/reps)
CREATE TABLE IF NOT EXISTS exercise_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id uuid REFERENCES workout_exercises(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  actual_sets integer NOT NULL,
  actual_reps integer,
  actual_weight_lbs numeric,
  actual_duration_minutes integer,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Exercises are readable by all
CREATE POLICY "Exercises are readable by all"
  ON exercises FOR SELECT
  TO authenticated
  USING (true);

-- Workout templates
CREATE POLICY "Users can manage their own templates"
  ON workout_templates
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- User workouts
CREATE POLICY "Users can manage their own workouts"
  ON user_workouts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Workout exercises
CREATE POLICY "Users can manage exercises in their workouts"
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

-- Exercise logs
CREATE POLICY "Users can manage their own exercise logs"
  ON exercise_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert some sample exercises
INSERT INTO exercises (name, description, exercise_type, primary_muscle_group, difficulty, equipment_needed)
VALUES
  ('Push-ups', 'Basic push-up movement', 'strength', 'chest', 'beginner', '{}'),
  ('Pull-ups', 'Basic pull-up movement', 'strength', 'back', 'intermediate', '{pull-up bar}'),
  ('Squats', 'Basic squat movement', 'strength', 'legs', 'beginner', '{}'),
  ('Plank', 'Core stabilization exercise', 'strength', 'core', 'beginner', '{}'),
  ('Dumbbell Rows', 'Back exercise with dumbbells', 'strength', 'back', 'intermediate', '{dumbbells}');