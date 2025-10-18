/*
  # Create automatic alert system for critical student scores

  1. New Tables
    - `auto_alert_logs` - Track sent alerts to prevent spam
    
  2. Changes
    - Add trigger function to automatically check scores on new wellness entries
    - Add email notification system for critical scores
    
  3. Security
    - Enable RLS on auto_alert_logs table
    - Add policies for system access
*/

-- Create auto alert logs table to prevent spam
CREATE TABLE IF NOT EXISTS auto_alert_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  metric_triggered text NOT NULL,
  score_value numeric NOT NULL,
  alert_sent_at timestamptz DEFAULT now(),
  admin_email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE auto_alert_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for system access (coaches and admins can read)
CREATE POLICY "Coaches can read alert logs"
  ON auto_alert_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('coach', 'admin')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auto_alert_logs_student_id ON auto_alert_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_auto_alert_logs_date ON auto_alert_logs(alert_sent_at);
CREATE INDEX IF NOT EXISTS idx_auto_alert_logs_metric ON auto_alert_logs(metric_triggered);

-- Create function to check for critical scores and send alerts
CREATE OR REPLACE FUNCTION check_critical_scores()
RETURNS TRIGGER AS $$
DECLARE
  student_profile RECORD;
  alert_needed BOOLEAN := FALSE;
  critical_metrics TEXT[] := '{}';
  admin_email TEXT := 'ccherry@bdc.nsw.edu.au';
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Get student profile information
  SELECT full_name, student_id, sport, email
  INTO student_profile
  FROM user_profiles
  WHERE id = NEW.user_id;

  -- Check critical thresholds and build list of concerning metrics
  
  -- Mood: Critical if below 4
  IF NEW.mood < 4 THEN
    -- Check if we already sent an alert today for this metric
    IF NOT EXISTS (
      SELECT 1 FROM auto_alert_logs 
      WHERE student_id = NEW.user_id 
      AND metric_triggered = 'mood'
      AND DATE(alert_sent_at) = today_date
    ) THEN
      critical_metrics := array_append(critical_metrics, 'Mood: ' || NEW.mood || '/10 (Critical: <4)');
      alert_needed := TRUE;
      
      -- Log the alert
      INSERT INTO auto_alert_logs (student_id, metric_triggered, score_value, admin_email)
      VALUES (NEW.user_id, 'mood', NEW.mood, admin_email);
    END IF;
  END IF;

  -- Stress Level: Critical if above 8
  IF NEW.stress_level > 8 THEN
    IF NOT EXISTS (
      SELECT 1 FROM auto_alert_logs 
      WHERE student_id = NEW.user_id 
      AND metric_triggered = 'stress_level'
      AND DATE(alert_sent_at) = today_date
    ) THEN
      critical_metrics := array_append(critical_metrics, 'Stress Level: ' || NEW.stress_level || '/10 (Critical: >8)');
      alert_needed := TRUE;
      
      INSERT INTO auto_alert_logs (student_id, metric_triggered, score_value, admin_email)
      VALUES (NEW.user_id, 'stress_level', NEW.stress_level, admin_email);
    END IF;
  END IF;

  -- Sleep Quality: Critical if below 4
  IF NEW.sleep_quality < 4 THEN
    IF NOT EXISTS (
      SELECT 1 FROM auto_alert_logs 
      WHERE student_id = NEW.user_id 
      AND metric_triggered = 'sleep_quality'
      AND DATE(alert_sent_at) = today_date
    ) THEN
      critical_metrics := array_append(critical_metrics, 'Sleep Quality: ' || NEW.sleep_quality || '/10 (Critical: <4)');
      alert_needed := TRUE;
      
      INSERT INTO auto_alert_logs (student_id, metric_triggered, score_value, admin_email)
      VALUES (NEW.user_id, 'sleep_quality', NEW.sleep_quality, admin_email);
    END IF;
  END IF;

  -- Academic Pressure: Critical if above 8
  IF NEW.academic_pressure > 8 THEN
    IF NOT EXISTS (
      SELECT 1 FROM auto_alert_logs 
      WHERE student_id = NEW.user_id 
      AND metric_triggered = 'academic_pressure'
      AND DATE(alert_sent_at) = today_date
    ) THEN
      critical_metrics := array_append(critical_metrics, 'Academic Pressure: ' || NEW.academic_pressure || '/10 (Critical: >8)');
      alert_needed := TRUE;
      
      INSERT INTO auto_alert_logs (student_id, metric_triggered, score_value, admin_email)
      VALUES (NEW.user_id, 'academic_pressure', NEW.academic_pressure, admin_email);
    END IF;
  END IF;

  -- Training Fatigue: Critical if above 9
  IF NEW.training_fatigue > 9 THEN
    IF NOT EXISTS (
      SELECT 1 FROM auto_alert_logs 
      WHERE student_id = NEW.user_id 
      AND metric_triggered = 'training_fatigue'
      AND DATE(alert_sent_at) = today_date
    ) THEN
      critical_metrics := array_append(critical_metrics, 'Training Fatigue: ' || NEW.training_fatigue || '/10 (Critical: >9)');
      alert_needed := TRUE;
      
      INSERT INTO auto_alert_logs (student_id, metric_triggered, score_value, admin_email)
      VALUES (NEW.user_id, 'training_fatigue', NEW.training_fatigue, admin_email);
    END IF;
  END IF;

  -- Energy Level: Critical if below 3
  IF NEW.energy_level < 3 THEN
    IF NOT EXISTS (
      SELECT 1 FROM auto_alert_logs 
      WHERE student_id = NEW.user_id 
      AND metric_triggered = 'energy_level'
      AND DATE(alert_sent_at) = today_date
    ) THEN
      critical_metrics := array_append(critical_metrics, 'Energy Level: ' || NEW.energy_level || '/10 (Critical: <3)');
      alert_needed := TRUE;
      
      INSERT INTO auto_alert_logs (student_id, metric_triggered, score_value, admin_email)
      VALUES (NEW.user_id, 'energy_level', NEW.energy_level, admin_email);
    END IF;
  END IF;

  -- If any critical metrics found, call the edge function to send email
  IF alert_needed AND array_length(critical_metrics, 1) > 0 THEN
    -- Use pg_net to call the edge function (this requires pg_net extension)
    -- Note: This is a simplified approach - in production you might want to use a queue
    PERFORM net.http_post(
      url := 'https://mnmhkmamasbyvcpuoiwa.supabase.co/functions/v1/send-critical-alert',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_key', true)
      ),
      body := jsonb_build_object(
        'student_name', student_profile.full_name,
        'student_id', student_profile.student_id,
        'student_email', student_profile.email,
        'sport', student_profile.sport,
        'critical_metrics', critical_metrics,
        'admin_email', admin_email,
        'entry_date', NEW.entry_date
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically check scores on new wellness entries
DROP TRIGGER IF EXISTS trigger_check_critical_scores ON wellness_entries;
CREATE TRIGGER trigger_check_critical_scores
  AFTER INSERT OR UPDATE ON wellness_entries
  FOR EACH ROW
  EXECUTE FUNCTION check_critical_scores();