/*
  # Update Friend Activity Functions
  
  1. Changes
    - Add exercise details to friend workouts
    - Fix exercise completion counting
    - Add recent exercise details
    
  2. Security
    - Maintains existing RLS policies
*/

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_friend_workouts(uuid, integer);
DROP FUNCTION IF EXISTS get_friend_workout_stats(uuid, timestamptz, timestamptz);

-- Recreate get_friend_workouts with exercise details
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
  WITH workout_exercise_stats AS (
    SELECT 
      w.id as workout_id,
      COUNT(DISTINCT we.id)::integer as exercise_count,
      COUNT(DISTINCT CASE WHEN we.id IN (
        SELECT workout_exercise_id 
        FROM exercise_sets 
        WHERE completed = true
        GROUP BY workout_exercise_id
        HAVING COUNT(*) = COUNT(CASE WHEN completed THEN 1 END)
      ) THEN we.id END)::integer as completed_exercise_count,
      jsonb_agg(
        jsonb_build_object(
          'name', e.name,
          'target_muscle_group', e.target_muscle_group,
          'completed', (
            SELECT COUNT(*) = COUNT(CASE WHEN completed THEN 1 END)
            FROM exercise_sets
            WHERE workout_exercise_id = we.id
          )
        )
        ORDER BY we.order_in_workout
      ) FILTER (WHERE e.name IS NOT NULL) as recent_exercises
    FROM user_workouts w
    LEFT JOIN workout_exercises we ON we.workout_id = w.id
    LEFT JOIN exercises e ON e.id = we.exercise_id
    GROUP BY w.id
  )
  SELECT 
    w.id,
    w.name,
    w.scheduled_date::timestamptz,
    w.completed,
    p.id as user_id,
    p.username,
    p.first_name,
    p.last_name,
    p.avatar_url,
    COALESCE(wes.exercise_count, 0),
    COALESCE(wes.completed_exercise_count, 0),
    COALESCE(wes.recent_exercises, '[]'::jsonb)
  FROM user_workouts w
  INNER JOIN profiles p ON w.user_id = p.id
  LEFT JOIN workout_exercise_stats wes ON wes.workout_id = w.id
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

-- Recreate get_friend_workout_stats with improved exercise tracking
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
      we.workout_id,
      we.id as exercise_id,
      CASE WHEN COUNT(*) = COUNT(CASE WHEN es.completed THEN 1 END)
        THEN 1
        ELSE 0
      END as is_completed
    FROM workout_exercises we
    LEFT JOIN exercise_sets es ON es.workout_exercise_id = we.id
    GROUP BY we.workout_id, we.id
  ),
  friend_stats AS (
    SELECT 
      p.id,
      p.username,
      p.first_name,
      p.last_name,
      p.avatar_url,
      COUNT(DISTINCT w.id)::integer as total_workouts,
      COUNT(DISTINCT CASE WHEN w.completed THEN w.id END)::integer as completed_workouts,
      COUNT(DISTINCT we.id)::integer as total_exercises,
      SUM(ec.is_completed)::integer as completed_exercises
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
  )
  SELECT * FROM friend_stats
  ORDER BY completed_workouts DESC, total_workouts DESC;
END;
$$ LANGUAGE plpgsql;