/*
  # Fix workout generation and add missing features

  1. Add indexes for better query performance
  2. Add function to get exercises by muscle groups
*/

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS exercises_target_muscle_group_idx 
ON exercises (target_muscle_group);

CREATE INDEX IF NOT EXISTS exercises_primary_equipment_idx 
ON exercises (primary_equipment);

-- Create function to get exercises by muscle groups
CREATE OR REPLACE FUNCTION get_exercises_by_muscle_groups(
  p_muscle_groups text[],
  p_equipment text[],
  p_limit integer DEFAULT 2
)
RETURNS TABLE (
  id uuid,
  name text,
  target_muscle_group text,
  primary_equipment text,
  grip text,
  mechanics text
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (e.target_muscle_group) 
    e.id,
    e.name,
    e.target_muscle_group,
    e.primary_equipment,
    e.grip,
    e.mechanics
  FROM exercises e
  WHERE e.target_muscle_group = ANY(p_muscle_groups)
    AND e.primary_equipment = ANY(p_equipment)
  ORDER BY e.target_muscle_group, random()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;