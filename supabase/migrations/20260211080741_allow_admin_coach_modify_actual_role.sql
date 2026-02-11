/*
  # Allow Admins and Coaches to Modify actual_role

  1. Problem
    - The prevent_actual_role_change trigger blocks ALL updates to actual_role
    - This prevents admins/coaches from toggling user roles in the UI
    - Results in "Cannot modify actual_role field" error (P0001)

  2. Solution
    - Update the prevent_actual_role_change function to check who is making the update
    - Allow admins and coaches to modify actual_role
    - Only prevent students from modifying their own actual_role
    - The enforce_student_field_protection trigger already handles student restrictions

  3. Security
    - Students still cannot modify their own actual_role (via prevent_student_role_modification)
    - Coaches and admins can update actual_role for user management
    - Maintains all existing RLS policies
*/

CREATE OR REPLACE FUNCTION prevent_actual_role_change()
RETURNS TRIGGER AS $$
DECLARE
  v_current_user_role text;
BEGIN
  -- Allow initial insert
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;
  
  -- On update, check if actual_role is being changed
  IF TG_OP = 'UPDATE' AND OLD.actual_role IS DISTINCT FROM NEW.actual_role THEN
    -- Get the role of the user making the update
    SELECT actual_role INTO v_current_user_role
    FROM profiles
    WHERE id = auth.uid();
    
    -- Allow admins and coaches to modify actual_role
    IF v_current_user_role IN ('admin', 'coach') THEN
      RETURN NEW;
    END IF;
    
    -- Block everyone else (including students)
    RAISE EXCEPTION 'Cannot modify actual_role field';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS prevent_actual_role_change_trigger ON profiles;

CREATE TRIGGER prevent_actual_role_change_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_actual_role_change();
