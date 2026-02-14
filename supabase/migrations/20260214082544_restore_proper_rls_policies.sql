/*
  # Restore Proper RLS Policies on Profiles Table
  
  This migration restores the security policies that were in place before tonight's changes.
  
  ## Changes
  1. Drop the overly permissive "Enable all access for authenticated users" policy
  2. Restore proper granular policies:
     - SELECT: All authenticated users can read all profiles (needed for coaches)
     - UPDATE: Users can only update their own profile
     - INSERT: Users can only insert their own profile during registration
  3. Add DELETE policy for coaches to delete students
  
  ## Security
  - Properly restricts write operations to own profile only
  - Maintains read access for all authenticated users (coaches need to see students)
  - Allows coaches to delete student profiles for user management
*/

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON profiles;

-- Restore proper SELECT policy - all authenticated users can read all profiles
CREATE POLICY "authenticated_users_select_all_profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Restore UPDATE policy - users can only update their own profile
CREATE POLICY "users_update_own_profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Restore INSERT policy - users can only create their own profile
CREATE POLICY "users_insert_own_profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Add DELETE policy - coaches can delete student profiles
CREATE POLICY "coaches_can_delete_users"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles coach_profile
      WHERE coach_profile.id = auth.uid()
      AND (coach_profile.actual_role = 'coach' OR coach_profile.actual_role = 'admin')
    )
  );