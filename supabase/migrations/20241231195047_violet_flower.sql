/*
  # Fix Search Function Column References

  1. Changes
    - Fix ambiguous column references in search_users function
    - Improve column aliasing for clarity
    - Maintain existing search functionality
*/

-- Drop and recreate the search_users function with fixed column references
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
  WITH ranked_profiles AS (
    SELECT 
      p.*,
      GREATEST(
        similarity(lower(p.username), lower(search_query)),
        similarity(lower(p.first_name), lower(search_query)),
        similarity(lower(p.last_name), lower(search_query))
      ) as similarity_score
    FROM profiles p
    WHERE p.id != current_user_id
  )
  SELECT DISTINCT ON (rp.similarity_score, rp.username)
    rp.id,
    rp.username,
    rp.first_name,
    rp.last_name,
    rp.avatar_url,
    f.status
  FROM ranked_profiles rp
  LEFT JOIN friendships f ON 
    (f.user_id = current_user_id AND f.friend_id = rp.id) OR
    (f.friend_id = current_user_id AND f.user_id = rp.id)
  WHERE 
    rp.similarity_score > 0.1 AND
    (
      lower(rp.username) LIKE lower('%' || search_query || '%') OR
      lower(rp.first_name) LIKE lower('%' || search_query || '%') OR
      lower(rp.last_name) LIKE lower('%' || search_query || '%') OR
      similarity(lower(rp.username), lower(search_query)) > 0.3 OR
      similarity(lower(rp.first_name), lower(search_query)) > 0.3 OR
      similarity(lower(rp.last_name), lower(search_query)) > 0.3
    )
  ORDER BY 
    rp.similarity_score DESC,
    rp.username
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;