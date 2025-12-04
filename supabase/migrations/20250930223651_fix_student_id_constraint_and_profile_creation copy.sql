/*
  # Fix Student ID Constraint and Profile Creation

  1. Changes
    - Drops unique constraint on student_id when empty
    - Adds partial unique index that only applies to non-empty student_ids
    - Updates handle_new_user function to use NULL instead of empty string
    - Manually creates missing profile for existing user
    
  2. Security
    - Maintains RLS policies
    - Only unique student IDs are enforced (empty/null allowed for multiple users)
*/

-- Drop the existing unique constraint on student_id if it exists
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_student_id_key;

-- Create a partial unique index that only applies to non-empty student_ids
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_student_id_key 
ON user_profiles (student_id) 
WHERE student_id IS NOT NULL AND student_id != '';

-- Update the handle_new_user function to use NULL instead of empty string
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  admin_emails text[] := ARRAY['ccherry@bdc.nsw.edu.au'];
  user_role text := 'student';
BEGIN
  -- Check if this is an admin email
  IF NEW.email = ANY(admin_emails) THEN
    user_role := 'coach';
  END IF;

  -- Insert the user profile with NULL for empty values
  INSERT INTO public.user_profiles (
    id, 
    email, 
    full_name,
    student_id,
    sport,
    role,
    program_year
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'student_id', ''), ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'sport', ''), ''),
    user_role,
    COALESCE((NEW.raw_user_meta_data->>'program_year')::int, 1)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create the missing profile for the existing user
INSERT INTO public.user_profiles (id, email, full_name, role, student_id, sport, program_year)
VALUES (
  'de77f9ec-8b14-4ac2-86de-376c7a7b6463',
  'chrischerryep@gmail.com',
  'New User',
  'student',
  NULL,
  NULL,
  1
)
ON CONFLICT (id) DO NOTHING;
