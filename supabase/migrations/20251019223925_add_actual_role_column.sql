/*
  # Add actual_role column for role switching

  1. Changes
    - Add `actual_role` column to store the user's permanent role
    - Migrate existing roles to actual_role
    - Keep `role` as the current view preference

  2. Purpose
    - Allow coaches to switch between coach and student views
    - Preserve the actual role so they can always switch back
*/

-- Add actual_role column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'actual_role'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN actual_role text;
  END IF;
END $$;

-- Copy existing roles to actual_role for all users
UPDATE user_profiles 
SET actual_role = role 
WHERE actual_role IS NULL;

-- Make actual_role NOT NULL after populating it
ALTER TABLE user_profiles ALTER COLUMN actual_role SET NOT NULL;

-- Add check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_profiles_actual_role_check'
  ) THEN
    ALTER TABLE user_profiles 
    ADD CONSTRAINT user_profiles_actual_role_check 
    CHECK (actual_role IN ('student', 'coach', 'admin'));
  END IF;
END $$;