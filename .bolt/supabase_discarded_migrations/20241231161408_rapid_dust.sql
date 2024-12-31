/*
  # Add sample exercises

  1. New Data
    - Add sample exercises for each muscle group:
      - Push exercises (Chest, Shoulders, Triceps)
      - Pull exercises (Back, Biceps, Forearms)
      - Leg exercises (Quadriceps, Hamstrings, Calves, Glutes)

  2. Security
    - No changes to security policies
*/

-- Push exercises
INSERT INTO exercises (name, target_muscle_group, primary_equipment, grip, mechanics) VALUES
  ('Bench Press', 'Chest', 'Barbell', 'Pronated', 'Compound'),
  ('Incline Dumbbell Press', 'Upper Chest', 'Dumbbells', 'Neutral', 'Compound'),
  ('Military Press', 'Shoulders', 'Barbell', 'Pronated', 'Compound'),
  ('Lateral Raises', 'Shoulders', 'Dumbbells', 'Neutral', 'Isolation'),
  ('Tricep Pushdowns', 'Triceps', 'Cable Machine', 'Pronated', 'Isolation'),
  ('Overhead Tricep Extension', 'Triceps', 'Dumbbells', 'Neutral', 'Isolation');

-- Pull exercises
INSERT INTO exercises (name, target_muscle_group, primary_equipment, grip, mechanics) VALUES
  ('Barbell Row', 'Back', 'Barbell', 'Pronated', 'Compound'),
  ('Lat Pulldown', 'Back', 'Cable Machine', 'Pronated', 'Compound'),
  ('Face Pull', 'Back', 'Cable Machine', 'Neutral', 'Compound'),
  ('Dumbbell Curl', 'Biceps', 'Dumbbells', 'Supinated', 'Isolation'),
  ('Hammer Curl', 'Biceps', 'Dumbbells', 'Neutral', 'Isolation'),
  ('Reverse Curl', 'Forearms', 'Barbell', 'Pronated', 'Isolation');

-- Leg exercises
INSERT INTO exercises (name, target_muscle_group, primary_equipment, grip, mechanics) VALUES
  ('Squat', 'Quadriceps', 'Barbell', 'Pronated', 'Compound'),
  ('Romanian Deadlift', 'Hamstrings', 'Barbell', 'Pronated', 'Compound'),
  ('Leg Press', 'Quadriceps', 'Machine', 'No Grip', 'Compound'),
  ('Leg Extension', 'Quadriceps', 'Machine', 'No Grip', 'Isolation'),
  ('Leg Curl', 'Hamstrings', 'Machine', 'No Grip', 'Isolation'),
  ('Standing Calf Raise', 'Calves', 'Machine', 'No Grip', 'Isolation'),
  ('Hip Thrust', 'Glutes', 'Barbell', 'No Grip', 'Compound');