/*
  # Fix Student ID Unique Constraint Issue

  1. Problem
    - UNIQUE constraint on student_id prevents multiple NULL values in PostgreSQL versions
    - Coaches don't have student_ids, causing signup failures
  
  2. Solution
    - Drop the unique constraint on student_id
    - Create a partial unique index that only enforces uniqueness for non-NULL values
    - Update trigger function to handle this properly
*/

-- Drop the existing unique constraint on student_id
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_student_id_key;

-- Create a partial unique index that only applies to non-NULL values
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_student_id_unique_idx 
ON public.user_profiles (student_id) 
WHERE student_id IS NOT NULL;

-- Update the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id TEXT;
  v_sport TEXT;
  v_program_year INTEGER;
BEGIN
  -- Extract optional fields
  v_student_id := NEW.raw_user_meta_data->>'student_id';
  v_sport := NEW.raw_user_meta_data->>'sport';
  
  -- Handle program_year conversion
  BEGIN
    v_program_year := (NEW.raw_user_meta_data->>'program_year')::integer;
  EXCEPTION
    WHEN OTHERS THEN
      v_program_year := NULL;
  END;

  -- Insert the profile
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
    NULLIF(v_student_id, ''),  -- Convert empty string to NULL
    NULLIF(v_sport, ''),        -- Convert empty string to NULL
    v_program_year
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RAISE LOG 'Unique violation in handle_new_user for user %: %', NEW.email, SQLERRM;
    RAISE EXCEPTION 'This student ID is already registered. Please contact your administrator.';
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.email, SQLERRM;
    RAISE EXCEPTION 'Database error creating user profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
