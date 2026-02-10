/*
  # Fix all user_profiles references to profiles (v2)

  1. Changes
    - Update get_research_participant_count function
    - Update check_wellness_metrics_and_alert function
    - Drop and recreate export_research_data function
    - Update handle_new_user function
    - Update prevent_student_role_modification function
    - Update check_critical_scores function
  
  2. Security
    - All functions maintain their existing security model
    - Only changing table references from user_profiles to profiles
*/

-- Fix get_research_participant_count
CREATE OR REPLACE FUNCTION get_research_participant_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
RETURN (
SELECT COUNT(DISTINCT id)
FROM profiles
WHERE role = 'student'
AND consent_given = true
);
END;
$$;

-- Fix check_wellness_metrics_and_alert
CREATE OR REPLACE FUNCTION check_wellness_metrics_and_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
student_profile RECORD;
alert_messages TEXT[] := ARRAY[]::TEXT[];
BEGIN
-- Get student profile info
SELECT full_name, email, student_id, sport
INTO student_profile
FROM profiles
WHERE id = NEW.user_id;

-- Check each metric against thresholds
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

IF NEW.is_injured_or_sick = true THEN
INSERT INTO wellness_alerts (user_id, entry_id, alert_type, metric_value)
VALUES (NEW.user_id, NEW.id, 'injured_or_sick', NULL);
END IF;

RETURN NEW;
END;
$$;

-- Drop and recreate export_research_data
DROP FUNCTION IF EXISTS export_research_data(date, date, text, text);

CREATE FUNCTION export_research_data(
p_start_date date,
p_end_date date,
p_sport text DEFAULT NULL,
p_notes text DEFAULT NULL
)
RETURNS TABLE (
research_code text,
sport text,
program_year integer,
entry_date date,
sleep_quality integer,
sleep_hours numeric,
energy_level integer,
training_fatigue integer,
muscle_soreness integer,
mood integer,
stress_level integer,
academic_pressure integer,
relationship_satisfaction integer,
program_belonging integer,
hrv integer,
resting_heart_rate integer,
is_injured_or_sick boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
v_record_count integer;
v_research_codes text[];
BEGIN
-- Check that caller is a coach or admin
IF NOT EXISTS (
SELECT 1 FROM profiles
WHERE id = auth.uid()
AND role IN ('coach', 'admin')
) THEN
RAISE EXCEPTION 'Only coaches and admins can export research data';
END IF;

-- Get count and research codes for audit log
SELECT
COUNT(*),
ARRAY_AGG(DISTINCT r.research_code)
INTO v_record_count, v_research_codes
FROM research_wellness_data r
WHERE r.entry_date BETWEEN p_start_date AND p_end_date
AND (p_sport IS NULL OR r.sport = p_sport);

-- Log the export for audit trail
PERFORM log_data_access(
auth.uid(),
'research_export',
'wellness_entries',
v_record_count,
jsonb_build_object(
'start_date', p_start_date,
'end_date', p_end_date,
'sport_filter', p_sport,
'participant_count', array_length(v_research_codes, 1),
'notes', p_notes
)
);

-- Also log to research_exports table
INSERT INTO research_exports (
exported_by,
start_date,
end_date,
participant_count,
research_codes,
fields_exported,
notes
) VALUES (
auth.uid(),
p_start_date,
p_end_date,
array_length(v_research_codes, 1),
v_research_codes,
ARRAY['sleep_quality', 'sleep_hours', 'energy_level', 'training_fatigue', 'muscle_soreness', 'mood', 'stress_level', 'academic_pressure', 'relationship_satisfaction', 'program_belonging', 'hrv', 'resting_heart_rate', 'is_injured_or_sick'],
p_notes
);

-- Return the anonymized data
RETURN QUERY
SELECT
r.research_code,
r.sport,
r.program_year,
r.entry_date,
r.sleep_quality,
r.sleep_hours,
r.energy_level,
r.training_fatigue,
r.muscle_soreness,
r.mood,
r.stress_level,
r.academic_pressure,
r.relationship_satisfaction,
r.program_belonging,
r.hrv,
r.resting_heart_rate,
r.is_injured_or_sick
FROM research_wellness_data r
WHERE r.entry_date BETWEEN p_start_date AND p_end_date
AND (p_sport IS NULL OR r.sport = p_sport)
ORDER BY r.research_code, r.entry_date;
END;
$$;

-- Fix handle_new_user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
v_invitation RECORD;
v_role text;
v_actual_role text;
v_full_name text;
v_username text;
v_student_id text;
v_sport text;
v_program_year integer;
BEGIN
RAISE LOG 'handle_new_user triggered for email: %', NEW.email;

-- Check if there's a valid invitation for this email
BEGIN
SELECT * INTO v_invitation
FROM invitation_tokens
WHERE email = NEW.email
AND used = false
AND expires_at > now()
ORDER BY created_at DESC
LIMIT 1;

-- If invitation exists, use invitation data
IF FOUND THEN
RAISE LOG 'Found invitation for: %', NEW.email;
v_role := v_invitation.role;
v_actual_role := v_invitation.role;
v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User');
v_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
v_student_id := NEW.raw_user_meta_data->>'student_id';
v_sport := NEW.raw_user_meta_data->>'sport';
v_program_year := CASE 
WHEN NEW.raw_user_meta_data->>'program_year' IS NOT NULL 
THEN (NEW.raw_user_meta_data->>'program_year')::integer
ELSE NULL
END;

-- Mark invitation as used
UPDATE invitation_tokens
SET used = true, used_at = now()
WHERE id = v_invitation.id;

RAISE LOG 'Marked invitation as used for: %', NEW.email;
ELSE
-- No invitation, use user metadata
RAISE LOG 'No invitation found for: %, using metadata', NEW.email;
v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
v_actual_role := v_role;
v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User');
v_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
v_student_id := NEW.raw_user_meta_data->>'student_id';
v_sport := NEW.raw_user_meta_data->>'sport';
v_program_year := CASE 
WHEN NEW.raw_user_meta_data->>'program_year' IS NOT NULL 
THEN (NEW.raw_user_meta_data->>'program_year')::integer
ELSE NULL
END;
END IF;
EXCEPTION
WHEN OTHERS THEN
RAISE LOG 'Error checking invitation for %: %', NEW.email, SQLERRM;
-- Use defaults if invitation check fails
v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
v_actual_role := v_role;
v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User');
v_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
v_student_id := NEW.raw_user_meta_data->>'student_id';
v_sport := NEW.raw_user_meta_data->>'sport';
v_program_year := NULL;
END;

-- Insert user profile with determined values
BEGIN
RAISE LOG 'Attempting to insert profile for: % with role: %', NEW.email, v_role;

INSERT INTO public.profiles (
id, 
email, 
full_name,
username,
role,
actual_role,
student_id,
sport,
program_year
)
VALUES (
NEW.id,
NEW.email,
v_full_name,
v_username,
v_role,
v_actual_role,
v_student_id,
v_sport,
v_program_year
)
ON CONFLICT (id) DO UPDATE SET
email = EXCLUDED.email,
full_name = EXCLUDED.full_name,
username = EXCLUDED.username,
role = EXCLUDED.role,
actual_role = EXCLUDED.actual_role,
student_id = EXCLUDED.student_id,
sport = EXCLUDED.sport,
program_year = EXCLUDED.program_year;

RAISE LOG 'Successfully created/updated profile for: %', NEW.email;
EXCEPTION
WHEN OTHERS THEN
RAISE LOG 'Error inserting profile for %: % (SQLSTATE: %)', NEW.email, SQLERRM, SQLSTATE;
END;

RETURN NEW;
END;
$$;

-- Fix prevent_student_role_modification
CREATE OR REPLACE FUNCTION prevent_student_role_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
-- Check if the user making the update is a student
IF EXISTS (
SELECT 1 FROM profiles
WHERE id = auth.uid()
AND actual_role = 'student'
AND id = NEW.id
) THEN
-- Students CAN change role field but CANNOT change actual_role or research_code
IF (OLD.actual_role IS DISTINCT FROM NEW.actual_role) THEN
RAISE EXCEPTION 'Students cannot modify actual_role field';
END IF;

IF (OLD.research_code IS DISTINCT FROM NEW.research_code) THEN
RAISE EXCEPTION 'Students cannot modify research_code field';
END IF;
END IF;

RETURN NEW;
END;
$$;

-- Fix check_critical_scores
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
critical_metrics := array_append(critical_metrics, 'Sleep Level: ' || NEW.stress_level || '/10');
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

RETURN NEW;
END;
$$;
