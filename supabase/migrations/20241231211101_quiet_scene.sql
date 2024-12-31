/*
  # Fix RLS policies for completed exercises

  1. Changes
    - Add SECURITY DEFINER to trigger function
    - Update RLS policies for completed_exercises table
    - Add explicit grant for trigger function

  2. Security
    - Enable RLS on completed_exercises
    - Add policies for viewing and inserting records
    - Allow friends to view completed exercises
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS exercise_completion_trigger ON exercise_sets;
DROP FUNCTION IF EXISTS handle_exercise_completion();

-- Recreate function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION handle_exercise_completion()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_workout_id uuid;
  v_exercise_id uuid;
  v_user_id uuid;
  v_total_sets integer;
  v_avg_reps integer;
BEGIN
  -- Only proceed if weight is being set and is valid
  IF NEW.weight_lbs IS NOT NULL AND NEW.weight_lbs > 0 AND 
     (TG_OP = 'INSERT' OR OLD.weight_lbs IS NULL OR OLD.weight_lbs != NEW.weight_lbs) THEN
    
    -- Get workout and exercise info
    SELECT 
      w.id,
      w.user_id,
      we.exercise_id,
      COUNT(es.id),
      ROUND(AVG(es.reps))
    INTO 
      v_workout_id,
      v_user_id,
      v_exercise_id,
      v_total_sets,
      v_avg_reps
    FROM workout_exercises we
    JOIN user_workouts w ON w.id = we.workout_id
    LEFT JOIN exercise_sets es ON es.workout_exercise_id = we.id
    WHERE we.id = NEW.workout_exercise_id
    GROUP BY w.id, w.user_id, we.exercise_id;

    -- Insert into completed_exercises with explicit numeric casting
    INSERT INTO completed_exercises (
      user_id,
      workout_id,
      exercise_id,
      weight_lbs,
      sets,
      reps,
      completed_at
    )
    VALUES (
      v_user_id,
      v_workout_id,
      v_exercise_id,
      NEW.weight_lbs::numeric,
      v_total_sets,
      v_avg_reps,
      now()
    )
    ON CONFLICT (user_id, workout_id, exercise_id) 
    DO UPDATE SET
      weight_lbs = EXCLUDED.weight_lbs,
      sets = EXCLUDED.sets,
      reps = EXCLUDED.reps,
      completed_at = EXCLUDED.completed_at;

    -- Update workout completion status
    UPDATE user_workouts
    SET completed = true
    WHERE id = v_workout_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER exercise_completion_trigger
  AFTER INSERT OR UPDATE OF weight_lbs
  ON exercise_sets
  FOR EACH ROW
  EXECUTE FUNCTION handle_exercise_completion();

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION handle_exercise_completion() TO authenticated;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own completed exercises" ON completed_exercises;
DROP POLICY IF EXISTS "Users can view their own and friends' completed exercises" ON completed_exercises;
DROP POLICY IF EXISTS "Users can insert their own completed exercises" ON completed_exercises;

-- Create new RLS policies
CREATE POLICY "Users can view their own and friends' completed exercises"
  ON completed_exercises
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM friendships
      WHERE status = 'accepted'
      AND (
        (user_id = auth.uid() AND friend_id = completed_exercises.user_id) OR
        (friend_id = auth.uid() AND user_id = completed_exercises.user_id)
      )
    )
  );

CREATE POLICY "Users can manage their own completed exercises"
  ON completed_exercises
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add comment explaining the policies
COMMENT ON TABLE completed_exercises IS 'Stores completed exercises with RLS policies allowing viewing by friends and management by owners';