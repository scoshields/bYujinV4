-- Drop existing functions
DROP FUNCTION IF EXISTS get_friend_activity(uuid, integer);
DROP FUNCTION IF EXISTS get_friend_stats(uuid, date, date);

-- Create function to get friend activity
CREATE OR REPLACE FUNCTION get_friend_activity(
  p_user_id uuid,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  username text,
  first_name text,
  last_name text,
  avatar_url text,
  workout_id uuid,
  workout_name text,
  completed_at timestamptz,
  total_exercises integer,
  total_sets integer,
  exercises jsonb
) AS $$
BEGIN
  RETURN QUERY
  WITH exercise_stats AS (
    SELECT 
      ce.workout_id,
      ce.user_id,
      MIN(ce.completed_at) as completed_at,
      COUNT(DISTINCT ce.exercise_id) as total_exercises,
      SUM(ce.sets) as total_sets,
      jsonb_agg(
        jsonb_build_object(
          'name', e.name,
          'target_muscle_group', e.target_muscle_group,
          'sets', ce.sets,
          'reps', ce.reps,
          'weight_lbs', ce.weight_lbs
        )
        ORDER BY ce.completed_at DESC
      ) as exercises
    FROM completed_exercises ce
    JOIN exercises e ON e.id = ce.exercise_id
    GROUP BY ce.workout_id, ce.user_id
  )
  SELECT 
    w.id,
    p.id as user_id,
    p.username,
    p.first_name,
    p.last_name,
    p.avatar_url,
    w.id as workout_id,
    w.name as workout_name,
    es.completed_at,
    es.total_exercises,
    es.total_sets,
    es.exercises
  FROM exercise_stats es
  JOIN profiles p ON p.id = es.user_id
  JOIN user_workouts w ON w.id = es.workout_id
  WHERE EXISTS (
    SELECT 1 FROM friendships f
    WHERE f.status = 'accepted'
    AND (
      (f.user_id = p_user_id AND f.friend_id = es.user_id) OR
      (f.friend_id = p_user_id AND f.user_id = es.user_id)
    )
  )
  ORDER BY es.completed_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create function to get friend stats
CREATE OR REPLACE FUNCTION get_friend_stats(
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
  total_exercises integer,
  total_sets integer,
  total_weight numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.first_name,
    p.last_name,
    p.avatar_url,
    COUNT(DISTINCT ce.workout_id)::integer as total_workouts,
    COUNT(DISTINCT ce.exercise_id)::integer as total_exercises,
    SUM(ce.sets)::integer as total_sets,
    SUM(ce.weight_lbs * ce.sets * ce.reps) as total_weight
  FROM profiles p
  INNER JOIN friendships f ON 
    (f.user_id = p_user_id AND f.friend_id = p.id) OR
    (f.friend_id = p_user_id AND f.user_id = p.id)
  LEFT JOIN completed_exercises ce ON 
    ce.user_id = p.id AND
    ce.completed_at::date BETWEEN p_start_date AND p_end_date
  WHERE f.status = 'accepted'
  GROUP BY p.id, p.username, p.first_name, p.last_name, p.avatar_url
  ORDER BY total_workouts DESC, total_exercises DESC;
END;
$$ LANGUAGE plpgsql;