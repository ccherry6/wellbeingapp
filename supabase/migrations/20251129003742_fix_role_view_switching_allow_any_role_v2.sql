/*
  # Fix Role View Switching - Allow Any Role Value

  This migration fixes the role switching functionality by allowing users to set their `role` field
  to any value (for view switching), while still protecting the `actual_role` field.

  ## Changes
  
  1. Drop the overly restrictive policy that only allows `role = actual_role`
  2. Create a new policy that allows users to update their `role` field to ANY value
  3. Protect `actual_role` using a database CHECK constraint instead of RLS
  4. The trigger ensures `actual_role` can never be modified after creation

  ## Security
  
  - Users can switch between student/coach VIEWS freely (by changing `role`)
  - The `actual_role` field remains immutable via trigger
  - RLS policies elsewhere use `actual_role` for authorization, not `role`
*/

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can update own profile with role restrictions" ON user_profiles;

-- Create a simple policy that allows users to update their own profile
-- The actual_role protection is handled by a trigger below
CREATE POLICY "Users can update own profile and switch views"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create a trigger to prevent actual_role from being modified
CREATE OR REPLACE FUNCTION prevent_actual_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow initial insert
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;
  
  -- On update, ensure actual_role hasn't changed
  IF TG_OP = 'UPDATE' AND OLD.actual_role IS DISTINCT FROM NEW.actual_role THEN
    RAISE EXCEPTION 'Cannot modify actual_role field';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS prevent_actual_role_change_trigger ON user_profiles;

-- Create the trigger
CREATE TRIGGER prevent_actual_role_change_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_actual_role_change();
