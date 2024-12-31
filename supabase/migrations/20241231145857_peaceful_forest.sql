/*
  # Update exercises table structure

  1. Changes
    - Drop existing exercises table
    - Create new exercises table with simplified structure
    - Add RLS policies

  2. New Structure
    - Exercise Name (text)
    - Target Muscle Group (enum)
    - Primary Equipment (text)
    - Grip (enum)
    - Mechanics (enum)
    - Video Link (text)
*/

-- Create new enum for grip types
CREATE TYPE grip_type AS ENUM (
  'neutral',
  'pronated',
  'supinated',
  'mixed',
  'none'
);

-- Create new enum for mechanics
CREATE TYPE mechanics_type AS ENUM (
  'compound',
  'isolation'
);

-- Drop existing exercises table
DROP TABLE IF EXISTS exercises CASCADE;

-- Create new exercises table
CREATE TABLE exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  target_muscle_group muscle_group NOT NULL,
  primary_equipment text NOT NULL,
  grip grip_type NOT NULL,
  mechanics mechanics_type NOT NULL,
  video_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Exercises are readable by all"
  ON exercises FOR SELECT
  TO authenticated
  USING (true);

-- Here's a template for inserting exercises:
COMMENT ON TABLE exercises IS 'Example insert:
INSERT INTO exercises (
  name,
  target_muscle_group,
  primary_equipment,
  grip,
  mechanics,
  video_link
) VALUES (
  ''Barbell Bench Press'',
  ''chest'',
  ''barbell'',
  ''pronated'',
  ''compound'',
  ''https://example.com/bench-press''
);';