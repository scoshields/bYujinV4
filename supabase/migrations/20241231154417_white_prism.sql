-- Create a function to get equipment counts
CREATE OR REPLACE FUNCTION get_equipment_counts()
RETURNS TABLE (
  primary_equipment text,
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.primary_equipment,
    COUNT(*) as count
  FROM exercises e
  WHERE e.primary_equipment IS NOT NULL 
    AND e.primary_equipment != ''
  GROUP BY e.primary_equipment
  ORDER BY e.primary_equipment;
END;
$$ LANGUAGE plpgsql;