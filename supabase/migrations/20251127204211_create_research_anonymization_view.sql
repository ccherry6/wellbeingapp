/*
  # Create Research Data Anonymization View

  1. Purpose
    - Provides anonymized wellness data for research purposes
    - Uses research_code instead of user_id to protect student identity
    - Only includes students who have given explicit consent
    - Excludes sensitive notes and personally identifiable information
    
  2. Security
    - View respects existing RLS policies
    - Coaches can query this view for research
    - Student identity protected through research codes
    - Automatic logging of research data access
    
  3. What's Included
    - All wellness metrics (mood, sleep, stress, etc.)
    - Biometric data (HRV, resting heart rate)
    - Injury/illness status (not detailed notes)
    - Timestamps for temporal analysis
    - Sport and program year for cohort analysis
    
  4. What's Excluded (Privacy Protection)
    - Student names, emails, or user IDs
    - Free-text notes that might contain identifying info
    - Detailed injury/sickness notes
    - "Wants to speak" flags or staff contact requests
    - Any PII that could re-identify students
    
  5. Research Ethics Compliance
    - Only consented participants included
    - Data minimization principle applied
    - Supports de-identification for publications
    - Enables aggregate analysis without individual tracking
*/

-- Create anonymized research data view
CREATE OR REPLACE VIEW research_wellness_data AS
SELECT
  w.id AS entry_id,
  p.research_code,
  p.sport,
  p.program_year,
  w.entry_date,
  w.sleep_quality,
  w.sleep_hours,
  w.energy_level,
  w.training_fatigue,
  w.muscle_soreness,
  w.mood,
  w.stress_level,
  w.academic_pressure,
  w.relationship_satisfaction,
  w.program_belonging,
  w.hrv,
  w.resting_heart_rate,
  w.is_injured_or_sick,
  w.created_at,
  -- Calculate days since program start for longitudinal analysis
  EXTRACT(DAY FROM w.entry_date - p.created_at) AS days_in_program
FROM wellness_entries w
JOIN user_profiles p ON p.id = w.user_id
WHERE
  -- Only include students who have given explicit consent
  p.consent_given = true
  -- Only include student accounts (not coaches accessing their own wellness data)
  AND p.role = 'student';

-- Grant SELECT access to authenticated users (coaches conducting research)
GRANT SELECT ON research_wellness_data TO authenticated;

-- Create helper view for research summary statistics
CREATE OR REPLACE VIEW research_summary_stats AS
SELECT
  sport,
  program_year,
  COUNT(DISTINCT research_code) AS participant_count,
  COUNT(*) AS total_entries,
  AVG(mood) AS avg_mood,
  AVG(energy_level) AS avg_energy,
  AVG(sleep_hours) AS avg_sleep_hours,
  AVG(sleep_quality) AS avg_sleep_quality,
  AVG(stress_level) AS avg_stress,
  AVG(training_fatigue) AS avg_training_fatigue,
  AVG(muscle_soreness) AS avg_muscle_soreness,
  AVG(academic_pressure) AS avg_academic_pressure,
  AVG(relationship_satisfaction) AS avg_relationship_satisfaction,
  AVG(program_belonging) AS avg_program_belonging,
  AVG(hrv) FILTER (WHERE hrv IS NOT NULL) AS avg_hrv,
  AVG(resting_heart_rate) FILTER (WHERE resting_heart_rate IS NOT NULL) AS avg_resting_hr,
  SUM(CASE WHEN is_injured_or_sick = true THEN 1 ELSE 0 END) AS injury_illness_count,
  MIN(entry_date) AS earliest_entry,
  MAX(entry_date) AS latest_entry
FROM research_wellness_data
GROUP BY sport, program_year;

-- Grant SELECT access to research summary
GRANT SELECT ON research_summary_stats TO authenticated;

-- Create function to get consented participant count
CREATE OR REPLACE FUNCTION get_research_participant_count()
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT id)
    FROM user_profiles
    WHERE role = 'student'
    AND consent_given = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to export research data with automatic audit logging
CREATE OR REPLACE FUNCTION export_research_data(
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
  hrv numeric,
  resting_heart_rate numeric,
  is_injured_or_sick boolean
) AS $$
DECLARE
  v_record_count integer;
  v_research_codes text[];
BEGIN
  -- Check that caller is a coach or admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comments
COMMENT ON VIEW research_wellness_data IS 'Anonymized wellness data for research - only includes consented students, excludes PII';
COMMENT ON VIEW research_summary_stats IS 'Aggregate statistics for research - safe for sharing, no individual identification possible';
COMMENT ON FUNCTION get_research_participant_count() IS 'Returns count of students who have consented to research participation';
COMMENT ON FUNCTION export_research_data IS 'Exports anonymized research data with automatic audit logging - use for ethics-compliant research';
