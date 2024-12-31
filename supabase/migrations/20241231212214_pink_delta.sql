-- Drop RLS policies first
DROP POLICY IF EXISTS "Users can manage their own exercise logs" ON exercise_logs;

-- Drop foreign key constraints
ALTER TABLE exercise_logs
DROP CONSTRAINT IF EXISTS exercise_logs_workout_exercise_id_fkey,
DROP CONSTRAINT IF EXISTS exercise_logs_user_id_fkey;

-- Drop the exercise_logs table
DROP TABLE IF EXISTS exercise_logs;

-- Add comment explaining the change
COMMENT ON TABLE workout_exercises IS 'Stores exercises for each workout. Exercise logs have been removed in favor of exercise_sets.';