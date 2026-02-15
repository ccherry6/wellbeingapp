/*
  # Rollback to Version 3.3 - Remove Multi-Tenancy

  This migration rolls back the multi-tenancy changes added on 2026-02-14
  and restores the database to the working v3.3 state that was approved by Apple.

  ## Changes
  1. Make organization_id columns NULLABLE on all tables
  2. Restore original RLS policies (pre-multi-tenancy)
  3. Remove organization filtering from policies
  
  ## Note
  We keep the organizations table and columns for backward compatibility,
  but make them optional so the app works without them.
*/

-- Make organization_id NULLABLE on all tables
ALTER TABLE profiles ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE wellness_entries ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE coach_invitations ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE resources ALTER COLUMN organization_id DROP NOT NULL;

-- Check if wellbeing_resources table exists and update it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'wellbeing_resources'
  ) THEN
    EXECUTE 'ALTER TABLE wellbeing_resources ALTER COLUMN organization_id DROP NOT NULL';
  END IF;
END $$;

-- RESTORE ORIGINAL RLS POLICIES FOR PROFILES
-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;
DROP POLICY IF EXISTS "Only admins can grant admin status" ON profiles;
DROP POLICY IF EXISTS "authenticated_users_select_all_profiles" ON profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "coaches_can_delete_users" ON profiles;

-- Re-enable RLS if disabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Restore original simple policies (v3.3 style)
CREATE POLICY "authenticated_users_select_all_profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_insert_own_profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "coaches_can_delete_users"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (actual_role = 'coach' OR actual_role = 'admin')
    )
  );

-- RESTORE ORIGINAL RLS POLICIES FOR WELLNESS_ENTRIES
-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Users can view wellness entries in their organization" ON wellness_entries;
DROP POLICY IF EXISTS "Users can insert wellness entries" ON wellness_entries;
DROP POLICY IF EXISTS "Users can update own wellness entries" ON wellness_entries;
DROP POLICY IF EXISTS "Users can update own wellness entries v2" ON wellness_entries;
DROP POLICY IF EXISTS "Students see own entries only" ON wellness_entries;
DROP POLICY IF EXISTS "Users can insert own wellness entries" ON wellness_entries;
DROP POLICY IF EXISTS "Coaches see all student entries" ON wellness_entries;

-- Restore original simple policies
CREATE POLICY "Students see own entries only"
  ON wellness_entries FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (actual_role = 'coach' OR actual_role = 'admin')
    )
  );

CREATE POLICY "Users can insert own wellness entries"
  ON wellness_entries FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own wellness entries v2"
  ON wellness_entries FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RESTORE ORIGINAL handle_new_user FUNCTION (without organization_id requirement)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  invitation_record coach_invitations%ROWTYPE;
  default_org_id uuid := '5b494b69-5782-441c-8e99-9a886fd1616b';
BEGIN
  RAISE LOG 'handle_new_user: Processing new user %', NEW.id;
  
  SELECT * INTO invitation_record
  FROM coach_invitations
  WHERE invited_email = NEW.email
    AND status = 'pending'
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF invitation_record.id IS NOT NULL THEN
    RAISE LOG 'handle_new_user: Found invitation for %', NEW.email;
    
    INSERT INTO profiles (
      id, 
      email, 
      role, 
      actual_role, 
      full_name, 
      sport, 
      student_id, 
      program_year,
      organization_id
    )
    VALUES (
      NEW.id,
      NEW.email,
      invitation_record.role,
      invitation_record.role,
      invitation_record.full_name,
      invitation_record.sport,
      invitation_record.student_id,
      invitation_record.program_year,
      default_org_id
    )
    ON CONFLICT (id) DO NOTHING;

    UPDATE coach_invitations
    SET status = 'accepted',
        accepted_at = now(),
        invited_user_id = NEW.id
    WHERE id = invitation_record.id;

    RAISE LOG 'handle_new_user: Created profile with invitation data';
  ELSE
    RAISE LOG 'handle_new_user: No invitation found, creating default profile';
    
    INSERT INTO profiles (
      id, 
      email, 
      role, 
      actual_role,
      organization_id
    )
    VALUES (
      NEW.id,
      NEW.email,
      'student',
      'student',
      default_org_id
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user ERROR: % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;
