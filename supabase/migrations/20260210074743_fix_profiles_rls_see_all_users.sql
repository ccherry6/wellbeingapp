/*
  # Fix Profiles RLS Policies to Allow All Users Visible

  1. Changes
    - Remove redundant "Users can read own profile" policy 
    - Keep "Allow all reads for authenticated users" with qual: true
    - This ensures all authenticated users (especially coaches) can see ALL profiles
    - Maintains secure INSERT and UPDATE policies

  2. Security
    - All authenticated users can read all profiles (needed for coaches to manage students)
    - Users can only update their own profile
    - Users can only insert their own profile during registration
*/

-- Drop the redundant restrictive policy
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

-- Verify we still have the permissive "read all" policy
-- (This should already exist, but we'll recreate it if needed)
DROP POLICY IF EXISTS "Allow all reads for authenticated users" ON profiles;

CREATE POLICY "Allow all reads for authenticated users"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure the UPDATE policy exists and is correct
DROP POLICY IF EXISTS "Users can update own profile and switch views" ON profiles;

CREATE POLICY "Users can update own profile and switch views"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure the INSERT policy exists and is correct
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;

CREATE POLICY "Allow profile creation"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);
