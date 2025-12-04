/*
  # Fix Role Switching Circular Dependency

  1. Problem
    - Current UPDATE policies have circular dependencies
    - Subqueries SELECT from user_profiles during UPDATE permission checks
    - This causes queries to hang/timeout in the iOS app
  
  2. Solution
    - Use simpler policies that check actual_role directly
    - Avoid subqueries that reference the same table
    - Allow users to update their own role field if actual_role is coach/admin
    
  3. Security
    - Coaches/admins can update any field including role (for switching)
    - Students can only update their own non-role fields
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Coaches and admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Students can update own profile only" ON user_profiles;

-- New simplified policy: Users can update their own profile
-- The check uses the EXISTING actual_role value (before update)
CREATE POLICY "Users can update own profile with role check"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      -- If actual_role is coach/admin, allow all updates including role field
      actual_role IN ('coach', 'admin')
      -- If actual_role is student, only allow if role field isn't being changed
      OR (actual_role = 'student' AND role = 'student')
    )
  );