/*
  # Add Low Metric Alert System
  
  1. Purpose
    - Automatically detect when students report concerning wellness metrics
    - Send email alerts to coaches when thresholds are breached
    - Track alert history for follow-up purposes
  
  2. Alert Triggers
    Critical metrics that trigger alerts when they fall below thresholds:
    - Sleep quality ≤ 3
    - Sleep hours ≤ 5
    - Energy level ≤ 3
    - Mood ≤ 3
    - Stress level ≥ 8
    - Academic pressure ≥ 8
    - Training fatigue ≥ 8
    - Relationship satisfaction ≤ 3
    - Program belonging ≤ 3
    - Is injured or sick = true
    
  3. New Table
    - `wellness_alerts` - Tracks all triggered alerts
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `entry_id` (uuid, references wellness_entries)
      - `alert_type` (text) - Which metric triggered the alert
      - `metric_value` (integer) - The concerning value
      - `alert_sent` (boolean) - Whether email was sent successfully
      - `created_at` (timestamptz)
  
  4. Security
    - Enable RLS on `wellness_alerts` table
    - Only coaches can view alerts
    - System can insert alerts via trigger
  
  5. Trigger Function
    - Automatically called when wellness_entries are inserted/updated
    - Checks all metrics against thresholds
    - Calls edge function to send email alerts
    - Records alert in wellness_alerts table
*/

-- Create wellness_alerts table
CREATE TABLE IF NOT EXISTS wellness_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  entry_id uuid REFERENCES wellness_entries(id) ON DELETE CASCADE NOT NULL,
  alert_type text NOT NULL,
  metric_value integer,
  alert_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE wellness_alerts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Coaches can view all alerts" ON wellness_alerts;
  DROP POLICY IF EXISTS "System can insert alerts" ON wellness_alerts;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Policy: Coaches can view all alerts
CREATE POLICY "Coaches can view all alerts"
  ON wellness_alerts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'coach'
    )
  );

-- Policy: System can insert alerts (service role)
CREATE POLICY "System can insert alerts"
  ON wellness_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to check metrics and send alerts
CREATE OR REPLACE FUNCTION check_wellness_metrics_and_alert()
RETURNS TRIGGER AS $$
DECLARE
  student_profile RECORD;
  alert_messages TEXT[] := ARRAY[]::TEXT[];
  alert_type TEXT;
  alert_value INTEGER;
BEGIN
  -- Get student profile info
  SELECT full_name, email, student_id, sport
  INTO student_profile
  FROM user_profiles
  WHERE id = NEW.user_id;

  -- Check each metric against thresholds
  -- Critical low metrics (positive metrics that are too low)
  IF NEW.sleep_quality <= 3 THEN
    alert_messages := array_append(alert_messages, 'Sleep Quality: ' || NEW.sleep_quality || '/10 (Critical)');
    INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
    VALUES (NEW.user_id, NEW.id, 'sleep_quality_low', NEW.sleep_quality);
  END IF;

  IF NEW.sleep_hours <= 5 THEN
    alert_messages := array_append(alert_messages, 'Sleep Hours: ' || NEW.sleep_hours || ' hours (Critical)');
    INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
    VALUES (NEW.user_id, NEW.id, 'sleep_hours_low', NEW.sleep_hours::integer);
  END IF;

  IF NEW.energy_level <= 3 THEN
    alert_messages := array_append(alert_messages, 'Energy Level: ' || NEW.energy_level || '/10 (Critical)');
    INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
    VALUES (NEW.user_id, NEW.id, 'energy_level_low', NEW.energy_level);
  END IF;

  IF NEW.mood <= 3 THEN
    alert_messages := array_append(alert_messages, 'Mood: ' || NEW.mood || '/10 (Critical)');
    INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
    VALUES (NEW.user_id, NEW.id, 'mood_low', NEW.mood);
  END IF;

  IF NEW.relationship_satisfaction <= 3 THEN
    alert_messages := array_append(alert_messages, 'Relationship Satisfaction: ' || NEW.relationship_satisfaction || '/10 (Critical)');
    INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
    VALUES (NEW.user_id, NEW.id, 'relationship_satisfaction_low', NEW.relationship_satisfaction);
  END IF;

  IF NEW.program_belonging <= 3 THEN
    alert_messages := array_append(alert_messages, 'Program Belonging: ' || NEW.program_belonging || '/10 (Critical)');
    INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
    VALUES (NEW.user_id, NEW.id, 'program_belonging_low', NEW.program_belonging);
  END IF;

  -- Critical high metrics (negative metrics that are too high)
  IF NEW.stress_level >= 8 THEN
    alert_messages := array_append(alert_messages, 'Stress Level: ' || NEW.stress_level || '/10 (High)');
    INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
    VALUES (NEW.user_id, NEW.id, 'stress_level_high', NEW.stress_level);
  END IF;

  IF NEW.academic_pressure >= 8 THEN
    alert_messages := array_append(alert_messages, 'Academic Pressure: ' || NEW.academic_pressure || '/10 (High)');
    INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
    VALUES (NEW.user_id, NEW.id, 'academic_pressure_high', NEW.academic_pressure);
  END IF;

  IF NEW.training_fatigue >= 8 THEN
    alert_messages := array_append(alert_messages, 'Training Fatigue: ' || NEW.training_fatigue || '/10 (High)');
    INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
    VALUES (NEW.user_id, NEW.id, 'training_fatigue_high', NEW.training_fatigue);
  END IF;

  -- Check for injury/sickness
  IF NEW.is_injured_or_sick = true THEN
    alert_messages := array_append(alert_messages, 'Student is injured or sick');
    INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
    VALUES (NEW.user_id, NEW.id, 'injured_or_sick', NULL);
  END IF;

  -- If any alerts triggered, send email
  IF array_length(alert_messages, 1) > 0 THEN
    PERFORM net.http_post(
      url := (SELECT current_setting('app.supabase_url', true) || '/functions/v1/send-low-metric-alert'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT current_setting('app.supabase_service_role_key', true))
      ),
      body := jsonb_build_object(
        'studentName', COALESCE(student_profile.full_name, 'Unknown Student'),
        'studentEmail', COALESCE(student_profile.email, 'No email'),
        'studentId', COALESCE(student_profile.student_id, 'N/A'),
        'sport', COALESCE(student_profile.sport, 'N/A'),
        'entryDate', NEW.entry_date,
        'alerts', alert_messages,
        'notes', NEW.notes,
        'injurySicknessNotes', NEW.injury_sickness_notes
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS wellness_metrics_alert_trigger ON wellness_entries;
CREATE TRIGGER wellness_metrics_alert_trigger
  AFTER INSERT OR UPDATE ON wellness_entries
  FOR EACH ROW
  EXECUTE FUNCTION check_wellness_metrics_and_alert();

-- Add index for faster alert queries
CREATE INDEX IF NOT EXISTS idx_wellness_alerts_user_created 
  ON wellness_alerts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wellness_alerts_created 
  ON wellness_alerts(created_at DESC);