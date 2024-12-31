-- Create function to get shared workouts
CREATE OR REPLACE FUNCTION get_shared_workouts(
  p_user_id uuid,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  name text,
  scheduled_date date,
  completed boolean,
  shared_from uuid,
  sharer_username text,
  sharer_first_name text,
  sharer_last_name text,
  sharer_avatar_url text,
  exercise_count integer,
  completed_exercise_count integer,
  shared_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  WITH exercise_stats AS (
    SELECT 
      we.workout_id,
      COUNT(DISTINCT we.id)::integer as exercise_count,
      COUNT(DISTINCT CASE WHEN es.weight_lbs IS NOT NULL THEN we.id END)::integer as completed_exercise_count
    FROM workout_exercises we
    LEFT JOIN exercise_sets es ON es.workout_exercise_id = we.id
    GROUP BY we.workout_id
  )
  SELECT 
    w.id,
    w.name,
    w.scheduled_date,
    w.completed,
    w.shared_from,
    p.username as sharer_username,
    p.first_name as sharer_first_name,
    p.last_name as sharer_last_name,
    p.avatar_url as sharer_avatar_url,
    COALESCE(es.exercise_count, 0),
    COALESCE(es.completed_exercise_count, 0),
    w.created_at as shared_at
  FROM user_workouts w
  JOIN user_workouts sw ON sw.id = w.shared_from
  JOIN profiles p ON p.id = sw.user_id
  LEFT JOIN exercise_stats es ON es.workout_id = w.id
  WHERE w.shared_from IS NOT NULL
  AND w.user_id = p_user_id
  ORDER BY w.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;