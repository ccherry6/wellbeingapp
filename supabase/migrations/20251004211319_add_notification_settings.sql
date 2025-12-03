/*
  # Add Notification Settings Table

  1. New Tables
    - `notification_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `browser_notifications` (boolean, default true)
      - `email_notifications` (boolean, default true)
      - `notification_time` (time, default 08:00:00)
      - `timezone` (text, default 'Australia/Sydney')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `notification_settings` table
    - Add policy for users to read their own settings
    - Add policy for users to update their own settings
    - Add policy for users to insert their own settings

  3. Important Notes
    - Each user can have only one notification settings record (unique constraint)
    - Notification time is stored in HH:MM:SS format
    - Timezone defaults to Australia/Sydney for BDC students
*/

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  browser_notifications boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  notification_time time DEFAULT '08:00:00',
  timezone text DEFAULT 'Australia/Sydney',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own notification settings
CREATE POLICY "Users can read own notification settings"
  ON notification_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own notification settings
CREATE POLICY "Users can insert own notification settings"
  ON notification_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own notification settings
CREATE POLICY "Users can update own notification settings"
  ON notification_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_settings_updated_at();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id 
  ON notification_settings(user_id);