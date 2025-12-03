/*
  # Disable Email Confirmation in Supabase

  1. Configuration Changes
    - Disable email confirmation requirement for new signups
    - Allow users to sign in immediately after registration
    - Update auth settings to bypass email verification

  2. Security
    - This is safe for internal applications where email verification isn't critical
    - Users can sign up and access the system immediately
*/

-- Disable email confirmation requirement
-- Note: This updates the auth configuration in Supabase
UPDATE auth.config 
SET 
  enable_signup = true,
  enable_confirmations = false
WHERE true;

-- Alternative approach: Update auth settings via SQL
-- This ensures email confirmation is disabled at the database level
INSERT INTO auth.config (enable_confirmations) 
VALUES (false) 
ON CONFLICT DO UPDATE SET enable_confirmations = false;

-- Confirm all existing unconfirmed users (if any)
UPDATE auth.users 
SET 
  email_confirmed_at = now(),
  confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- Create a function to auto-confirm new users
CREATE OR REPLACE FUNCTION auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm the user immediately
  NEW.email_confirmed_at = now();
  NEW.confirmed_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-confirm new users
DROP TRIGGER IF EXISTS auto_confirm_new_users ON auth.users;
CREATE TRIGGER auto_confirm_new_users
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_user();