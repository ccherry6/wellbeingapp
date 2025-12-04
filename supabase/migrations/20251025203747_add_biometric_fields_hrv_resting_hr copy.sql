/*
  # Add Biometric Fields - HRV and Resting Heart Rate

  ## Overview
  Adds optional biometric tracking fields for students who use wearable devices (Whoop, Garmin, etc.)
  
  ## Changes
  1. New Columns Added to `wellness_entries` table:
     - `hrv` (integer, optional) - Heart Rate Variability in milliseconds
     - `resting_heart_rate` (integer, optional) - Resting heart rate in beats per minute
  
  ## Notes
  - Both fields are optional (nullable) as they're non-compulsory questions
  - Integer type is used as these are typically whole number measurements
  - No validation constraints added to allow flexibility in data entry
  - These metrics will be available for coach analytics and correlation analysis
*/

-- Add HRV and resting heart rate columns to wellness_entries table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wellness_entries' AND column_name = 'hrv'
  ) THEN
    ALTER TABLE wellness_entries ADD COLUMN hrv integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wellness_entries' AND column_name = 'resting_heart_rate'
  ) THEN
    ALTER TABLE wellness_entries ADD COLUMN resting_heart_rate integer;
  END IF;
END $$;