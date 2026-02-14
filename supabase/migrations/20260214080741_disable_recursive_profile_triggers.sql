/*
  # Disable Recursive Profile Triggers

  This migration disables triggers on the profiles table that cause infinite
  recursion by querying the profiles table within their execution.

  ## Changes
  1. Drop prevent_student_role_modification trigger
  2. Drop prevent_actual_role_change trigger
  3. Drop their associated functions

  ## Security Note
  This removes trigger-based protection on actual_role and research_code fields.
  Application-level validation should be implemented to protect these fields.
*/

-- Drop triggers first
DROP TRIGGER IF EXISTS enforce_student_field_protection ON profiles;
DROP TRIGGER IF EXISTS prevent_actual_role_change_trigger ON profiles;

-- Drop the functions
DROP FUNCTION IF EXISTS prevent_student_role_modification() CASCADE;
DROP FUNCTION IF EXISTS prevent_actual_role_change() CASCADE;

-- Verify no triggers remain on profiles
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname = 'profiles'
    AND NOT t.tgisinternal;
  
  IF trigger_count > 0 THEN
    RAISE EXCEPTION 'Triggers still exist on profiles table';
  END IF;
  
  RAISE NOTICE 'All triggers successfully removed from profiles table';
END $$;
