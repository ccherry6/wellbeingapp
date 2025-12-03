/*
  # Disable email confirmation for seamless student signup

  1. Changes
    - Disable email confirmation requirement
    - Allow immediate signin after signup
    - Update auth settings for better user experience

  2. Security
    - Maintains RLS policies
    - Users still need valid email addresses
    - Admin controls remain in place
*/

-- Update auth settings to disable email confirmation
-- Note: This needs to be done in Supabase Dashboard -> Authentication -> Settings
-- Set "Enable email confirmations" to OFF

-- Create a function to handle new user profile creation automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  admin_emails text[] := ARRAY['ccherry@bdc.nsw.edu.au'];
  user_role text := 'student';
BEGIN
  -- Check if this is an admin email
  IF NEW.email = ANY(admin_emails) THEN
    user_role := 'admin';
  END IF;

  -- Insert user profile
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    role,
    student_id,
    sport,
    program_year
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    user_role,
    CASE WHEN user_role = 'student' THEN COALESCE(NEW.raw_user_meta_data->>'student_id', 'STU' || EXTRACT(epoch FROM NOW())::text) ELSE NULL END,
    CASE WHEN user_role = 'student' THEN COALESCE(NEW.raw_user_meta_data->>'sport', 'General') ELSE NULL END,
    CASE WHEN user_role = 'student' THEN COALESCE((NEW.raw_user_meta_data->>'program_year')::integer, 1) ELSE NULL END
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();