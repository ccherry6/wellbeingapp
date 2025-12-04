/*
  # Add training check-ins system

  1. New Tables
    - `training_checkins`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `session_date` (date)
      - `session_time` (time)
      - `session_type` (text: 'pre-training', 'post-training')
      - `readiness_score` (integer, 1-10, for pre-training)
      - `fatigue_score` (integer, 1-10)
      - `soreness_score` (integer, 1-10)
      - `motivation_score` (integer, 1-10, for pre-training)
      - `rpe_score` (integer, 1-10, for post-training)
      - `overall_feeling_score` (integer, 1-10, for post-training)
      - `new_issues` (boolean, for post-training)
      - `issues_notes` (text, nullable)
      - `training_notes` (text, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on training_checkins table
    - Add policies for students to manage own data
    - Add policies for coaches to read all data
*/

CREATE TABLE IF NOT EXISTS training_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  session_time time NOT NULL DEFAULT CURRENT_TIME,
  session_type text NOT NULL CHECK (session_type IN ('pre-training', 'post-training')),
  
  -- Pre-training metrics
  readiness_score integer CHECK (readiness_score >= 1 AND readiness_score <= 10),
  motivation_score integer CHECK (motivation_score >= 1 AND motivation_score <= 10),
  
  -- Both pre and post metrics
  fatigue_score integer CHECK (fatigue_score >= 1 AND fatigue_score <= 10) NOT NULL,
  soreness_score integer CHECK (soreness_score >= 1 AND soreness_score <= 10) NOT NULL,
  
  -- Post-training metrics
  rpe_score integer CHECK (rpe_score >= 1 AND rpe_score <= 10),
  overall_feeling_score integer CHECK (overall_feeling_score >= 1 AND overall_feeling_score <= 10),
  new_issues boolean DEFAULT false,
  
  -- Notes
  issues_notes text,
  training_notes text,
  
  created_at timestamptz DEFAULT now()
);

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_checkins_user_id ON training_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_training_checkins_date ON training_checkins(session_date);
CREATE INDEX IF NOT EXISTS idx_training_checkins_type ON training_checkins(session_type);
CREATE INDEX IF NOT EXISTS idx_training_checkins_user_date ON training_checkins(user_id, session_date);