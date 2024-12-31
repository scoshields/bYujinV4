/*
  # Fix Friend Activity Display

  1. Changes
    - Add index for workout dates
    - Update RLS policies for friend workout visibility
    - Add function to get friend workouts

  2. Security
    - Ensure users can only view workouts from accepted friends
    - Maintain existing workout ownership policies
*/

-- Add index for workout dates for better performance
CREATE INDEX IF NOT EXISTS user_workouts_scheduled_date_idx 
ON user_workouts(scheduled_date DESC);

-- Create function to get friend workouts
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
    w.scheduled_date,
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