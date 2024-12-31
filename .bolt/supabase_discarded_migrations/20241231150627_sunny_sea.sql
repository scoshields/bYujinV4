/*
  # Update grip types for exercises table

  1. Changes
    - Drop existing grip_type enum
    - Update exercises table to use new grip types
*/

-- First, alter the table to change grip to text type temporarily
ALTER TABLE exercises ALTER COLUMN grip TYPE text;

-- Drop the existing grip_type enum
DROP TYPE IF EXISTS grip_type;

-- Create new grip_type enum with all the specified values
CREATE TYPE grip_type AS ENUM (
  'neutral',
  'no_grip',
  'flat_palm',
  'head_supported',
  'pronated',
  'forearm',
  'crush_grip',
  'supinated',
  'bottoms_up',
  'hand_assisted',
  'goblet',
  'horn_grip',
  'bottoms_up_horn_grip',
  'false_grip',
  'other',
  'waiter_hold',
  'mixed_grip',
  'fingertip'
);

-- Alter the table to use the new enum type
ALTER TABLE exercises ALTER COLUMN grip TYPE grip_type USING grip::grip_type;