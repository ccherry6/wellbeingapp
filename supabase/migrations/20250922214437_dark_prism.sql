/*
  # Add speak-to-someone functionality columns

  1. Changes
    - Add `wants_to_speak` boolean column with default false
    - Add `speak_to_who` text column (nullable)
    - Add `speak_to_email` text column (nullable)
  
  2. Security
    - No RLS changes needed as these columns follow existing table policies
*/

-- Add the missing columns to wellness_entries table
DO $$
BEGIN
  -- Add wants_to_speak column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wellness_entries' AND column_name = 'wants_to_speak'
  ) THEN
    ALTER TABLE wellness_entries ADD COLUMN wants_to_speak boolean DEFAULT false;
  END IF;

  -- Add speak_to_who column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wellness_entries' AND column_name = 'speak_to_who'
  ) THEN
    ALTER TABLE wellness_entries ADD COLUMN speak_to_who text;
  END IF;

  -- Add speak_to_email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wellness_entries' AND column_name = 'speak_to_email'
  ) THEN
    ALTER TABLE wellness_entries ADD COLUMN speak_to_email text;
  END IF;
END $$;