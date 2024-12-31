/*
  # Add favorite and custom name fields to workouts

  1. Changes
    - Add `is_favorite` boolean column to user_workouts
    - Add `custom_name` text column to user_workouts
    - Set default value for `is_favorite` to false
*/

-- Add new columns to user_workouts
ALTER TABLE user_workouts
ADD COLUMN is_favorite boolean DEFAULT false,
ADD COLUMN custom_name text;

-- Add comment explaining the fields
COMMENT ON COLUMN user_workouts.is_favorite IS 'Whether the user has marked this workout as a favorite';
COMMENT ON COLUMN user_workouts.custom_name IS 'Optional custom name for the workout set by the user';