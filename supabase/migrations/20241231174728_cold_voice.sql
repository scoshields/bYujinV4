/*
  # Add exercise replacement functionality
  
  1. New Functions
    - get_replacement_exercise: Gets a random exercise matching target muscle group and equipment
*/

-- Function to get a replacement exercise
CREATE OR REPLACE FUNCTION get_replacement_exercise(
  p_target_muscle_group text,
  p_equipment text[]
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
  SELECT 
    e.id,
    e.name,
    e.target_muscle_group,
    e.primary_equipment,
    e.grip,
    e.mechanics
  FROM exercises e
  WHERE e.target_muscle_group = p_target_muscle_group
    AND e.primary_equipment = ANY(p_equipment)
  ORDER BY random()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;