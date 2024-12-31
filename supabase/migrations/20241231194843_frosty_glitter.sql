/*
  # Fix User Search Function

  1. Changes
    - Update search_users function to handle case-insensitive searches
    - Add better pattern matching for partial matches
    - Improve search result ordering
*/

-- Drop and recreate the search_users function with improved search
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
  SELECT DISTINCT ON (p.username)
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
      lower(p.username) LIKE lower('%' || search_query || '%') OR
      lower(p.first_name) LIKE lower('%' || search_query || '%') OR
      lower(p.last_name) LIKE lower('%' || search_query || '%')
    )
  ORDER BY 
    p.username,
    CASE 
      WHEN lower(p.username) = lower(search_query) THEN 1
      WHEN lower(p.username) LIKE lower(search_query || '%') THEN 2
      WHEN lower(p.username) LIKE lower('%' || search_query || '%') THEN 3
      WHEN lower(p.first_name) LIKE lower(search_query || '%') THEN 4
      WHEN lower(p.last_name) LIKE lower(search_query || '%') THEN 5
      ELSE 6
    END
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;