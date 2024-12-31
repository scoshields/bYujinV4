/*
  # Update exercises table structure with text fields

  1. Changes
    - Drop existing exercises table
    - Create new exercises table with text fields for flexibility
    - Add RLS policies

  2. New Structure
    - Exercise Name (text)
    - Target Muscle Group (text)
    - Primary Equipment (text)
    - Grip (text)
    - Mechanics (mechanics_type - using existing enum)
    - Video Link (text)
*/

-- Drop existing exercises table
DROP TABLE IF EXISTS exercises CASCADE;

-- Create new exercises table with flexible text fields
CREATE TABLE exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  target_muscle_group text NOT NULL,
  primary_equipment text NOT NULL,
  grip text NOT NULL,
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
  ''Upper Chest'',
  ''Barbell'',
  ''Wide Pronated'',
  ''compound'',
  ''https://example.com/bench-press''
);';