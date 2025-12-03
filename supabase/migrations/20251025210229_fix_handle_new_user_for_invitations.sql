/*
  # Fix handle_new_user function to handle invitation signups

  1. Changes
    - Update handle_new_user to gracefully handle all metadata fields
    - Remove team field since it's not in the user_profiles table
    - Add better error logging
    - Ensure the function doesn't fail on unexpected fields

  This fixes the "Database error saving new user" error that occurs when users
  sign up through invitation links.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile with only the fields that exist in the table
  INSERT INTO public.user_profiles (
    id, 
    email, 
    full_name, 
    role,
    actual_role,
    student_id,
    sport,
    program_year
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
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
    -- Log the full error details
    RAISE LOG 'Error in handle_new_user for user %: % (SQLSTATE: %)', 
      NEW.email, SQLERRM, SQLSTATE;
    -- Re-raise the error so signup fails with a clear message
    RAISE EXCEPTION 'Profile creation failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
