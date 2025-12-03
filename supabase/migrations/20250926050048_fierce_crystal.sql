/*
  # Create Automatic Email Alert System

  1. New Tables
    - `auto_alert_logs` - Tracks all triggered alerts with timestamps and details
    - `wellness_resources` - Stores helpful resources that can be suggested based on scores

  2. Functions
    - `check_critical_scores()` - Automatically checks wellness entries for concerning scores
    - Sends email alerts via Edge Function when critical thresholds are met

  3. Triggers
    - `trigger_check_critical_scores` - Executes after wellness entry insert/update

  4. Security
    - Enable RLS on new tables
    - Add appropriate policies for coaches to view alert logs
*/

-- Enable pg_net extension for HTTP requests from database functions
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create auto alert logs table
CREATE TABLE IF NOT EXISTS auto_alert_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  metric_triggered text NOT NULL,
  score_value numeric NOT NULL,
  alert_sent_at timestamptz DEFAULT now(),
  admin_email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create wellness resources table for suggested interventions
CREATE TABLE IF NOT EXISTS wellness_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  url text NOT NULL,
  metric_key text NOT NULL CHECK (metric_key IN (
    'sleep_quality', 'sleep_hours', 'energy_level', 'training_fatigue',
    'muscle_soreness', 'mood', 'stress_level', 'academic_pressure',
    'relationship_satisfaction', 'program_belonging'
  )),
  trigger_condition text NOT NULL CHECK (trigger_condition IN ('less_than', 'greater_than')),
  trigger_value numeric NOT NULL,
  resource_type text DEFAULT 'article' CHECK (resource_type IN ('article', 'video', 'exercise', 'meditation', 'guide')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE auto_alert_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_resources ENABLE ROW LEVEL SECURITY;

-- Create policies for auto_alert_logs
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

-- Create policies for wellness_resources
CREATE POLICY "Authenticated users can read all wellness resources"
  ON wellness_resources
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auto_alert_logs_student_id ON auto_alert_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_auto_alert_logs_metric ON auto_alert_logs(metric_triggered);
CREATE INDEX IF NOT EXISTS idx_auto_alert_logs_date ON auto_alert_logs(alert_sent_at);
CREATE INDEX IF NOT EXISTS idx_wellness_resources_metric ON wellness_resources(metric_key);
CREATE INDEX IF NOT EXISTS idx_wellness_resources_condition ON wellness_resources(trigger_condition, trigger_value);
CREATE INDEX IF NOT EXISTS idx_wellness_resources_type ON wellness_resources(resource_type);

-- Function to check for critical scores and send alerts
CREATE OR REPLACE FUNCTION public.check_critical_scores()
RETURNS TRIGGER AS $$
DECLARE
    _student_profile public.user_profiles;
    _admin_email text := 'ccherry@bdc.nsw.edu.au'; -- Replace with your actual admin email
    _critical_metrics text[] := ARRAY[]::text[];
    _supabase_url text := 'https://mnmhkmamasbyvcpuoiwa.supabase.co'; -- Replace with your Supabase URL
    _anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ubWhrbWFtYXNieXZjcHVvaXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU1NzE4NzQsImV4cCI6MjA0MTE0Nzg3NH0.YJJhOJhOJhOJhOJhOJhOJhOJhOJhOJhOJhOJhOJhOJhO'; -- Replace with your actual Supabase Anon Key
    _function_url text;
    _payload jsonb;
    _response record;
    _today date := CURRENT_DATE;
    _existing_alert_count int;
BEGIN
    -- Fetch student profile
    SELECT * INTO _student_profile FROM public.user_profiles WHERE id = NEW.user_id;

    IF _student_profile IS NULL THEN
        RAISE WARNING 'Student profile not found for user_id: %', NEW.user_id;
        RETURN NEW;
    END IF;

    -- Check for critical scores and build list of concerning metrics
    -- Lower is worse metrics (concerning when score <= 3)
    IF NEW.sleep_quality <= 3 THEN
        _critical_metrics := _critical_metrics || ARRAY['Sleep Quality: ' || NEW.sleep_quality || '/10 (Very Poor)'];
    END IF;
    IF NEW.sleep_hours <= 4 THEN
        _critical_metrics := _critical_metrics || ARRAY['Sleep Hours: ' || NEW.sleep_hours || ' hours (Insufficient)'];
    END IF;
    IF NEW.energy_level <= 3 THEN
        _critical_metrics := _critical_metrics || ARRAY['Energy Level: ' || NEW.energy_level || '/10 (Very Low)'];
    END IF;
    IF NEW.mood <= 3 THEN
        _critical_metrics := _critical_metrics || ARRAY['Mood: ' || NEW.mood || '/10 (Very Low)'];
    END IF;
    IF NEW.relationship_satisfaction <= 3 THEN
        _critical_metrics := _critical_metrics || ARRAY['Relationship Satisfaction: ' || NEW.relationship_satisfaction || '/10 (Very Low)'];
    END IF;
    IF NEW.program_belonging <= 3 THEN
        _critical_metrics := _critical_metrics || ARRAY['Program Belonging: ' || NEW.program_belonging || '/10 (Very Low)'];
    END IF;

    -- Higher is worse metrics (concerning when score >= 8)
    IF NEW.training_fatigue >= 8 THEN
        _critical_metrics := _critical_metrics || ARRAY['Training Fatigue: ' || NEW.training_fatigue || '/10 (Very High)'];
    END IF;
    IF NEW.muscle_soreness >= 8 THEN
        _critical_metrics := _critical_metrics || ARRAY['Muscle Soreness: ' || NEW.muscle_soreness || '/10 (Very High)'];
    END IF;
    IF NEW.stress_level >= 8 THEN
        _critical_metrics := _critical_metrics || ARRAY['Stress Level: ' || NEW.stress_level || '/10 (Very High)'];
    END IF;
    IF NEW.academic_pressure >= 8 THEN
        _critical_metrics := _critical_metrics || ARRAY['Academic Pressure: ' || NEW.academic_pressure || '/10 (Very High)'];
    END IF;

    -- Only send alert if we have critical metrics AND haven't sent one today for this student
    IF array_length(_critical_metrics, 1) > 0 THEN
        -- Check if we've already sent an alert today for this student
        SELECT COUNT(*) INTO _existing_alert_count
        FROM auto_alert_logs
        WHERE student_id = NEW.user_id 
        AND DATE(alert_sent_at) = _today;

        IF _existing_alert_count = 0 THEN
            RAISE NOTICE 'Sending critical alert for student %: %', _student_profile.full_name, _critical_metrics;

            _function_url := _supabase_url || '/functions/v1/send-critical-alert';
            _payload := jsonb_build_object(
                'student_name', COALESCE(_student_profile.full_name, 'Unknown Student'),
                'student_id', COALESCE(_student_profile.student_id, 'N/A'),
                'student_email', _student_profile.email,
                'sport', COALESCE(_student_profile.sport, 'N/A'),
                'critical_metrics', _critical_metrics,
                'admin_email', _admin_email,
                'entry_date', NEW.entry_date::text
            );

            -- Send HTTP request to Edge Function
            SELECT status, content INTO _response
            FROM net.http_post(
                url := _function_url,
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || _anon_key
                ),
                body := _payload::text
            );

            -- Log the alert attempt
            INSERT INTO auto_alert_logs (student_id, metric_triggered, score_value, admin_email)
            VALUES (
                NEW.user_id, 
                array_to_string(_critical_metrics, ', '), 
                array_length(_critical_metrics, 1), 
                _admin_email
            );

            IF _response.status = 200 THEN
                RAISE NOTICE 'Critical alert sent successfully for %', _student_profile.full_name;
            ELSE
                RAISE WARNING 'Failed to send critical alert for %: Status % Body %', 
                    _student_profile.full_name, _response.status, _response.content;
            END IF;
        ELSE
            RAISE NOTICE 'Alert already sent today for student %, skipping duplicate', _student_profile.full_name;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS trigger_check_critical_scores ON public.wellness_entries;
CREATE TRIGGER trigger_check_critical_scores
    AFTER INSERT OR UPDATE ON public.wellness_entries
    FOR EACH ROW EXECUTE FUNCTION public.check_critical_scores();

-- Insert some sample wellness resources
INSERT INTO wellness_resources (title, description, url, metric_key, trigger_condition, trigger_value, resource_type) VALUES
('Sleep Hygiene Guide', 'Tips for improving sleep quality and establishing healthy sleep routines', 'https://www.sleepfoundation.org/sleep-hygiene', 'sleep_quality', 'less_than', 4, 'guide'),
('Stress Management Techniques', 'Evidence-based strategies for managing stress and anxiety', 'https://www.headspace.com/stress', 'stress_level', 'greater_than', 7, 'meditation'),
('Mood Boosting Activities', 'Simple activities to help improve mood and emotional wellbeing', 'https://www.beyondblue.org.au/the-facts/depression/signs-and-symptoms', 'mood', 'less_than', 4, 'article'),
('Energy Enhancement Tips', 'Natural ways to boost energy levels throughout the day', 'https://www.healthline.com/nutrition/how-to-increase-energy', 'energy_level', 'less_than', 4, 'article'),
('Recovery and Fatigue Management', 'Strategies for managing training fatigue and optimizing recovery', 'https://www.ausport.gov.au/ais/nutrition/factsheets/recovery', 'training_fatigue', 'greater_than', 7, 'guide')
ON CONFLICT DO NOTHING;