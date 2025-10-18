/*
  # Fix Training Check-ins RLS Policies

  1. Changes
    - Drop existing policies that may be blocking inserts
    - Create new policies with proper permissions
    - Ensure users can insert their own training check-ins

  2. Security
    - Users can only access their own training check-ins
    - Coaches can read all training check-ins
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own training checkins" ON training_checkins;
DROP POLICY IF EXISTS "Users can insert own training checkins" ON training_checkins;
DROP POLICY IF EXISTS "Users can update own training checkins" ON training_checkins;
DROP POLICY IF EXISTS "Users can delete own training checkins" ON training_checkins;
DROP POLICY IF EXISTS "Coaches can read all training checkins" ON training_checkins;

-- Create new policies with proper permissions
CREATE POLICY "Users can read own training checkins"
  ON training_checkins
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own training checkins"
  ON training_checkins
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own training checkins"
  ON training_checkins
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own training checkins"
  ON training_checkins
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Coaches can read all training checkins"
  ON training_checkins
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('coach', 'admin')
    )
  );