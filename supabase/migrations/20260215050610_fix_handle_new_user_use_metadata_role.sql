/*
  # Fix handle_new_user to Use Metadata Role

  This migration updates the handle_new_user trigger function to properly
  read the role from the user's metadata during signup, which is set by
  the invitation system.

  ## Changes
  1. Read role from NEW.raw_user_meta_data->'role' 
  2. Use metadata role when creating profile (defaults to 'student' if not set)
  3. Also check invitation_tokens table for additional data
  4. Mark invitation token as used when profile is created

  ## Why This Fixes the Issue
  When users sign up via invitation link:
  - Frontend passes role='coach' in signup metadata
  - This metadata is stored in auth.users.raw_user_meta_data
  - Old trigger ignored this and always created 'student' profile
  - New trigger reads and uses the metadata role
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  invitation_token_record invitation_tokens%ROWTYPE;
  default_org_id uuid := '5b494b69-5782-441c-8e99-9a886fd1616b';
  user_role text;
  user_full_name text;
  user_student_id text;
  user_sport text;
BEGIN
  RAISE LOG 'handle_new_user: Processing new user %', NEW.id;
  
  -- Extract role and other data from user metadata
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  user_full_name := NEW.raw_user_meta_data->>'full_name';
  user_student_id := NEW.raw_user_meta_data->>'student_id';
  user_sport := NEW.raw_user_meta_data->>'sport';
  
  RAISE LOG 'handle_new_user: Metadata - role: %, name: %', user_role, user_full_name;
  
  -- Also check invitation_tokens table for additional context
  SELECT * INTO invitation_token_record
  FROM invitation_tokens
  WHERE email = NEW.email
    AND used = false
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  -- Create profile with role from metadata (or invitation token as backup)
  INSERT INTO profiles (
    id, 
    email, 
    role, 
    actual_role, 
    full_name, 
    sport, 
    student_id,
    organization_id
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(invitation_token_record.role, user_role, 'student'),
    COALESCE(invitation_token_record.role, user_role, 'student'),
    user_full_name,
    user_sport,
    user_student_id,
    default_org_id
  )
  ON CONFLICT (id) DO NOTHING;

  -- Mark invitation token as used if found
  IF invitation_token_record.id IS NOT NULL THEN
    UPDATE invitation_tokens
    SET used = true,
        used_at = now()
    WHERE id = invitation_token_record.id;
    
    RAISE LOG 'handle_new_user: Marked invitation token as used';
  END IF;

  RAISE LOG 'handle_new_user: Created profile with role: %', user_role;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user ERROR: % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;
