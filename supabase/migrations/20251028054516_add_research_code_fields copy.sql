/*
  # Add Research Code Fields to User Profiles

  1. Changes to `user_profiles` table
    - Add `research_code` (text, nullable) - Unique alphanumeric code for research participants (e.g., SA-001)
    - Add `research_participant` (boolean, default false) - Flag indicating active research participation
    - Add `research_notes` (text, nullable) - Internal notes for research tracking
    - Add unique constraint on research_code to prevent duplicates
  
  2. Security
    - No RLS changes needed - uses existing user_profiles policies
    - Only coaches can assign research codes (via existing UPDATE policies)
  
  3. Purpose
    - Enables manual assignment of anonymous research codes for ethics-approved studies
    - Maintains separation between school wellbeing monitoring and research data
    - Research codes allow anonymized data export while preserving coaching functionality
*/

-- Add research code fields to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'research_code'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN research_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'research_participant'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN research_participant boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'research_notes'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN research_notes text;
  END IF;
END $$;

-- Add unique constraint on research_code (only if value is not null)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_profiles_research_code_key'
  ) THEN
    ALTER TABLE user_profiles 
    ADD CONSTRAINT user_profiles_research_code_key 
    UNIQUE (research_code);
  END IF;
END $$;