/*
  # Fix Coach Invitations RLS Policies

  ## Changes
  1. Drop problematic policy that tries to access auth.users
  2. Simplify policies to only use user_profiles table
  3. Use auth.uid() and auth.email() for current user checks

  ## Security
  - Maintains secure access control without accessing auth.users table
  - Coaches can only see invitations they created
  - Users can see invitations sent to their email
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Coaches can view own invitation" ON coach_invitations;

-- Create simplified policy using user_profiles
CREATE POLICY "Users can view invitations sent to their email"
  ON coach_invitations
  FOR SELECT
  TO authenticated
  USING (
    invited_email = (SELECT email FROM user_profiles WHERE id = auth.uid())
  );