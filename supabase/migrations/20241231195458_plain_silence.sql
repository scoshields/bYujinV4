-- Add RLS policy for profiles to allow searching
CREATE POLICY "Profiles are viewable by authenticated users" 
ON profiles FOR SELECT 
TO authenticated 
USING (true);

-- Update search_users function to use simpler query first
CREATE OR REPLACE FUNCTION search_users(
  search_query text,
  current_user_id uuid
)
RETURNS TABLE (
  id uuid,
  username text,
  first_name text,
  last_name text,
  avatar_url text,
  friendship_status friendship_status
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.id,
    p.username,
    p.first_name,
    p.last_name,
    p.avatar_url,
    f.status
  FROM profiles p
  LEFT JOIN friendships f ON 
    (f.user_id = current_user_id AND f.friend_id = p.id) OR
    (f.friend_id = current_user_id AND f.user_id = p.id)
  WHERE 
    p.id != current_user_id AND
    (
      p.username ILIKE '%' || search_query || '%' OR
      p.first_name ILIKE '%' || search_query || '%' OR
      p.last_name ILIKE '%' || search_query || '%'
    )
  ORDER BY 
    CASE 
      WHEN p.username ILIKE search_query THEN 1
      WHEN p.username ILIKE search_query || '%' THEN 2
      ELSE 3
    END,
    p.username
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;