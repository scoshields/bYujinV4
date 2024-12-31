/*
  # Fix workout sharing functionality

  1. Changes
    - Update share_workout function to use reps_per_set from workout_exercises
*/

-- Drop existing function
DROP FUNCTION IF EXISTS share_workout(uuid, uuid);

-- Recreate share_workout function with fixed set copying
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

  -- Create empty sets for each exercise using reps_per_set from workout_exercises
  INSERT INTO exercise_sets (
    workout_exercise_id,
    set_number,
    weight_lbs,
    completed
  )
  SELECT 
    we.id,
    s.set_number,
    NULL,
    false
  FROM workout_exercises we
  CROSS JOIN (
    SELECT generate_series(1, (
      SELECT MAX(sets)
      FROM workout_exercises
      WHERE workout_id = p_workout_id
    )) as set_number
  ) s
  WHERE we.workout_id = v_new_workout_id;

  RETURN v_new_workout_id;
END;
$$;