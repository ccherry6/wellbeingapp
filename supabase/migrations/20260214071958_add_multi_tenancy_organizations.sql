/*
  # Add Multi-Tenancy Organizations Support

  1. New Tables
    - `organizations`
      - `id` (uuid, primary key) - with default BDC organization ID
      - `name` (text) - organization name
      - `slug` (text, unique) - URL-friendly identifier
      - `created_at` (timestamptz)

  2. Schema Changes
    - Add `organization_id` to `profiles` table with default to BDC
    - Add `organization_id` to `wellness_entries` table
    - Add `organization_id` to `coach_invitations` table
    - Add `organization_id` to `resources` table
    - Add `organization_id` to `wellbeing_resources` table

  3. Data Migration
    - Insert Bishop Druitt College as default organization
    - Update existing records to use BDC organization_id

  4. Security
    - Update RLS policies to filter by organization_id
    - Ensure users can only access data from their organization
*/

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert Bishop Druitt College as default organization with specific ID
INSERT INTO organizations (id, name, slug)
VALUES ('5b494b69-5782-441c-8e99-9a886fd1616b', 'Bishop Druitt College', 'bishop-druitt-college')
ON CONFLICT (id) DO NOTHING;

-- Add organization_id to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN organization_id uuid REFERENCES organizations(id) DEFAULT '5b494b69-5782-441c-8e99-9a886fd1616b';
  END IF;
END $$;

-- Update existing profiles to use BDC organization
UPDATE profiles 
SET organization_id = '5b494b69-5782-441c-8e99-9a886fd1616b'
WHERE organization_id IS NULL;

-- Make organization_id NOT NULL after setting defaults
ALTER TABLE profiles ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to wellness_entries table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wellness_entries' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE wellness_entries ADD COLUMN organization_id uuid REFERENCES organizations(id);
  END IF;
END $$;

-- Update existing wellness_entries based on user's organization
UPDATE wellness_entries we
SET organization_id = p.organization_id
FROM profiles p
WHERE we.user_id = p.id AND we.organization_id IS NULL;

-- Make organization_id NOT NULL
ALTER TABLE wellness_entries ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to coach_invitations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coach_invitations' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE coach_invitations ADD COLUMN organization_id uuid REFERENCES organizations(id) DEFAULT '5b494b69-5782-441c-8e99-9a886fd1616b';
  END IF;
END $$;

UPDATE coach_invitations 
SET organization_id = '5b494b69-5782-441c-8e99-9a886fd1616b'
WHERE organization_id IS NULL;

ALTER TABLE coach_invitations ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to resources table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE resources ADD COLUMN organization_id uuid REFERENCES organizations(id) DEFAULT '5b494b69-5782-441c-8e99-9a886fd1616b';
  END IF;
END $$;

UPDATE resources 
SET organization_id = '5b494b69-5782-441c-8e99-9a886fd1616b'
WHERE organization_id IS NULL;

ALTER TABLE resources ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to wellbeing_resources table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wellbeing_resources' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE wellbeing_resources ADD COLUMN organization_id uuid REFERENCES organizations(id) DEFAULT '5b494b69-5782-441c-8e99-9a886fd1616b';
  END IF;
END $$;

UPDATE wellbeing_resources 
SET organization_id = '5b494b69-5782-441c-8e99-9a886fd1616b'
WHERE organization_id IS NULL;

ALTER TABLE wellbeing_resources ALTER COLUMN organization_id SET NOT NULL;

-- Enable RLS on organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organizations
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Update profiles RLS policies to include organization filtering
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Coaches can view profiles in their organization" ON profiles;

CREATE POLICY "Users can view profiles in their organization"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Update wellness_entries RLS policies
DROP POLICY IF EXISTS "Users can insert own wellness entries" ON wellness_entries;
DROP POLICY IF EXISTS "Students see own entries only" ON wellness_entries;
DROP POLICY IF EXISTS "Coaches see all student entries" ON wellness_entries;

CREATE POLICY "Users can view wellness entries in their organization"
  ON wellness_entries FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND (
      user_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND (actual_role = 'coach' OR actual_role = 'admin')
      )
    )
  );

CREATE POLICY "Users can insert wellness entries"
  ON wellness_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own wellness entries"
  ON wellness_entries FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_wellness_entries_organization_id ON wellness_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_wellness_entries_user_org ON wellness_entries(user_id, organization_id);

-- Update handle_new_user function to set organization_id
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  invitation_record coach_invitations%ROWTYPE;
  default_org_id uuid := '5b494b69-5782-441c-8e99-9a886fd1616b';
  user_org_id uuid;
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
    user_org_id := COALESCE(invitation_record.organization_id, default_org_id);
    
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
      user_org_id
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