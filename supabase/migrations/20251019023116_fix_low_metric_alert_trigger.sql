/*
  # Fix Low Metric Alert Trigger
  
  1. Changes
    - Remove the http_post call that's causing errors
    - Keep the wellness_alerts table inserts working
    - Alerts are still recorded in the database for coaches to see
    
  2. Rationale
    - The pg_net extension requires configuration that's not available
    - Email notifications can be added later through a different mechanism
    - For now, coaches can view alerts in the Alert History tab
    
  3. Security
    - No security changes - all RLS policies remain the same
*/

-- Replace the trigger function without the http_post call
CREATE OR REPLACE FUNCTION check_wellness_metrics_and_alert()
RETURNS TRIGGER AS $$
DECLARE
  student_profile RECORD;
  alert_messages TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Get student profile info
  SELECT full_name, email, student_id, sport
  INTO student_profile
  FROM user_profiles
  WHERE id = NEW.user_id;

  -- Check each metric against thresholds
  -- Critical low metrics (positive metrics that are too low)
  IF NEW.sleep_quality <= 3 THEN
    INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
    VALUES (NEW.user_id, NEW.id, 'sleep_quality_low', NEW.sleep_quality);
  END IF;

  IF NEW.sleep_hours <= 5 THEN
    INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
    VALUES (NEW.user_id, NEW.id, 'sleep_hours_low', NEW.sleep_hours::integer);
  END IF;

  IF NEW.energy_level <= 3 THEN
    INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
    VALUES (NEW.user_id, NEW.id, 'energy_level_low', NEW.energy_level);
  END IF;

  IF NEW.mood <= 3 THEN
    INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
    VALUES (NEW.user_id, NEW.id, 'mood_low', NEW.mood);
  END IF;

  IF NEW.relationship_satisfaction <= 3 THEN
    INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
    VALUES (NEW.user_id, NEW.id, 'relationship_satisfaction_low', NEW.relationship_satisfaction);
  END IF;

  IF NEW.program_belonging <= 3 THEN
    INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
    VALUES (NEW.user_id, NEW.id, 'program_belonging_low', NEW.program_belonging);
  END IF;

  -- Critical high metrics (negative metrics that are too high)
  IF NEW.stress_level >= 8 THEN
    INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
    VALUES (NEW.user_id, NEW.id, 'stress_level_high', NEW.stress_level);
  END IF;

  IF NEW.academic_pressure >= 8 THEN
    INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
    VALUES (NEW.user_id, NEW.id, 'academic_pressure_high', NEW.academic_pressure);
  END IF;

  IF NEW.training_fatigue >= 8 THEN
    INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
    VALUES (NEW.user_id, NEW.id, 'training_fatigue_high', NEW.training_fatigue);
  END IF;

  -- Check for injury/sickness
  IF NEW.is_injured_or_sick = true THEN
    INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
    VALUES (NEW.user_id, NEW.id, 'injured_or_sick', NULL);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;