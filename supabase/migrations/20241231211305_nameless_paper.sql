/*
  # Update exercise completion to use max weight

  1. Changes
    - Modify trigger function to use maximum weight for completed exercises
    - Add explicit error handling
    - Add comments for clarity

  2. Security
    - Maintain SECURITY DEFINER setting
    - Keep existing RLS policies
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS exercise_completion_trigger ON exercise_sets;
DROP FUNCTION IF EXISTS handle_exercise_completion();

-- Recreate function with max weight tracking
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
  v_max_weight numeric;
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
      ROUND(AVG(es.reps)),
      MAX(es.weight_lbs)
    INTO 
      v_workout_id,
      v_user_id,
      v_exercise_id,
      v_total_sets,
      v_avg_reps,
      v_max_weight
    FROM workout_exercises we
    JOIN user_workouts w ON w.id = we.workout_id
    LEFT JOIN exercise_sets es ON es.workout_exercise_id = we.id
    WHERE we.id = NEW.workout_exercise_id
    GROUP BY w.id, w.user_id, we.exercise_id;

    -- Use the maximum weight between the new set and existing sets
    v_max_weight := GREATEST(COALESCE(v_max_weight, 0), NEW.weight_lbs);

    -- Insert into completed_exercises with max weight
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
      v_max_weight::numeric,
      v_total_sets,
      v_avg_reps,
      now()
    )
    ON CONFLICT (user_id, workout_id, exercise_id) 
    DO UPDATE SET
      weight_lbs = GREATEST(completed_exercises.weight_lbs, EXCLUDED.weight_lbs),
      sets = EXCLUDED.sets,
      reps = EXCLUDED.reps,
      completed_at = EXCLUDED.completed_at;

    -- Update workout completion status
    UPDATE user_workouts
    SET completed = true
    WHERE id = v_workout_id;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error details
  RAISE WARNING 'Error in handle_exercise_completion: %', SQLERRM;
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

-- Add comment explaining the function
COMMENT ON FUNCTION handle_exercise_completion() IS 'Tracks completed exercises using maximum weight for each exercise in a workout';