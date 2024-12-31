/*
  # Add Completion Tracking

  1. New Tables
    - `completed_exercises` tracks completed exercises with their sets and weights
    - Includes user_id, exercise_id, workout_id, completed_at, and weight_lbs

  2. Changes
    - Adds indexes for efficient querying
    - Adds RLS policies for security
    - Adds functions to get friend activity based on completions

  3. Notes
    - Only tracks actual completed exercises (with weights)
    - Simplifies querying for completed workouts
*/

-- Create completed_exercises table
CREATE TABLE completed_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  workout_id uuid REFERENCES user_workouts(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES exercises(id) ON DELETE CASCADE,
  weight_lbs numeric NOT NULL CHECK (weight_lbs > 0),
  sets integer NOT NULL CHECK (sets > 0),
  reps integer NOT NULL CHECK (reps > 0),
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_completed_exercises_user_id ON completed_exercises(user_id);
CREATE INDEX idx_completed_exercises_completed_at ON completed_exercises(completed_at);
CREATE INDEX idx_completed_exercises_workout_id ON completed_exercises(workout_id);

-- Enable RLS
ALTER TABLE completed_exercises ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view their own completed exercises"
  ON completed_exercises
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completed exercises"
  ON completed_exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to get friend activity
CREATE OR REPLACE FUNCTION get_friend_activity(
  p_user_id uuid,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  username text,
  first_name text,
  last_name text,
  avatar_url text,
  workout_id uuid,
  workout_name text,
  completed_at timestamptz,
  total_exercises integer,
  total_sets integer,
  exercises jsonb
) AS $$
BEGIN
  RETURN QUERY
  WITH workout_completions AS (
    SELECT 
      ce.workout_id,
      ce.user_id,
      MIN(ce.completed_at) as completed_at,
      COUNT(DISTINCT ce.exercise_id) as total_exercises,
      SUM(ce.sets) as total_sets,
      jsonb_agg(
        jsonb_build_object(
          'name', e.name,
          'target_muscle_group', e.target_muscle_group,
          'sets', ce.sets,
          'reps', ce.reps,
          'weight_lbs', ce.weight_lbs
        )
      ) as exercises
    FROM completed_exercises ce
    JOIN exercises e ON e.id = ce.exercise_id
    GROUP BY ce.workout_id, ce.user_id
  )
  SELECT 
    wc.workout_id as id,
    p.id as user_id,
    p.username,
    p.first_name,
    p.last_name,
    p.avatar_url,
    w.id as workout_id,
    w.name as workout_name,
    wc.completed_at,
    wc.total_exercises,
    wc.total_sets,
    wc.exercises
  FROM workout_completions wc
  JOIN profiles p ON p.id = wc.user_id
  JOIN user_workouts w ON w.id = wc.workout_id
  WHERE EXISTS (
    SELECT 1 FROM friendships f
    WHERE f.status = 'accepted'
    AND (
      (f.user_id = p_user_id AND f.friend_id = wc.user_id) OR
      (f.friend_id = p_user_id AND f.user_id = wc.user_id)
    )
  )
  ORDER BY wc.completed_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get friend stats
CREATE OR REPLACE FUNCTION get_friend_stats(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  user_id uuid,
  username text,
  first_name text,
  last_name text,
  avatar_url text,
  total_workouts integer,
  total_exercises integer,
  total_sets integer,
  total_weight numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.first_name,
    p.last_name,
    p.avatar_url,
    COUNT(DISTINCT ce.workout_id)::integer as total_workouts,
    COUNT(DISTINCT ce.exercise_id)::integer as total_exercises,
    SUM(ce.sets)::integer as total_sets,
    SUM(ce.sets * ce.reps * ce.weight_lbs) as total_weight
  FROM profiles p
  INNER JOIN friendships f ON 
    (f.user_id = p_user_id AND f.friend_id = p.id) OR
    (f.friend_id = p_user_id AND f.user_id = p.id)
  LEFT JOIN completed_exercises ce ON 
    ce.user_id = p.id AND
    ce.completed_at::date BETWEEN p_start_date AND p_end_date
  WHERE f.status = 'accepted'
  GROUP BY p.id, p.username, p.first_name, p.last_name, p.avatar_url
  ORDER BY total_workouts DESC, total_exercises DESC;
END;
$$ LANGUAGE plpgsql;