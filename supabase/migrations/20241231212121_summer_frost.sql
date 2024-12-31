-- Drop foreign key constraints first
ALTER TABLE user_workouts
DROP CONSTRAINT IF EXISTS user_workouts_template_id_fkey;

-- Drop the workout_templates table
DROP TABLE IF EXISTS workout_templates;

-- Remove template_id column from user_workouts
ALTER TABLE user_workouts
DROP COLUMN IF EXISTS template_id;

-- Add comment explaining the changes
COMMENT ON TABLE user_workouts IS 'Stores user workouts. Template functionality has been removed as it was unused.';