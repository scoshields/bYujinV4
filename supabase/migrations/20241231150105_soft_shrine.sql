/*
  # Add initial exercises to the database

  1. Changes
    - Insert base exercises into the exercises table
    - Each exercise includes:
      - name
      - target muscle group
      - primary equipment
      - grip
      - mechanics (compound/isolation)
      - video link (optional)
*/

INSERT INTO exercises (
  name,
  target_muscle_group,
  primary_equipment,
  grip,
  mechanics,
  video_link
) VALUES
  -- Example exercise format:
  (
    'Barbell Bench Press',
    'Upper Chest',
    'Barbell',
    'Wide Pronated',
    'compound',
    'https://example.com/bench-press'
  );

-- Add your exercises here following the same format
-- For example:
/*
  (
    'Exercise Name',
    'Target Muscle',
    'Equipment',
    'Grip Style',
    'compound/isolation',
    'video_url'
  ),
*/