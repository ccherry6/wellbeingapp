/*
  # Add default value to actual_role column

  1. Changes
    - Add DEFAULT 'student' to actual_role column
    - This ensures the column always has a value even if not provided

  This fixes the "Database error saving new user" error caused by the
  actual_role column being NOT NULL without a default value.
*/

-- Add default value to actual_role column
ALTER TABLE public.user_profiles 
ALTER COLUMN actual_role SET DEFAULT 'student';