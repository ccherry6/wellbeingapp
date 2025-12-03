/*
  # Add injury/sickness tracking fields

  1. Changes
    - Add `is_injured_or_sick` boolean column with default false
    - Add `injury_sickness_notes` text column (nullable)
  
  2. Security
    - No RLS changes needed as these columns follow existing table policies
*/

-- Add the injury/sickness tracking columns to wellness_entries table
DO $$
BEGIN
  -- Add is_injured_or_sick column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wellness_entries' AND column_name = 'is_injured_or_sick'
  ) THEN
    ALTER TABLE wellness_entries ADD COLUMN is_injured_or_sick boolean DEFAULT false;
  END IF;

  -- Add injury_sickness_notes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wellness_entries' AND column_name = 'injury_sickness_notes'
  ) THEN
    ALTER TABLE wellness_entries ADD COLUMN injury_sickness_notes text;
  END IF;
END $$;