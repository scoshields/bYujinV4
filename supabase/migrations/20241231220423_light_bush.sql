-- Drop existing view and function
DROP VIEW IF EXISTS shared_workouts;
DROP FUNCTION IF EXISTS get_shared_workouts(uuid, integer);

-- Create view for shared workouts with proper exercise counting
CREATE VIEW shared_workouts AS
SELECT 
  w.id,
  w.name,
  w.scheduled_date,
  w.completed,
  w.user_id as recipient_id,
  w.shared_from,
  sw.user_id as sharer_id,
  p.username as sharer_username,
  p.first_name as sharer_first_name,
  p.last_name as sharer_last_name,
  p.avatar_url as sharer_avatar_url,
  COUNT(DISTINCT we.id)::integer as exercise_count,
  COUNT(DISTINCT CASE WHEN es.weight_lbs IS NOT NULL THEN we.id END)::integer as completed_exercise_count
FROM user_workouts w
JOIN user_workouts sw ON sw.id = w.shared_from
JOIN profiles p ON p.id = sw.user_id
LEFT JOIN workout_exercises we ON we.workout_id = w.id
LEFT JOIN exercise_sets es ON es.workout_exercise_id = we.id
WHERE w.shared_from IS NOT NULL
GROUP BY 
  w.id, 
  w.name, 
  w.scheduled_date, 
  w.completed,
  w.user_id,
  w.shared_from,
  sw.user_id,
  p.username,
  p.first_name,
  p.last_name,
  p.avatar_url;

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
  SELECT 
    sw.id,
    sw.name,
    sw.scheduled_date,
    sw.completed,
    sw.shared_from,
    sw.sharer_username,
    sw.sharer_first_name,
    sw.sharer_last_name,
    sw.sharer_avatar_url,
    sw.exercise_count,
    sw.completed_exercise_count,
    w.created_at as shared_at
  FROM shared_workouts sw
  JOIN user_workouts w ON w.id = sw.id
  WHERE sw.recipient_id = p_user_id
  ORDER BY w.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;