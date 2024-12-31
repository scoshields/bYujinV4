/*
  # Fix Weight Handling in Completion Trigger

  1. Changes
    - Modify trigger to properly handle weight values
    - Add explicit type casting for weight_lbs
    - Add validation for weight value

  2. Notes
    - Ensures full numeric value is saved
    - Prevents partial weight values
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS exercise_completion_trigger ON exercise_sets;
DROP FUNCTION IF EXISTS handle_exercise_completion();

-- Recreate function with proper weight handling
CREATE OR REPLACE FUNCTION handle_exercise_completion()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER exercise_completion_trigger
  AFTER INSERT OR UPDATE OF weight_lbs
  ON exercise_sets
  FOR EACH ROW
  EXECUTE FUNCTION handle_exercise_completion();