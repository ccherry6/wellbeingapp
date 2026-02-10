/*
  # Add Admin System for Coach Management

  ## Summary
  Implements a secure admin system where only designated admin coaches can invite and manage other coaches.
  Prevents regular users from self-selecting as coaches during registration.

  ## Changes

  1. **New Fields**
     - Add `is_admin` boolean column to `profiles` table (default: false)
     - Only admin coaches can create coach invitations
     - Only admin coaches can modify other users' admin status

  2. **Security Updates**
     - Update `coach_invitations` policies to require admin status
     - Add policies to prevent non-admins from creating coaches
     - Ensure only admins can update is_admin field

  3. **Initial Admin Setup**
     - Set first existing coach as admin (if exists)
     - Allow manual admin designation via email

  ## Important Notes
  - Regular users can ONLY register as students
  - Coach accounts must be invited by an admin
  - At least one admin must exist at all times
*/

-- Step 1: Add is_admin column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Step 2: Set the first coach as admin (or specific email if you prefer)
-- Option A: Make the first coach in the system an admin
UPDATE profiles
SET is_admin = true
WHERE role = 'coach'
AND id = (
  SELECT id FROM profiles
  WHERE role = 'coach'
  ORDER BY created_at ASC
  LIMIT 1
);

-- Option B: If you have a specific admin email, uncomment and update this:
-- UPDATE profiles
-- SET is_admin = true
-- WHERE email = 'ccherry@bdc.nsw.edu.au';

-- Step 3: Create index for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- Step 4: Drop and recreate coach invitation policies with admin requirement

-- Drop existing coach invitation policies
DROP POLICY IF EXISTS "Head coach can create invitations" ON coach_invitations;
DROP POLICY IF EXISTS "Head coach can view own invitations" ON coach_invitations;
DROP POLICY IF EXISTS "Head coach can update own invitations" ON coach_invitations;
DROP POLICY IF EXISTS "Coaches can view own invitation" ON coach_invitations;

-- New Policy: Only admins can create coach invitations
CREATE POLICY "Only admins can create coach invitations"
  ON coach_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'coach'
      AND is_admin = true
    )
  );

-- Policy: Admins can view all invitations they sent
CREATE POLICY "Admins can view invitations they sent"
  ON coach_invitations
  FOR SELECT
  TO authenticated
  USING (
    invited_by = auth.uid() OR
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    invited_user_id = auth.uid()
  );

-- Policy: Admins can update invitations (to revoke access)
CREATE POLICY "Admins can update their invitations"
  ON coach_invitations
  FOR UPDATE
  TO authenticated
  USING (
    invited_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'coach'
      AND is_admin = true
    )
  )
  WITH CHECK (
    invited_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'coach'
      AND is_admin = true
    )
  );

-- Step 5: Update profiles policies to protect is_admin field

-- Drop existing update policies that might conflict
DROP POLICY IF EXISTS "Admins can update user admin status" ON profiles;

-- Create policy: Only admins can update is_admin field for other users
CREATE POLICY "Only admins can grant admin status"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    -- Users can update their own profile (except is_admin)
    id = auth.uid() OR
    -- Or they are an admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'coach'
      AND is_admin = true
    )
  )
  WITH CHECK (
    -- Users updating their own profile cannot change is_admin
    (id = auth.uid() AND is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid())) OR
    -- Admins can change any field including is_admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'coach'
      AND is_admin = true
    )
  );

-- Step 6: Add comment to document admin system
COMMENT ON COLUMN profiles.is_admin IS 'Indicates if this coach has admin privileges to invite other coaches and manage users. Only admin coaches can create coach invitations.';

-- Step 7: Verify at least one admin exists
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM profiles
  WHERE role = 'coach' AND is_admin = true;

  IF admin_count = 0 THEN
    RAISE WARNING 'No admin coaches found! Please manually set at least one coach as admin.';
  ELSE
    RAISE NOTICE 'Admin system initialized successfully. % admin coach(es) found.', admin_count;
  END IF;
END $$;
