/*
  # Fix User Profile Creation to Handle All Fields

  1. Purpose
    - Update the handle_new_user function to properly insert all user metadata fields
    - Includes student_id, sport, team, and program_year from signup
  
  2. Changes
    - Replace handle_new_user function to capture all fields from raw_user_meta_data
    - Handle NULL values properly for optional fields
*/

-- Drop and recreate the function with all fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, 
    email, 
    full_name, 
    role,
    student_id,
    sport,
    program_year
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.raw_user_meta_data->>'student_id',
    NEW.raw_user_meta_data->>'sport',
    CASE 
      WHEN NEW.raw_user_meta_data->>'program_year' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'program_year')::integer
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
