/*
  # Add notification settings to user profiles

  1. Changes
    - Add notification_settings JSONB column to user_profiles table
    - Set default notification preferences
    - Add index for better performance

  2. Security
    - Users can only update their own notification settings
*/

-- Add notification settings column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'notification_settings'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN notification_settings JSONB DEFAULT '{
      "browser_notifications": true,
      "email_notifications": true,
      "notification_time": "09:00"
    }'::jsonb;
  END IF;
END $$;

-- Add index for notification settings queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_notifications 
ON user_profiles USING GIN (notification_settings);

-- Update existing users with default notification settings
UPDATE user_profiles 
SET notification_settings = '{
  "browser_notifications": true,
  "email_notifications": true,
  "notification_time": "09:00"
}'::jsonb
WHERE notification_settings IS NULL;