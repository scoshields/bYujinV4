/*
  # Update profile measurements to use imperial units

  1. Changes
    - Rename height_cm to height_inches
    - Rename weight_kg to weight_lbs
    - Update check constraints for new units
  
  2. Data Migration
    - No data migration needed as this is a new table
*/

-- Drop existing check constraints
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_height_cm_check,
DROP CONSTRAINT IF EXISTS profiles_weight_kg_check;

-- Rename columns
ALTER TABLE profiles 
  RENAME COLUMN height_cm TO height_inches;

ALTER TABLE profiles 
  RENAME COLUMN weight_kg TO weight_lbs;

-- Add new check constraints with appropriate ranges
ALTER TABLE profiles
  ADD CONSTRAINT profiles_height_inches_check 
    CHECK (height_inches > 0 AND height_inches <= 120),
  ADD CONSTRAINT profiles_weight_lbs_check 
    CHECK (weight_lbs > 0 AND weight_lbs <= 1000);