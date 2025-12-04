/*
  # Add Voluntary Consent Tracking

  1. Changes to user_profiles table
    - Add `consent_given` (boolean, nullable) - tracks if student explicitly consented
    - Add `consent_date` (timestamptz, nullable) - when consent was given
    - Add `consent_version` (text, nullable) - tracks consent text version
    - Add `can_skip_checkin` (boolean, default true) - allows voluntary skipping

  2. Create consent_log table
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to user_profiles)
    - `consent_given` (boolean) - true if consented, false if declined
    - `consent_version` (text) - version of consent text shown
    - `session_id` (text, nullable) - browser session identifier
    - `created_at` (timestamptz) - timestamp of consent action

  3. Security
    - Enable RLS on consent_log table
    - Users can read their own consent log
    - Coaches and admins can read all consent logs for reporting

  4. Notes
    - Consent is completely voluntary
    - Skipping check-ins has no consequences
    - Maintains audit trail for research ethics compliance
*/

-- Add consent tracking fields to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'consent_given'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN consent_given boolean DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'consent_date'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN consent_date timestamptz DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'consent_version'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN consent_version text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'can_skip_checkin'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN can_skip_checkin boolean DEFAULT true;
  END IF;
END $$;

-- Create consent_log table for audit trail
CREATE TABLE IF NOT EXISTS consent_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  consent_given boolean NOT NULL,
  consent_version text NOT NULL DEFAULT 'v1.0',
  session_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on consent_log
ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own consent log" ON consent_log;
DROP POLICY IF EXISTS "Users can insert own consent log" ON consent_log;
DROP POLICY IF EXISTS "Coaches can read all consent logs" ON consent_log;

-- Students can read their own consent log
CREATE POLICY "Users can read own consent log"
  ON consent_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Students can insert their own consent log entries
CREATE POLICY "Users can insert own consent log"
  ON consent_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Coaches and admins can read all consent logs for reporting
CREATE POLICY "Coaches can read all consent logs"
  ON consent_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('coach', 'admin')
    )
  );

-- Add helpful comment
COMMENT ON TABLE consent_log IS 'Audit trail of voluntary consent actions for research ethics compliance';
COMMENT ON COLUMN user_profiles.consent_given IS 'Whether student has given voluntary consent to participate';
COMMENT ON COLUMN user_profiles.can_skip_checkin IS 'Students can always skip check-ins without consequences';