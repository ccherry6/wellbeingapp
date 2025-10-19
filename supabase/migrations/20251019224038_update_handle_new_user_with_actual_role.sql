/*
  # Update handle_new_user to set actual_role

  1. Changes
    - Update the handle_new_user function to set both role and actual_role
    - actual_role is set to the role from signup metadata
    - role is also set to the same value initially (can be changed later for view switching)
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;