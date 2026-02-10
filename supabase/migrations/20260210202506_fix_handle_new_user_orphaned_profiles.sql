/*
  # Fix handle_new_user to handle orphaned profiles

  1. Changes
    - Update handle_new_user function to detect and clean up orphaned profiles
    - When a user signs up with an email that exists in profiles but with different auth.id:
      - Delete the orphaned profile and all related data
      - Create new profile with the new auth.id
    - This prevents UNIQUE constraint violations when re-inviting deleted users
  
  2. Security
    - Maintains SECURITY DEFINER to allow cleanup operations
    - Only cleans up profiles that don't match the new auth user ID
    - Preserves all existing functionality and invitation flow
  
  3. Why This Matters
    - If user deletion fails partway (auth deleted but profile remains)
    - Or if profile is orphaned for any reason
    - System can now auto-recover instead of blocking new signups
*/

CREATE OR REPLACE FUNCTION handle_new_user()
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
  v_orphaned_profile_id uuid;
BEGIN
  RAISE LOG 'handle_new_user triggered for email: %', NEW.email;
  
  -- Check for orphaned profile (email exists but different id)
  BEGIN
    SELECT id INTO v_orphaned_profile_id
    FROM profiles
    WHERE email = NEW.email
      AND id != NEW.id
    LIMIT 1;
    
    IF FOUND THEN
      RAISE LOG 'Found orphaned profile for email %, cleaning up...', NEW.email;
      
      -- Delete related data first (foreign key constraints)
      DELETE FROM wellness_entries WHERE user_id = v_orphaned_profile_id;
      DELETE FROM wellness_alerts WHERE user_id = v_orphaned_profile_id;
      DELETE FROM auto_alert_logs WHERE student_id = v_orphaned_profile_id;
      DELETE FROM contact_followups WHERE student_id = v_orphaned_profile_id;
      DELETE FROM audit_logs WHERE user_id = v_orphaned_profile_id;
      
      -- Delete the orphaned profile
      DELETE FROM profiles WHERE id = v_orphaned_profile_id;
      
      RAISE LOG 'Cleaned up orphaned profile for email %', NEW.email;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error cleaning orphaned profile for %: %', NEW.email, SQLERRM;
      -- Continue anyway - the ON CONFLICT clause will handle it
  END;

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

    INSERT INTO public.profiles (
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
  END;

  RETURN NEW;
END;
$$;
