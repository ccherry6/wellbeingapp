/*
  # Create Auth User Trigger

  1. Trigger Setup
    - Creates trigger on auth.users table to automatically create user profiles
    - Runs the handle_new_user() function after user signup
    
  2. Behavior
    - When a new user signs up, automatically creates a profile in user_profiles table
    - Copies email and full_name from auth metadata
    - Sets default role based on email (admin for specific emails, student for others)
*/

-- Ensure the handle_new_user function exists with proper logic
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

  -- Insert the user profile
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
    COALESCE(NEW.raw_user_meta_data->>'student_id', ''),
    COALESCE(NEW.raw_user_meta_data->>'sport', ''),
    user_role,
    COALESCE((NEW.raw_user_meta_data->>'program_year')::int, 1)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
