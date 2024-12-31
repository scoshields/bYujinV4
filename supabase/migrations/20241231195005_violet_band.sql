/*
  # Improve User Search Function

  1. Changes
    - Add trigram similarity search for better fuzzy matching
    - Improve search ranking with similarity scores
    - Add indexes for better performance
*/

-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add trigram indexes for search columns
CREATE INDEX IF NOT EXISTS profiles_username_trgm_idx ON profiles USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_first_name_trgm_idx ON profiles USING gin (first_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_last_name_trgm_idx ON profiles USING gin (last_name gin_trgm_ops);

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
  SELECT DISTINCT ON (similarity_score, p.username)
    p.id,
    p.username,
    p.first_name,
    p.last_name,
    p.avatar_url,
    f.status
  FROM (
    SELECT 
      *,
      GREATEST(
        similarity(lower(username), lower(search_query)),
        similarity(lower(first_name), lower(search_query)),
        similarity(lower(last_name), lower(search_query))
      ) as similarity_score
    FROM profiles
  ) p
  LEFT JOIN friendships f ON 
    (f.user_id = current_user_id AND f.friend_id = p.id) OR
    (f.friend_id = current_user_id AND f.user_id = p.id)
  WHERE 
    p.id != current_user_id AND
    p.similarity_score > 0.1 AND
    (
      lower(p.username) LIKE lower('%' || search_query || '%') OR
      lower(p.first_name) LIKE lower('%' || search_query || '%') OR
      lower(p.last_name) LIKE lower('%' || search_query || '%') OR
      similarity(lower(p.username), lower(search_query)) > 0.3 OR
      similarity(lower(p.first_name), lower(search_query)) > 0.3 OR
      similarity(lower(p.last_name), lower(search_query)) > 0.3
    )
  ORDER BY 
    p.similarity_score DESC,
    p.username
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;