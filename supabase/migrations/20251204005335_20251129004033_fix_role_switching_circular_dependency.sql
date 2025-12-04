/*
  # Fix Role Switching - Remove Circular Dependency

  This migration fixes the role switching issue caused by the prevent_student_role_modification trigger.
  
  ## Problem
  
  The trigger checks if `user_profiles.role = 'student'` to determine if the user is a student,
  but when switching views, we're changing that exact field, creating a circular dependency.

  ## Solution
  
  1. Modify the trigger to check `actual_role` instead of `role`
  2. Allow students to modify their `role` field (for view switching)
  3. Keep `actual_role` and `research_code` protected for students

  ## Security
  
  - Students can switch between views by changing `role` field
  - Students still cannot modify `actual_role` or `research_code`
  - Coaches and admins have full control over their profiles
*/

-- Drop and recreate the trigger function with corrected logic
CREATE OR REPLACE FUNCTION prevent_student_role_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user making the update is a student (using actual_role, not role)
  IF EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND actual_role = 'student'  -- Changed from 'role' to 'actual_role'
    AND id = NEW.id
  ) THEN
    -- Students CAN change role field (for view switching)
    -- But CANNOT change actual_role or research_code
    
    IF (OLD.actual_role IS DISTINCT FROM NEW.actual_role) THEN
      RAISE EXCEPTION 'Students cannot modify actual_role field';
    END IF;
    
    IF (OLD.research_code IS DISTINCT FROM NEW.research_code) THEN
      RAISE EXCEPTION 'Students cannot modify research_code field';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger itself doesn't need to be recreated, just the function