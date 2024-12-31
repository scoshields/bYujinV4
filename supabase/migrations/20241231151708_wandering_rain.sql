/*
  # Handle empty strings in exercises table

  1. Changes
    - Add trigger to convert empty strings to NULL for grip and mechanics fields
    - Maintain existing validation rules
*/

-- Create trigger function to handle empty strings
CREATE OR REPLACE FUNCTION handle_empty_strings()
RETURNS trigger AS $$
BEGIN
  -- Convert empty strings to NULL
  IF NEW.grip = '' THEN
    NEW.grip := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS convert_empty_strings_to_null ON exercises;
CREATE TRIGGER convert_empty_strings_to_null
  BEFORE INSERT OR UPDATE ON exercises
  FOR EACH ROW
  EXECUTE FUNCTION handle_empty_strings();

-- Add comment explaining the behavior
COMMENT ON TABLE exercises IS 'Empty strings in grip field will be automatically converted to NULL values.
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
  ''Compound'',
  ''https://example.com/bench-press''
);';