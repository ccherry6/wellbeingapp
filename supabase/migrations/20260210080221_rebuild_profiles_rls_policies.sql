/*
  # Rebuild Profiles RLS Policies - Complete Reset

  1. Changes
    - Drop ALL existing policies on profiles table
    - Recreate clean policies that allow:
      * All authenticated users can read ALL profiles
      * Users can update their own profile only
      * New users can insert their own profile during registration

  2. Security
    - Authenticated users have full read access to all profiles (required for coaches)
    - Write operations (INSERT/UPDATE) are restricted to own profile only
*/

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Allow all reads for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile and switch views" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
DROP POLICY IF EXISTS "Coaches can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create simple, clear SELECT policy - ALL authenticated users can see ALL profiles
CREATE POLICY "authenticated_users_select_all_profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Create UPDATE policy - users can only update their own profile
CREATE POLICY "users_update_own_profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create INSERT policy - users can only create their own profile
CREATE POLICY "users_insert_own_profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
