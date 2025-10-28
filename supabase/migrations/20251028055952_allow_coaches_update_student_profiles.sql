/*
  # Allow coaches to update student profiles

  This migration adds a policy to allow coaches and admins to update student profiles,
  specifically for managing research codes and other administrative data.

  ## Changes
  
  1. New Policy
    - `Coaches can update student profiles` - Allows users with coach or admin role to update any profile
  
  ## Security
    - Maintains existing user self-update policy
    - Adds coach/admin override for managing students
    - Only applies to authenticated users with appropriate roles
*/

-- Drop existing policy if it exists and recreate
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Coaches can update student profiles' 
    AND tablename = 'user_profiles'
  ) THEN
    DROP POLICY "Coaches can update student profiles" ON user_profiles;
  END IF;
END $$;

-- Create policy for coaches to update student profiles
CREATE POLICY "Coaches can update student profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.actual_role IN ('coach', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.actual_role IN ('coach', 'admin')
    )
  );
