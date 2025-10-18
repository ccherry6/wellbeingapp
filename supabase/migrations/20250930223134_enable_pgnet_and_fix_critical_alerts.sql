/*
  # Enable pg_net and Fix Critical Alert Email Sending

  1. Extensions
    - Enables pg_net extension for HTTP requests from database triggers
    
  2. Updates
    - Restores the `check_critical_scores()` function to properly call the edge function
    - Uses pg_net.http_post to invoke send-critical-alert edge function
    - Ensures emails are sent to ccherry@bdc.nsw.edu.au when students have critical scores
    
  3. Behavior
    - Triggers when any student wellness entry has 3+ critical metrics
    - Critical metrics include: very low sleep quality/mood/energy, or very high stress/academic pressure
    - Only sends one email per student per day to avoid spam
    - Logs all alert attempts to auto_alert_logs table
*/

-- Enable the pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Update the check_critical_scores function to actually send emails
CREATE OR REPLACE FUNCTION public.check_critical_scores()
RETURNS TRIGGER AS $$
DECLARE
    _student_profile public.user_profiles;
    _admin_email text := 'ccherry@bdc.nsw.edu.au';
    _critical_metrics text[] := ARRAY[]::text[];
    _supabase_url text := 'https://nhvcceiikwwnbtalmbvx.supabase.co';
    _anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5odmNjZWlpa3d3bmJ0YWxtYnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODcxNTgsImV4cCI6MjA3NDY2MzE1OH0.QUrPuaT_8dsIeSvQFkMkGYGOJ7CQsoPsi_SFvCzpuG0';
    _function_url text;
    _payload jsonb;
    _request_id bigint;
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

    -- Only send alert if we have 3 or more critical metrics AND haven't sent one today
    IF array_length(_critical_metrics, 1) >= 3 THEN
        -- Check if we've already sent an alert today for this student
        SELECT COUNT(*) INTO _existing_alert_count
        FROM auto_alert_logs
        WHERE student_id = NEW.user_id 
        AND DATE(alert_sent_at) = _today;

        IF _existing_alert_count = 0 THEN
            RAISE NOTICE 'Sending critical alert for student %: % critical metrics', _student_profile.full_name, array_length(_critical_metrics, 1);

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

            -- Send HTTP request to Edge Function using pg_net
            SELECT extensions.http_post(
                url := _function_url,
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || _anon_key,
                    'apikey', _anon_key
                ),
                body := _payload
            ) INTO _request_id;

            -- Log the alert attempt
            INSERT INTO auto_alert_logs (student_id, metric_triggered, score_value, admin_email)
            VALUES (
                NEW.user_id, 
                array_to_string(_critical_metrics, ', '), 
                array_length(_critical_metrics, 1), 
                _admin_email
            );

            RAISE NOTICE 'Critical alert email request sent (request_id: %)', _request_id;
        ELSE
            RAISE NOTICE 'Alert already sent today for student %, skipping duplicate', _student_profile.full_name;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger is properly set up
DROP TRIGGER IF EXISTS trigger_check_critical_scores ON public.wellness_entries;
CREATE TRIGGER trigger_check_critical_scores
    AFTER INSERT OR UPDATE ON public.wellness_entries
    FOR EACH ROW EXECUTE FUNCTION public.check_critical_scores();
