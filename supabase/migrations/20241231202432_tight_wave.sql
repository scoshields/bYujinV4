/*
  # Fix Ambiguous Column References
  
  1. Changes
    - Add explicit table references to all completed columns
    - Simplify exercise completion checks
    - Remove unnecessary subqueries
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS get_friend_workouts(uuid, integer);
DROP FUNCTION IF EXISTS get_friend_workout_stats(uuid, timestamptz, timestamptz);

-- Recreate get_friend_workouts with explicit column references
CREATE FUNCTION get_friend_workouts(
  p_user_id uuid,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  name text,
  scheduled_date timestamptz,
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
  WITH exercise_completion AS (
    SELECT 
      we.id as exercise_id,
      we.workout_id,
      e.name,
      e.target_muscle_group,
      bool_and(es.completed) as is_completed
    FROM workout_exercises we
    JOIN exercises e ON e.id = we.exercise_id
    LEFT JOIN exercise_sets es ON es.workout_exercise_id = we.id
    GROUP BY we.id, we.workout_id, e.name, e.target_muscle_group
  ),
  workout_stats AS (
    SELECT 
      w.id as workout_id,
      COUNT(DISTINCT ec.exercise_id)::integer as exercise_count,
      COUNT(DISTINCT CASE WHEN ec.is_completed THEN ec.exercise_id END)::integer as completed_exercise_count,
      jsonb_agg(
        jsonb_build_object(
          'name', ec.name,
          'target_muscle_group', ec.target_muscle_group,
          'completed', ec.is_completed
        )
        ORDER BY ec.exercise_id
      ) FILTER (WHERE ec.name IS NOT NULL) as recent_exercises
    FROM user_workouts w
    LEFT JOIN exercise_completion ec ON ec.workout_id = w.id
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

-- Recreate get_friend_workout_stats with explicit column references
CREATE FUNCTION get_friend_workout_stats(
  p_user_id uuid,
  p_start_date timestamptz,
  p_end_date timestamptz
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
      we.workout_id,
      bool_and(es.completed) as is_completed
    FROM workout_exercises we
    LEFT JOIN exercise_sets es ON es.workout_exercise_id = we.id
    GROUP BY we.id, we.workout_id
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