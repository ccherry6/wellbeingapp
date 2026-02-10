/*
  # Add Coach Permission to Delete Students

  1. Changes
    - Add DELETE policy on profiles table for coaches
    - Coaches can only delete profiles where actual_role = 'student'
    - This prevents coaches from deleting other coaches or admins

  2. Security
    - Restricted to authenticated users with coach or admin role
    - Cannot delete other coaches or admins (only students)
    - Requires active authentication

  Note: Deleting from profiles will cascade to all related student data
  (wellness_entries, alerts, etc.) due to existing CASCADE foreign keys
*/

-- Allow coaches and admins to delete student profiles
CREATE POLICY "coaches_can_delete_students"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    -- User must be a coach or admin
    EXISTS (
      SELECT 1 FROM profiles AS coach_profile
      WHERE coach_profile.id = auth.uid()
      AND coach_profile.actual_role IN ('coach', 'admin')
    )
    -- Can only delete students (not other coaches or admins)
    AND actual_role = 'student'
  );
