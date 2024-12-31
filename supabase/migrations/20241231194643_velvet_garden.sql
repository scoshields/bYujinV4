/*
  # Add Friends System

  1. New Tables
    - `friendships`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `friend_id` (uuid, references profiles)
      - `status` (pending/accepted)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `friendships` table
    - Add policies for friend management
*/

-- Create friendship status enum
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted');

-- Create friendships table
CREATE TABLE friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status friendship_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own friendships"
  ON friendships
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    auth.uid() = friend_id
  );

CREATE POLICY "Users can create friend requests"
  ON friendships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    user_id != friend_id
  );

CREATE POLICY "Users can update their own friendships"
  ON friendships
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (user_id, friend_id)
  );

CREATE POLICY "Users can delete their own friendships"
  ON friendships
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (user_id, friend_id)
  );

-- Create function to search users
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
  SELECT 
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
      WHEN p.username ILIKE search_query || '%' THEN 0
      WHEN p.username ILIKE '%' || search_query || '%' THEN 1
      ELSE 2
    END,
    p.username
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;