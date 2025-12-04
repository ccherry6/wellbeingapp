/*
  # Add Resource Triggers to Resources Table
  
  1. Changes
    - Add trigger fields to resources table:
      - metric_name: Which wellness metric to monitor
      - trigger_condition: Condition type (less_than, greater_than, equals)
      - trigger_value: The threshold value
      - auto_deploy: Whether to automatically show this resource
    - Add enabled flag to control if trigger is active
  
  2. Security
    - No RLS changes needed (resources table already has RLS)
*/

-- Add trigger fields to resources table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resources' AND column_name = 'metric_name'
  ) THEN
    ALTER TABLE resources ADD COLUMN metric_name text;
    ALTER TABLE resources ADD CONSTRAINT resources_metric_name_check 
      CHECK (metric_name IS NULL OR metric_name IN (
        'sleep_quality', 'sleep_hours', 'energy_level', 'training_fatigue',
        'muscle_soreness', 'mood', 'stress_level', 'academic_pressure',
        'relationship_satisfaction', 'program_belonging', 'hrv', 'resting_heart_rate'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resources' AND column_name = 'trigger_condition'
  ) THEN
    ALTER TABLE resources ADD COLUMN trigger_condition text;
    ALTER TABLE resources ADD CONSTRAINT resources_trigger_condition_check
      CHECK (trigger_condition IS NULL OR trigger_condition IN (
        'less_than', 'less_than_or_equal', 'greater_than', 'greater_than_or_equal', 'equals'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resources' AND column_name = 'trigger_value'
  ) THEN
    ALTER TABLE resources ADD COLUMN trigger_value numeric;
    ALTER TABLE resources ADD CONSTRAINT resources_trigger_value_check
      CHECK (trigger_value IS NULL OR (trigger_value >= 0 AND trigger_value <= 200));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resources' AND column_name = 'auto_deploy'
  ) THEN
    ALTER TABLE resources ADD COLUMN auto_deploy boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resources' AND column_name = 'trigger_enabled'
  ) THEN
    ALTER TABLE resources ADD COLUMN trigger_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resources' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE resources ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for faster trigger lookups
CREATE INDEX IF NOT EXISTS idx_resources_triggers 
  ON resources(metric_name, trigger_enabled) 
  WHERE trigger_enabled = true;

-- Create a table to track deployed resources to students
CREATE TABLE IF NOT EXISTS resource_deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  wellness_entry_id uuid NOT NULL REFERENCES wellness_entries(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  deployed_at timestamptz DEFAULT now(),
  viewed boolean DEFAULT false,
  viewed_at timestamptz,
  UNIQUE(resource_id, wellness_entry_id)
);

-- Enable RLS on resource_deployments
ALTER TABLE resource_deployments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view own deployed resources" ON resource_deployments;
DROP POLICY IF EXISTS "Coaches can view all deployed resources" ON resource_deployments;
DROP POLICY IF EXISTS "Coaches can insert deployed resources" ON resource_deployments;
DROP POLICY IF EXISTS "Students can update own deployment views" ON resource_deployments;

-- Students can view their own deployed resources
CREATE POLICY "Students can view own deployed resources"
  ON resource_deployments
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Coaches can view all deployed resources
CREATE POLICY "Coaches can view all deployed resources"
  ON resource_deployments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.actual_role IN ('coach', 'admin')
    )
  );

-- Coaches can insert deployed resources
CREATE POLICY "Coaches can insert deployed resources"
  ON resource_deployments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.actual_role IN ('coach', 'admin')
    )
  );

-- Students can update their own deployment views
CREATE POLICY "Students can update own deployment views"
  ON resource_deployments
  FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_resource_deployments_student 
  ON resource_deployments(student_id, deployed_at DESC);

CREATE INDEX IF NOT EXISTS idx_resource_deployments_entry 
  ON resource_deployments(wellness_entry_id);