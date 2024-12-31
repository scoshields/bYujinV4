/*
  # Add RLS policy for friend workouts

  1. Changes
    - Add RLS policy to allow users to view their friends' workouts
*/

-- Add RLS policy for viewing friend workouts
CREATE POLICY "Users can view their friends' workouts"
ON user_workouts
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
    AND (
      (user_id = auth.uid() AND friend_id = user_workouts.user_id) OR
      (friend_id = auth.uid() AND user_id = user_workouts.user_id)
    )
  )
);