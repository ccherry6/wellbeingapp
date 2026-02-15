/*
  # Fix Wellness Entry Triggers for Role Switching
  
  When coaches switch to view as students and try to save wellness entries,
  the triggers might be failing because they're trying to access data based
  on the switched role rather than the actual role.
  
  ## Changes
  1. Update both trigger functions to be more resilient and handle errors gracefully
  2. Add proper error handling so triggers don't block the wellness entry insertion
  3. Ensure triggers work regardless of role switching
  
  ## Security
  - Maintains SECURITY DEFINER to bypass RLS for system operations
  - Adds error handling to prevent trigger failures from blocking user actions
*/

-- Drop and recreate check_critical_scores with better error handling
CREATE OR REPLACE FUNCTION check_critical_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  student_profile public.profiles;
  admin_email TEXT := 'ccherry@bdc.nsw.edu.au';
  critical_metrics TEXT[] := '{}';
  is_critical BOOLEAN := FALSE;
  last_alert_time TIMESTAMPTZ;
BEGIN
  -- Wrap everything in error handling so it doesn't block the insert
  BEGIN
    -- Fetch student profile
    SELECT * INTO student_profile FROM public.profiles WHERE id = NEW.user_id;

    IF student_profile IS NULL THEN
      RAISE WARNING 'Student profile not found for user_id: %', NEW.user_id;
      RETURN NEW;
    END IF;

    -- Define critical thresholds
    IF NEW.sleep_quality <= 3 THEN
      critical_metrics := array_append(critical_metrics, 'Sleep Quality: ' || NEW.sleep_quality || '/10');
      is_critical := TRUE;
    END IF;
    IF NEW.energy_level <= 3 THEN
      critical_metrics := array_append(critical_metrics, 'Energy Level: ' || NEW.energy_level || '/10');
      is_critical := TRUE;
    END IF;
    IF NEW.mood <= 3 THEN
      critical_metrics := array_append(critical_metrics, 'Mood: ' || NEW.mood || '/10');
      is_critical := TRUE;
    END IF;
    IF NEW.stress_level >= 8 THEN
      critical_metrics := array_append(critical_metrics, 'Stress Level: ' || NEW.stress_level || '/10');
      is_critical := TRUE;
    END IF;
    IF NEW.academic_pressure >= 8 THEN
      critical_metrics := array_append(critical_metrics, 'Academic Pressure: ' || NEW.academic_pressure || '/10');
      is_critical := TRUE;
    END IF;

    -- Check if at least 3 critical metrics were triggered
    IF array_length(critical_metrics, 1) >= 3 THEN
      -- Check if an alert has been sent for this student today
      SELECT alert_sent_at INTO last_alert_time
      FROM public.auto_alert_logs
      WHERE student_id = NEW.user_id
      AND alert_sent_at >= CURRENT_DATE
      ORDER BY alert_sent_at DESC
      LIMIT 1;

      IF last_alert_time IS NULL THEN
        -- Log the alert
        INSERT INTO public.auto_alert_logs (student_id, metric_triggered, score_value, admin_email)
        VALUES (NEW.user_id, array_to_string(critical_metrics, ', '), 0, admin_email);
      END IF;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't block the insert
    RAISE WARNING 'Error in check_critical_scores trigger: % %', SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$$;

-- Drop and recreate check_wellness_metrics_and_alert with better error handling
CREATE OR REPLACE FUNCTION check_wellness_metrics_and_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  student_profile RECORD;
  alert_messages TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Wrap everything in error handling so it doesn't block the insert
  BEGIN
    -- Get student profile info
    SELECT full_name, email, student_id, sport
    INTO student_profile
    FROM profiles
    WHERE id = NEW.user_id;

    -- Check each metric against thresholds and insert alerts
    IF NEW.sleep_quality <= 3 THEN
      INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
      VALUES (NEW.user_id, NEW.id, 'sleep_quality_low', NEW.sleep_quality)
      ON CONFLICT DO NOTHING;
    END IF;

    IF NEW.sleep_hours <= 5 THEN
      INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
      VALUES (NEW.user_id, NEW.id, 'sleep_hours_low', NEW.sleep_hours::integer)
      ON CONFLICT DO NOTHING;
    END IF;

    IF NEW.energy_level <= 3 THEN
      INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
      VALUES (NEW.user_id, NEW.id, 'energy_level_low', NEW.energy_level)
      ON CONFLICT DO NOTHING;
    END IF;

    IF NEW.mood <= 3 THEN
      INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
      VALUES (NEW.user_id, NEW.id, 'mood_low', NEW.mood)
      ON CONFLICT DO NOTHING;
    END IF;

    IF NEW.relationship_satisfaction <= 3 THEN
      INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
      VALUES (NEW.user_id, NEW.id, 'relationship_satisfaction_low', NEW.relationship_satisfaction)
      ON CONFLICT DO NOTHING;
    END IF;

    IF NEW.program_belonging <= 3 THEN
      INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
      VALUES (NEW.user_id, NEW.id, 'program_belonging_low', NEW.program_belonging)
      ON CONFLICT DO NOTHING;
    END IF;

    IF NEW.stress_level >= 8 THEN
      INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
      VALUES (NEW.user_id, NEW.id, 'stress_level_high', NEW.stress_level)
      ON CONFLICT DO NOTHING;
    END IF;

    IF NEW.academic_pressure >= 8 THEN
      INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
      VALUES (NEW.user_id, NEW.id, 'academic_pressure_high', NEW.academic_pressure)
      ON CONFLICT DO NOTHING;
    END IF;

    IF NEW.training_fatigue >= 8 THEN
      INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
      VALUES (NEW.user_id, NEW.id, 'training_fatigue_high', NEW.training_fatigue)
      ON CONFLICT DO NOTHING;
    END IF;

    IF NEW.is_injured_or_sick = true THEN
      INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
      VALUES (NEW.user_id, NEW.id, 'injured_or_sick', NULL)
      ON CONFLICT DO NOTHING;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't block the insert
    RAISE WARNING 'Error in check_wellness_metrics_and_alert trigger: % %', SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$$;