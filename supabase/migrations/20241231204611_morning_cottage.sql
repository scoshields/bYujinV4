-- Create function to update workout completion status
CREATE OR REPLACE FUNCTION update_workout_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the workout's completed status based on whether any sets have weights
  UPDATE user_workouts
  SET completed = EXISTS (
    SELECT 1
    FROM workout_exercises we
    JOIN exercise_sets es ON es.workout_exercise_id = we.id
    WHERE we.workout_id = (
      SELECT workout_id 
      FROM workout_exercises 
      WHERE id = NEW.workout_exercise_id
    )
    AND es.weight_lbs IS NOT NULL
  )
  WHERE id = (
    SELECT workout_id 
    FROM workout_exercises 
    WHERE id = NEW.workout_exercise_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update workout completion when exercise sets change
DROP TRIGGER IF EXISTS update_workout_completion_trigger ON exercise_sets;
CREATE TRIGGER update_workout_completion_trigger
  AFTER INSERT OR UPDATE OF weight_lbs
  ON exercise_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_workout_completion();

-- Update exercise_sets to set completed when weight is added
CREATE OR REPLACE FUNCTION update_set_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.weight_lbs IS NOT NULL AND NEW.weight_lbs != 0 THEN
    NEW.completed := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update set completion when weight is added
DROP TRIGGER IF EXISTS update_set_completion_trigger ON exercise_sets;
CREATE TRIGGER update_set_completion_trigger
  BEFORE INSERT OR UPDATE OF weight_lbs
  ON exercise_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_set_completion();

-- Update existing records
UPDATE exercise_sets
SET completed = true
WHERE weight_lbs IS NOT NULL AND weight_lbs != 0;

-- Update workout completion status for all workouts
UPDATE user_workouts w
SET completed = EXISTS (
  SELECT 1
  FROM workout_exercises we
  JOIN exercise_sets es ON es.workout_exercise_id = we.id
  WHERE we.workout_id = w.id
  AND es.weight_lbs IS NOT NULL
);