/*
  # Enhance Friend Activity Display

  1. Changes
    - Add function to get friend workout stats
    - Include exercise counts and completion rates

  2. Security
    - Maintain existing RLS policies
    - Only show stats for accepted friends
*/

-- Create function to get friend workout stats
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
      COUNT(DISTINCT w.id) as total_workouts,
      COUNT(DISTINCT CASE WHEN w.completed THEN w.id END) as completed_workouts,
      COUNT(DISTINCT we.id) as total_exercises,
      COUNT(DISTINCT CASE WHEN es.completed THEN we.id END) as completed_exercises
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