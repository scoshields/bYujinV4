-- Drop existing RLS policies for completed_exercises
DROP POLICY IF EXISTS "Users can view their own completed exercises" ON completed_exercises;
DROP POLICY IF EXISTS "Users can insert their own completed exercises" ON completed_exercises;

-- Create new RLS policies that allow friends to view completed exercises
CREATE POLICY "Users can view their own and friends' completed exercises"
  ON completed_exercises
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM friendships
      WHERE status = 'accepted'
      AND (
        (user_id = auth.uid() AND friend_id = completed_exercises.user_id) OR
        (friend_id = auth.uid() AND user_id = completed_exercises.user_id)
      )
    )
  );

CREATE POLICY "Users can insert their own completed exercises"
  ON completed_exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add comment explaining the policies
COMMENT ON TABLE completed_exercises IS 'Stores completed exercises with RLS policies allowing viewing by friends';