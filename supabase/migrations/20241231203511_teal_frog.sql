/*
  # Fix Exercise Counting Logic
  
  1. Changes
    - Update exercise completion logic to match Dashboard
    - Simplify exercise counting queries
    - Add proper indexes for performance
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS get_friend_workouts(uuid, integer);
DROP FUNCTION IF EXISTS get_friend_workout_stats(uuid, date, date);

-- Add index for exercise sets completion check
CREATE INDEX IF NOT EXISTS idx_exercise_sets_completion 
ON exercise_sets(workout_exercise_id, completed);

-- Recreate get_friend_workouts with fixed counting
CREATE OR REPLACE FUNCTION get_friend_workouts(
  p_user_id uuid,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  name text,
  scheduled_date date,
  completed boolean,
  user_id uuid,
  username text,
  first_name text,
  last_name text,
  avatar_url text,
  exercise_count integer,
  completed_exercise_count integer,
  recent_exercises jsonb
) AS $$
BEGIN
  RETURN QUERY
  WITH exercise_stats AS (
    SELECT 
      we.workout_id,
      we.id as exercise_id,
      e.name,
      e.target_muscle_group,
      EXISTS (
        SELECT 1
        FROM exercise_sets es
        WHERE es.workout_exercise_id = we.id
        GROUP BY es.workout_exercise_id
        HAVING COUNT(*) > 0 AND COUNT(*) = COUNT(CASE WHEN es.completed THEN 1 END)
      ) as is_completed
    FROM workout_exercises we
    JOIN exercises e ON e.id = we.exercise_id
  ),
  workout_stats AS (
    SELECT 
      w.id as workout_id,
      COUNT(DISTINCT es.exercise_id)::integer as exercise_count,
      COUNT(DISTINCT CASE WHEN es.is_completed THEN es.exercise_id END)::integer as completed_exercise_count,
      jsonb_agg(
        jsonb_build_object(
          'name', es.name,
          'target_muscle_group', es.target_muscle_group,
          'completed', es.is_completed
        )
        ORDER BY es.exercise_id
      ) FILTER (WHERE es.name IS NOT NULL) as recent_exercises
    FROM user_workouts w
    LEFT JOIN exercise_stats es ON es.workout_id = w.id
    GROUP BY w.id
  )
  SELECT 
    w.id,
    w.name,
    w.scheduled_date,
    w.completed,
    p.id as user_id,
    p.username,
    p.first_name,
    p.last_name,
    p.avatar_url,
    COALESCE(ws.exercise_count, 0),
    COALESCE(ws.completed_exercise_count, 0),
    COALESCE(ws.recent_exercises, '[]'::jsonb)
  FROM user_workouts w
  INNER JOIN profiles p ON w.user_id = p.id
  LEFT JOIN workout_stats ws ON ws.workout_id = w.id
  WHERE EXISTS (
    SELECT 1 FROM friendships f
    WHERE f.status = 'accepted'
    AND (
      (f.user_id = p_user_id AND f.friend_id = w.user_id) OR
      (f.friend_id = p_user_id AND f.user_id = w.user_id)
    )
  )
  ORDER BY w.scheduled_date DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Recreate get_friend_workout_stats with fixed counting
CREATE OR REPLACE FUNCTION get_friend_workout_stats(
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
  completed_workouts integer,
  total_exercises integer,
  completed_exercises integer
) AS $$
BEGIN
  RETURN QUERY
  WITH exercise_completion AS (
    SELECT 
      we.id as exercise_id,
      EXISTS (
        SELECT 1
        FROM exercise_sets es
        WHERE es.workout_exercise_id = we.id
        GROUP BY es.workout_exercise_id
        HAVING COUNT(*) > 0 AND COUNT(*) = COUNT(CASE WHEN es.completed THEN 1 END)
      ) as is_completed
    FROM workout_exercises we
  )
  SELECT 
    p.id,
    p.username,
    p.first_name,
    p.last_name,
    p.avatar_url,
    COUNT(DISTINCT w.id)::integer as total_workouts,
    COUNT(DISTINCT CASE WHEN w.completed THEN w.id END)::integer as completed_workouts,
    COUNT(DISTINCT we.id)::integer as total_exercises,
    COUNT(DISTINCT CASE WHEN ec.is_completed THEN we.id END)::integer as completed_exercises
  FROM profiles p
  INNER JOIN friendships f ON 
    (f.user_id = p_user_id AND f.friend_id = p.id) OR
    (f.friend_id = p_user_id AND f.user_id = p.id)
  LEFT JOIN user_workouts w ON 
    w.user_id = p.id AND
    w.scheduled_date BETWEEN p_start_date AND p_end_date
  LEFT JOIN workout_exercises we ON we.workout_id = w.id
  LEFT JOIN exercise_completion ec ON ec.exercise_id = we.id
  WHERE f.status = 'accepted'
  GROUP BY p.id, p.username, p.first_name, p.last_name, p.avatar_url
  ORDER BY completed_workouts DESC, total_workouts DESC;
END;
$$ LANGUAGE plpgsql;