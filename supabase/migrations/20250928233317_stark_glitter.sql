/*
  # Add RLS policies for training check-ins

  1. Security
    - Enable RLS on training_checkins table
    - Add policies for users to manage their own data
    - Add policies for coaches to read all data
*/

-- Enable Row Level Security
ALTER TABLE training_checkins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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