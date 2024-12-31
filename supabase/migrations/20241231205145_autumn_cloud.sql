-- Drop existing functions
DROP FUNCTION IF EXISTS get_friend_workouts(uuid, integer);
DROP FUNCTION IF EXISTS get_friend_workout_stats(uuid, date, date);

-- Recreate get_friend_workouts to only show completed workouts
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
  total_sets integer,
  completed_sets integer,
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
      COUNT(es.id) as total_sets,
      COUNT(CASE WHEN es.weight_lbs IS NOT NULL THEN 1 END) as completed_sets
    FROM workout_exercises we
    JOIN exercises e ON e.id = we.exercise_id
    LEFT JOIN exercise_sets es ON es.workout_exercise_id = we.id
    GROUP BY we.workout_id, we.id, e.name, e.target_muscle_group
    HAVING COUNT(CASE WHEN es.weight_lbs IS NOT NULL THEN 1 END) > 0
  ),
  workout_stats AS (
    SELECT 
      w.id as workout_id,
      SUM(es.total_sets)::integer as total_sets,
      SUM(es.completed_sets)::integer as completed_sets,
      jsonb_agg(
        jsonb_build_object(
          'name', es.name,
          'target_muscle_group', es.target_muscle_group,
          'total_sets', es.total_sets,
          'completed_sets', es.completed_sets
        )
        ORDER BY es.exercise_id
      ) FILTER (WHERE es.name IS NOT NULL) as recent_exercises
    FROM user_workouts w
    INNER JOIN exercise_stats es ON es.workout_id = w.id
    GROUP BY w.id
  )
  SELECT 
    w.id,
    w.name,
    w.scheduled_date,
    true as completed,
    p.id as user_id,
    p.username,
    p.first_name,
    p.last_name,
    p.avatar_url,
    COALESCE(ws.total_sets, 0),
    COALESCE(ws.completed_sets, 0),
    COALESCE(ws.recent_exercises, '[]'::jsonb)
  FROM user_workouts w
  INNER JOIN profiles p ON w.user_id = p.id
  INNER JOIN workout_stats ws ON ws.workout_id = w.id
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

-- Recreate get_friend_workout_stats to only count completed workouts
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
  total_sets integer,
  completed_sets integer
) AS $$
BEGIN
  RETURN QUERY
  WITH workout_stats AS (
    SELECT 
      w.id as workout_id,
      w.user_id,
      COUNT(es.id) as total_sets,
      COUNT(CASE WHEN es.weight_lbs IS NOT NULL THEN 1 END) as completed_sets
    FROM user_workouts w
    LEFT JOIN workout_exercises we ON we.workout_id = w.id
    LEFT JOIN exercise_sets es ON es.workout_exercise_id = we.id
    WHERE w.scheduled_date BETWEEN p_start_date AND p_end_date
    GROUP BY w.id, w.user_id
    HAVING COUNT(CASE WHEN es.weight_lbs IS NOT NULL THEN 1 END) > 0
  )
  SELECT 
    p.id,
    p.username,
    p.first_name,
    p.last_name,
    p.avatar_url,
    COUNT(DISTINCT ws.workout_id)::integer as total_workouts,
    COUNT(DISTINCT ws.workout_id)::integer as completed_workouts,
    SUM(ws.total_sets)::integer as total_sets,
    SUM(ws.completed_sets)::integer as completed_sets
  FROM profiles p
  INNER JOIN friendships f ON 
    (f.user_id = p_user_id AND f.friend_id = p.id) OR
    (f.friend_id = p_user_id AND f.user_id = p.id)
  LEFT JOIN workout_stats ws ON ws.user_id = p.id
  WHERE f.status = 'accepted'
  GROUP BY p.id, p.username, p.first_name, p.last_name, p.avatar_url
  ORDER BY completed_workouts DESC, total_workouts DESC;
END;
$$ LANGUAGE plpgsql;