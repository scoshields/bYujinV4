-- Add workout preferences to profiles
ALTER TABLE profiles
ADD COLUMN default_level text CHECK (
  default_level IN ('beginner', 'intermediate', 'advanced')
),
ADD COLUMN default_equipment text[];

-- Add comment explaining the fields
COMMENT ON COLUMN profiles.default_level IS 'User''s default workout level preference';
COMMENT ON COLUMN profiles.default_equipment IS 'User''s default available equipment';