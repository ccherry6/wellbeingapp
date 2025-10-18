/*
  # Create coach alerts system

  1. New Tables
    - `coach_alerts`
      - `id` (uuid, primary key)
      - `coach_id` (uuid, foreign key to user_profiles)
      - `student_id` (uuid, foreign key to user_profiles, nullable for all-student alerts)
      - `metric` (text, wellness metric to monitor)
      - `condition_type` (text, type of condition)
      - `threshold_value` (numeric, threshold for alert)
      - `time_period_days` (integer, days to average over)
      - `is_active` (boolean, default true)
      - `last_triggered_at` (timestamp, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on coach_alerts table
    - Add policies for coaches to manage their own alerts
*/

-- Create coach alerts table
CREATE TABLE IF NOT EXISTS coach_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  metric text NOT NULL CHECK (metric IN (
    'sleep_quality', 'sleep_hours', 'energy_level', 'training_fatigue',
    'muscle_soreness', 'mood', 'stress_level', 'academic_pressure',
    'relationship_satisfaction', 'program_belonging'
  )),
  condition_type text NOT NULL CHECK (condition_type IN ('greater_than', 'less_than', 'average_below', 'average_above')),
  threshold_value numeric NOT NULL,
  time_period_days integer DEFAULT 7 CHECK (time_period_days > 0),
  is_active boolean DEFAULT true,
  last_triggered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE coach_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for coach_alerts
CREATE POLICY "Coaches can read own alerts"
  ON coach_alerts
  FOR SELECT
  TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert own alerts"
  ON coach_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update own alerts"
  ON coach_alerts
  FOR UPDATE
  TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete own alerts"
  ON coach_alerts
  FOR DELETE
  TO authenticated
  USING (coach_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_coach_alerts_coach_id ON coach_alerts(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_alerts_student_id ON coach_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_coach_alerts_metric ON coach_alerts(metric);
CREATE INDEX IF NOT EXISTS idx_coach_alerts_active ON coach_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_coach_alerts_triggered ON coach_alerts(last_triggered_at);