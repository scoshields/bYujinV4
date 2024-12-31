-- Drop and recreate the search_users function to only search usernames
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
    p.username ILIKE '%' || search_query || '%'
  ORDER BY 
    p.username ILIKE (search_query || '%') DESC,
    p.username ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;