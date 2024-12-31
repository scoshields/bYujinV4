/*
  # Fix Friend Activity and RLS

  1. Changes
    - Add foreign key from user_workouts to profiles
    - Update RLS policies for friend activity viewing
    - Add indexes for better performance

  2. Security
    - Ensure users can only view workouts from accepted friends
    - Maintain existing workout ownership policies
*/

-- Add foreign key from user_workouts to profiles
ALTER TABLE user_workouts
DROP CONSTRAINT IF EXISTS user_workouts_user_id_fkey;

ALTER TABLE user_workouts
ADD CONSTRAINT user_workouts_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Add index for better join performance
CREATE INDEX IF NOT EXISTS user_workouts_user_id_idx ON user_workouts(user_id);

-- Update RLS policy for viewing friend workouts
DROP POLICY IF EXISTS "Users can view their friends' workouts" ON user_workouts;

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