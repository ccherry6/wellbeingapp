/*
  # Add Username Column to User Profiles

  1. Changes
    - Add `username` column to user_profiles table
    - Make it nullable to support existing records
    - Add unique constraint to prevent duplicate usernames
    - Update handle_new_user trigger to populate username from auth metadata

  2. Notes
    - Existing users will have NULL username initially
    - New users will get username from signup metadata or email prefix as fallback
    - Username can be updated by users later through their profile settings
*/

-- Add username column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN username text UNIQUE;
    
    COMMENT ON COLUMN user_profiles.username IS 'Unique username for the user';
  END IF;
END $$;

-- Update the handle_new_user function to include username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation RECORD;
  v_role text;
  v_actual_role text;
  v_full_name text;
  v_username text;
  v_student_id text;
  v_sport text;
  v_program_year integer;
BEGIN
  RAISE LOG 'handle_new_user triggered for email: %', NEW.email;
  
  -- Check if there's a valid invitation for this email
  BEGIN
    SELECT * INTO v_invitation
    FROM invitation_tokens
    WHERE email = NEW.email
      AND used = false
      AND expires_at > now()
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If invitation exists, use invitation data
    IF FOUND THEN
      RAISE LOG 'Found invitation for: %', NEW.email;
      v_role := v_invitation.role;
      v_actual_role := v_invitation.role;
      v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User');
      v_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
      v_student_id := NEW.raw_user_meta_data->>'student_id';
      v_sport := NEW.raw_user_meta_data->>'sport';
      v_program_year := CASE 
        WHEN NEW.raw_user_meta_data->>'program_year' IS NOT NULL 
        THEN (NEW.raw_user_meta_data->>'program_year')::integer
        ELSE NULL
      END;
      
      -- Mark invitation as used
      UPDATE invitation_tokens
      SET used = true, used_at = now()
      WHERE id = v_invitation.id;
      
      RAISE LOG 'Marked invitation as used for: %', NEW.email;
    ELSE
      -- No invitation, use user metadata
      RAISE LOG 'No invitation found for: %, using metadata', NEW.email;
      v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
      v_actual_role := v_role;
      v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User');
      v_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
      v_student_id := NEW.raw_user_meta_data->>'student_id';
      v_sport := NEW.raw_user_meta_data->>'sport';
      v_program_year := CASE 
        WHEN NEW.raw_user_meta_data->>'program_year' IS NOT NULL 
        THEN (NEW.raw_user_meta_data->>'program_year')::integer
        ELSE NULL
      END;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error checking invitation for %: %', NEW.email, SQLERRM;
      -- Use defaults if invitation check fails
      v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
      v_actual_role := v_role;
      v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User');
      v_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
      v_student_id := NEW.raw_user_meta_data->>'student_id';
      v_sport := NEW.raw_user_meta_data->>'sport';
      v_program_year := NULL;
  END;

  -- Insert user profile with determined values
  BEGIN
    RAISE LOG 'Attempting to insert profile for: % with role: %', NEW.email, v_role;
    
    INSERT INTO public.user_profiles (
      id, 
      email, 
      full_name,
      username,
      role,
      actual_role,
      student_id,
      sport,
      program_year
    )
    VALUES (
      NEW.id,
      NEW.email,
      v_full_name,
      v_username,
      v_role,
      v_actual_role,
      v_student_id,
      v_sport,
      v_program_year
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      username = EXCLUDED.username,
      role = EXCLUDED.role,
      actual_role = EXCLUDED.actual_role,
      student_id = EXCLUDED.student_id,
      sport = EXCLUDED.sport,
      program_year = EXCLUDED.program_year;
    
    RAISE LOG 'Successfully created/updated profile for: %', NEW.email;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error inserting profile for %: % (SQLSTATE: %)', NEW.email, SQLERRM, SQLSTATE;
      -- Don't re-raise - let signup succeed even if profile creation fails
      -- The user can complete their profile later
  END;

  RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
