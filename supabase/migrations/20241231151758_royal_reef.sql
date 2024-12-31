/*
  # Update empty strings handler for mechanics field

  1. Changes
    - Update trigger function to handle empty strings for mechanics field
    - Maintain existing grip field handling
*/

-- Update trigger function to handle empty strings for both fields
CREATE OR REPLACE FUNCTION handle_empty_strings()
RETURNS trigger AS $$
BEGIN
  -- Convert empty strings to NULL for grip
  IF NEW.grip = '' THEN
    NEW.grip := NULL;
  END IF;
  
  -- Convert empty strings to NULL for mechanics
  IF NEW.mechanics::text = '' THEN
    NEW.mechanics := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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