/*
  # Add Completion Trigger

  1. New Functions
    - `handle_exercise_completion`: Handles inserting records into completed_exercises
    - Updates user_workouts.completed status

  2. Changes
    - Adds trigger for exercise_sets table
    - Handles both INSERT and UPDATE operations
    - Only triggers when weight_lbs is set

  3. Notes
    - Only creates completion records when weight is added
    - Aggregates sets and reps for the exercise
*/

-- Create function to handle exercise completion
CREATE OR REPLACE FUNCTION handle_exercise_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_workout_id uuid;
  v_exercise_id uuid;
  v_user_id uuid;
  v_total_sets integer;
  v_avg_reps integer;
BEGIN
  -- Only proceed if weight is being set
  IF NEW.weight_lbs IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.weight_lbs IS NULL) THEN
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

    -- Insert into completed_exercises if not exists
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
      NEW.weight_lbs,
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

-- Create trigger for exercise completion
DROP TRIGGER IF EXISTS exercise_completion_trigger ON exercise_sets;
CREATE TRIGGER exercise_completion_trigger
  AFTER INSERT OR UPDATE OF weight_lbs
  ON exercise_sets
  FOR EACH ROW
  EXECUTE FUNCTION handle_exercise_completion();

-- Add unique constraint to prevent duplicates
ALTER TABLE completed_exercises
ADD CONSTRAINT completed_exercises_unique_completion
UNIQUE (user_id, workout_id, exercise_id);