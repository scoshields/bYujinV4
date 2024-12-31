/*
  # Fix Friend Activity and Exercise Counting
  
  1. Changes
    - Improve timezone handling using timestamptz consistently
    - Fix exercise completion logic to properly count all sets
    - Add proper week filtering for activities
    - Fix exercise counting in friend stats
    
  2. Security
    - Maintains existing RLS policies
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS get_friend_workouts(uuid, integer);
DROP FUNCTION IF EXISTS get_friend_workout_stats(uuid, timestamptz, timestamptz);

-- Recreate get_friend_workouts with improved timezone and exercise handling
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
DECLARE
  week_start timestamptz;
  week_end timestamptz;
BEGIN
  -- Calculate week boundaries in UTC
  week_start := date_trunc('week', current_timestamp at time zone 'UTC');
  week_end := week_start + interval '1 week' - interval '1 second';

  RETURN QUERY
  WITH exercise_stats AS (
    SELECT 
      we.workout_id,
      we.id as exercise_id,
      e.name,
      e.target_muscle_group,
      (
        SELECT bool_and(completed)
        FROM exercise_sets es
        WHERE es.workout_exercise_id = we.id
      ) as is_completed,
      (
        SELECT COUNT(*)
        FROM exercise_sets es
        WHERE es.workout_exercise_id = we.id
        AND es.completed = true
      ) as completed_sets_count,
      (
        SELECT COUNT(*)
        FROM exercise_sets es
        WHERE es.workout_exercise_id = we.id
      ) as total_sets_count
    FROM workout_exercises we
    JOIN exercises e ON e.id = we.exercise_id
    WHERE EXISTS (
      SELECT 1 FROM user_workouts uw
      WHERE uw.id = we.workout_id
      AND uw.scheduled_date >= week_start
      AND uw.scheduled_date <= week_end
    )
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
          'completed', es.is_completed,
          'completed_sets', es.completed_sets_count,
          'total_sets', es.total_sets_count
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

-- Recreate get_friend_workout_stats with improved exercise counting
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
  WITH exercise_stats AS (
    SELECT 
      we.id as exercise_id,
      w.user_id,
      (
        SELECT bool_and(completed)
        FROM exercise_sets es
        WHERE es.workout_exercise_id = we.id
      ) as is_completed,
      (
        SELECT COUNT(*)
        FROM exercise_sets es
        WHERE es.workout_exercise_id = we.id
        AND es.completed = true
      ) as completed_sets_count,
      (
        SELECT COUNT(*)
        FROM exercise_sets es
        WHERE es.workout_exercise_id = we.id
      ) as total_sets_count
    FROM workout_exercises we
    JOIN user_workouts w ON w.id = we.workout_id
    WHERE w.scheduled_date >= p_start_date
    AND w.scheduled_date <= p_end_date
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
    COUNT(DISTINCT CASE WHEN es.is_completed THEN we.id END)::integer as completed_exercises
  FROM profiles p
  INNER JOIN friendships f ON 
    (f.user_id = p_user_id AND f.friend_id = p.id) OR
    (f.friend_id = p_user_id AND f.user_id = p.id)
  LEFT JOIN user_workouts w ON 
    w.user_id = p.id AND
    w.scheduled_date >= p_start_date AND
    w.scheduled_date <= p_end_date
  LEFT JOIN workout_exercises we ON we.workout_id = w.id
  LEFT JOIN exercise_stats es ON es.exercise_id = we.id
  WHERE f.status = 'accepted'
  GROUP BY p.id, p.username, p.first_name, p.last_name, p.avatar_url
  ORDER BY completed_workouts DESC, total_workouts DESC;
END;
$$ LANGUAGE plpgsql;