/*
  # Create user goals and wellness activities tables

  1. New Tables
    - `user_goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `title` (text)
      - `description` (text, nullable)
      - `category` (text)
      - `target_date` (date, nullable)
      - `completed` (boolean, default false)
      - `created_at` (timestamp)
    
    - `wellness_activities`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `activity_type` (text)
      - `duration_minutes` (integer)
      - `notes` (text, nullable)
      - `completed_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own data
*/

-- Create user goals table
CREATE TABLE IF NOT EXISTS user_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('academic', 'health', 'fitness', 'personal')),
  target_date date,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create wellness activities table
CREATE TABLE IF NOT EXISTS wellness_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('meditation', 'breathing', 'walk', 'journaling', 'stretching', 'gratitude')),
  duration_minutes integer NOT NULL,
  notes text,
  completed_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for user_goals
CREATE POLICY "Users can read own goals"
  ON user_goals
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own goals"
  ON user_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own goals"
  ON user_goals
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own goals"
  ON user_goals
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create policies for wellness_activities
CREATE POLICY "Users can read own activities"
  ON wellness_activities
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own activities"
  ON wellness_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own activities"
  ON wellness_activities
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own activities"
  ON wellness_activities
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_category ON user_goals(category);
CREATE INDEX IF NOT EXISTS idx_wellness_activities_user_id ON wellness_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_activities_type ON wellness_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_wellness_activities_date ON wellness_activities(completed_at);