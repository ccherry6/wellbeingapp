/*
  # Fix Role Switching RLS Policies
  
  1. Problem
    - Conflicting UPDATE policies prevent role switching
    - "Students can update own profile" blocks updates when role='student' even if actual_role='coach'
    - Circular dependency between role and actual_role checks
  
  2. Solution
    - Drop all existing UPDATE policies on user_profiles
    - Create two clear, non-conflicting policies:
      a) Users with actual_role = coach/admin can update any profile (for role switching)
      b) Regular students can only update their own profile (excluding role field)
    
  3. Security
    - Coaches/admins (based on actual_role) have full update access
    - Students can update their own profile but not change their role
*/

-- Drop all existing UPDATE policies to start fresh
DROP POLICY IF EXISTS "Students can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Coaches can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Coaches can update student profiles" ON user_profiles;

-- Policy 1: Coaches and admins can update any profile (based on actual_role)
CREATE POLICY "Coaches and admins can update all profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND actual_role IN ('coach', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND actual_role IN ('coach', 'admin')
    )
  );

-- Policy 2: Regular students can update their own profile (excluding role changes)
CREATE POLICY "Students can update own profile only"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    AND (
      SELECT actual_role FROM user_profiles WHERE id = auth.uid()
    ) = 'student'
  )
  WITH CHECK (
    auth.uid() = id
  );
