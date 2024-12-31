/*
  # Add workout sharing functionality

  1. New Functions
    - `share_workout`: Copies a workout to another user
  
  2. Changes
    - Add `shared_from` column to track workout origins
*/

-- Add shared_from column to track workout origins
ALTER TABLE user_workouts
ADD COLUMN shared_from uuid REFERENCES user_workouts(id);

-- Create function to share workout
CREATE OR REPLACE FUNCTION share_workout(
  p_workout_id uuid,
  p_recipient_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_workout_id uuid;
  v_workout_name text;
  v_workout_date date;
BEGIN
  -- Get workout details
  SELECT name, scheduled_date
  INTO v_workout_name, v_workout_date
  FROM user_workouts
  WHERE id = p_workout_id;

  -- Create new workout for recipient
  INSERT INTO user_workouts (
    user_id,
    name,
    scheduled_date,
    completed,
    shared_from
  )
  VALUES (
    p_recipient_id,
    v_workout_name,
    CURRENT_DATE,
    false,
    p_workout_id
  )
  RETURNING id INTO v_new_workout_id;

  -- Copy exercises
  INSERT INTO workout_exercises (
    workout_id,
    exercise_id,
    sets,
    reps_per_set,
    order_in_workout
  )
  SELECT 
    v_new_workout_id,
    exercise_id,
    sets,
    reps_per_set,
    order_in_workout
  FROM workout_exercises
  WHERE workout_id = p_workout_id;

  -- Create empty sets for each exercise
  INSERT INTO exercise_sets (
    workout_exercise_id,
    set_number,
    reps,
    weight_lbs,
    completed
  )
  SELECT 
    we.id,
    es.set_number,
    es.reps,
    NULL,
    false
  FROM workout_exercises we
  CROSS JOIN (
    SELECT DISTINCT set_number
    FROM exercise_sets es
    JOIN workout_exercises we2 ON we2.id = es.workout_exercise_id
    WHERE we2.workout_id = p_workout_id
  ) es
  WHERE we.workout_id = v_new_workout_id;

  RETURN v_new_workout_id;
END;
$$;