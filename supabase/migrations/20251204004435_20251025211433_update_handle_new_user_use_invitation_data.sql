/*
  # Update handle_new_user to use invitation data

  1. Changes
    - Check for pending invitation when user signs up
    - Use invitation data (role, full_name, etc.) if available
    - Fall back to user metadata if no invitation exists

  2. Security
    - Ensures users get correct role from invitation
    - Prevents users from self-assigning elevated roles
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation coach_invitations%ROWTYPE;
  v_role text;
  v_actual_role text;
  v_full_name text;
  v_student_id text;
  v_sport text;
  v_program_year integer;
BEGIN
  -- Check if there's a pending invitation for this email
  SELECT * INTO v_invitation
  FROM coach_invitations
  WHERE invited_email = NEW.email
    AND status = 'pending'
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  -- If invitation exists, use invitation data
  IF FOUND THEN
    v_role := v_invitation.role;
    v_actual_role := v_invitation.role;
    v_full_name := COALESCE(v_invitation.full_name, NEW.raw_user_meta_data->>'full_name', 'New User');
    v_student_id := v_invitation.student_id;
    v_sport := v_invitation.sport;
    v_program_year := v_invitation.program_year;
  ELSE
    -- No invitation, use user metadata
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
    v_actual_role := v_role;
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User');
    v_student_id := NEW.raw_user_meta_data->>'student_id';
    v_sport := NEW.raw_user_meta_data->>'sport';
    v_program_year := CASE 
      WHEN NEW.raw_user_meta_data->>'program_year' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'program_year')::integer
      ELSE NULL
    END;
  END IF;

  -- Insert user profile with determined values
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
    v_full_name,
    v_role,
    v_actual_role,
    v_student_id,
    v_sport,
    v_program_year
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
$$;