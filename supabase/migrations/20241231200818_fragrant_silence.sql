/*
  # Fix Type Mismatches in Database Functions

  1. Changes
    - Fix timestamp type mismatch in get_friend_workouts
    - Fix integer type mismatch in get_friend_workout_stats
    - Ensure consistent types between database and TypeScript

  2. Security
    - Maintain existing RLS policies
*/

-- Drop and recreate get_friend_workouts with correct types
CREATE OR REPLACE FUNCTION get_friend_workouts(
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
  avatar_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.name,
    w.scheduled_date::timestamptz,
    w.completed,
    p.id as user_id,
    p.username,
    p.first_name,
    p.last_name,
    p.avatar_url
  FROM user_workouts w
  INNER JOIN profiles p ON w.user_id = p.id
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

-- Drop and recreate get_friend_workout_stats with correct types
CREATE OR REPLACE FUNCTION get_friend_workout_stats(
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
  WITH friend_stats AS (
    SELECT 
      p.id,
      p.username,
      p.first_name,
      p.last_name,
      p.avatar_url,
      COUNT(DISTINCT w.id)::integer as total_workouts,
      COUNT(DISTINCT CASE WHEN w.completed THEN w.id END)::integer as completed_workouts,
      COUNT(DISTINCT we.id)::integer as total_exercises,
      COUNT(DISTINCT CASE WHEN es.completed THEN we.id END)::integer as completed_exercises
    FROM profiles p
    INNER JOIN friendships f ON 
      (f.user_id = p_user_id AND f.friend_id = p.id) OR
      (f.friend_id = p_user_id AND f.user_id = p.id)
    LEFT JOIN user_workouts w ON 
      w.user_id = p.id AND
      w.scheduled_date BETWEEN p_start_date AND p_end_date
    LEFT JOIN workout_exercises we ON we.workout_id = w.id
    LEFT JOIN exercise_sets es ON es.workout_exercise_id = we.id
    WHERE f.status = 'accepted'
    GROUP BY p.id, p.username, p.first_name, p.last_name, p.avatar_url
  )
  SELECT * FROM friend_stats
  ORDER BY completed_workouts DESC, total_workouts DESC;
END;
$$ LANGUAGE plpgsql;