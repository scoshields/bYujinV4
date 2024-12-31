/*
  # Convert mechanics to text field with check constraint

  1. Changes
    - Drop existing exercises table
    - Convert mechanics from enum to text field with check constraint
    - Maintain existing functionality but with better empty string handling
*/

-- Drop existing exercises table and enum
DROP TABLE IF EXISTS exercises CASCADE;
DROP TYPE IF EXISTS mechanics_type CASCADE;

-- Recreate exercises table with text mechanics field
CREATE TABLE exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  target_muscle_group text NOT NULL,
  primary_equipment text NOT NULL,
  grip text CHECK (
    grip IS NULL OR grip IN (
      'Neutral',
      'No Grip',
      'Flat Palm',
      'Head Supported',
      'Pronated',
      'Forearm',
      'Crush Grip',
      'Supinated',
      'Bottoms Up',
      'Hand Assisted',
      'Goblet',
      'Horn Grip',
      'Bottoms Up Horn Grip',
      'False Grip',
      'Other',
      'Waiter Hold',
      'Mixed Grip',
      'Fingertip'
    )
  ),
  mechanics text CHECK (
    mechanics IS NULL OR mechanics IN (
      'Compound',
      'Isolation',
      'Pull'
    )
  ),
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

-- Create trigger function to handle empty strings
CREATE OR REPLACE FUNCTION handle_empty_strings()
RETURNS trigger AS $$
BEGIN
  -- Convert empty strings to NULL for grip
  IF NEW.grip = '' THEN
    NEW.grip := NULL;
  END IF;
  
  -- Convert empty strings to NULL for mechanics
  IF NEW.mechanics = '' THEN
    NEW.mechanics := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER convert_empty_strings_to_null
  BEFORE INSERT OR UPDATE ON exercises
  FOR EACH ROW
  EXECUTE FUNCTION handle_empty_strings();

-- Add comment explaining the behavior
COMMENT ON TABLE exercises IS 'Empty strings in grip and mechanics fields will be automatically converted to NULL values.
Example insert:
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
  '''',  -- This will be converted to NULL
  '''',  -- This will be converted to NULL
  ''https://example.com/bench-press''
);';