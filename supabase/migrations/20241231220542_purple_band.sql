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