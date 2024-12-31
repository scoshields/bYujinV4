/*
  # Add exercises for 4-day split workouts

  1. New Exercises
    - Add comprehensive set of exercises for upper and lower body splits
    - Include proper target muscle groups and equipment options
  2. Updates
    - Ensure all exercises have correct target muscle groups
*/

-- Insert upper body exercises
INSERT INTO exercises (name, target_muscle_group, primary_equipment, grip, mechanics) VALUES
  -- Back exercises
  ('Lat Pulldown', 'Back', 'Cable Machine', 'Pronated', 'Compound'),
  ('Seated Cable Row', 'Back', 'Cable Machine', 'Neutral', 'Compound'),
  ('Dumbbell Row', 'Back', 'Dumbbells', 'Neutral', 'Compound'),
  
  -- Chest exercises
  ('Incline Bench Press', 'Upper Chest', 'Barbell', 'Pronated', 'Compound'),
  ('Dumbbell Flyes', 'Chest', 'Dumbbells', 'Neutral', 'Isolation'),
  ('Push-Ups', 'Chest', 'Bodyweight', 'Neutral', 'Compound'),
  
  -- Shoulder exercises
  ('Overhead Press', 'Shoulders', 'Barbell', 'Pronated', 'Compound'),
  ('Lateral Raises', 'Shoulders', 'Dumbbells', 'Neutral', 'Isolation'),
  ('Face Pulls', 'Rear Deltoids', 'Cable Machine', 'Pronated', 'Isolation'),
  
  -- Arm exercises
  ('Tricep Pushdown', 'Triceps', 'Cable Machine', 'Pronated', 'Isolation'),
  ('Hammer Curls', 'Biceps', 'Dumbbells', 'Neutral', 'Isolation'),
  ('Preacher Curls', 'Biceps', 'Barbell', 'Supinated', 'Isolation');

-- Insert lower body exercises
INSERT INTO exercises (name, target_muscle_group, primary_equipment, grip, mechanics) VALUES
  -- Quadriceps
  ('Front Squat', 'Quadriceps', 'Barbell', 'Pronated', 'Compound'),
  ('Leg Press', 'Quadriceps', 'Machine', 'No Grip', 'Compound'),
  ('Bulgarian Split Squat', 'Quadriceps', 'Dumbbells', 'Neutral', 'Compound'),
  
  -- Hamstrings
  ('Romanian Deadlift', 'Hamstrings', 'Barbell', 'Pronated', 'Compound'),
  ('Leg Curl', 'Hamstrings', 'Machine', 'No Grip', 'Isolation'),
  ('Good Morning', 'Hamstrings', 'Barbell', 'Pronated', 'Compound'),
  
  -- Glutes
  ('Hip Thrust', 'Glutes', 'Barbell', 'No Grip', 'Compound'),
  ('Glute Bridge', 'Glutes', 'Bodyweight', 'No Grip', 'Compound'),
  ('Cable Pull Through', 'Glutes', 'Cable Machine', 'Neutral', 'Compound'),
  
  -- Calves & Accessories
  ('Standing Calf Raise', 'Calves', 'Machine', 'No Grip', 'Isolation'),
  ('Seated Calf Raise', 'Calves', 'Machine', 'No Grip', 'Isolation'),
  ('Adductor Machine', 'Adductors', 'Machine', 'No Grip', 'Isolation'),
  ('Abductor Machine', 'Abductors', 'Machine', 'No Grip', 'Isolation');