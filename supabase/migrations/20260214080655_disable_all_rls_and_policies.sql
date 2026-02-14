/*
  # Completely Disable RLS and Drop All Policies

  This migration completely disables Row Level Security on the profiles table
  and drops all existing policies to eliminate infinite recursion errors.

  ## Changes
  1. Drop all existing policies on profiles table
  2. Disable RLS on profiles table
  3. This is a temporary measure to allow the application to function
     while RLS policies are being redesigned

  ## Security Note
  This removes all database-level access controls. The application should
  implement proper authorization checks at the application layer until
  RLS is properly reconfigured.
*/

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Only admins can grant admin status" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;
DROP POLICY IF EXISTS "authenticated_users_select_all_profiles" ON profiles;
DROP POLICY IF EXISTS "coaches_can_delete_users" ON profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;

-- Disable RLS on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'profiles' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS is still enabled on profiles table';
  END IF;
  
  RAISE NOTICE 'RLS successfully disabled on profiles table';
END $$;
