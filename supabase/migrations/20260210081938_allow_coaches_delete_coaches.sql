/*
  # Allow Coaches to Delete Other Coaches

  1. Changes
    - Drop the restrictive student-only delete policy
    - Create a new policy allowing coaches to delete both students and other coaches
  
  2. Security
    - Only authenticated users with actual_role = 'coach' or 'admin' can delete
    - Cannot delete yourself (to prevent accidental self-deletion)
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "coaches_can_delete_students" ON profiles;

-- Create new policy allowing coaches to delete both students and coaches
CREATE POLICY "coaches_can_delete_users"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    -- Must be a coach or admin
    EXISTS (
      SELECT 1 FROM profiles coach_profile
      WHERE coach_profile.id = auth.uid()
      AND coach_profile.actual_role IN ('coach', 'admin')
    )
    -- Cannot delete yourself
    AND id != auth.uid()
  );
