/*
  # Critical RLS Security Improvements

  1. Security Enhancements
    - Separate student and coach UPDATE policies for wellness_entries
    - Prevent students from modifying protected fields in user_profiles
    - Add DELETE policies with time restrictions
    - Add trigger to enforce field-level protection on user_profiles
    
  2. Changes to wellness_entries
    - Students can only update their own entries
    - Coaches/admins can update any wellness entry
    - Students can delete own entries within 24 hours (mistake correction)
    
  3. Changes to user_profiles  
    - Students cannot modify: role, actual_role, research_code
    - Trigger enforces this at database level
    - Coaches/admins have full update permissions
    
  4. Security Benefits
    - Prevents privilege escalation attacks
    - Maintains data integrity for research
    - Complies with data protection requirements
    - Allows students to correct recent mistakes
*/

-- ============================================================
-- WELLNESS ENTRIES - Improve UPDATE and DELETE policies
-- ============================================================

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update own wellness entries" ON wellness_entries;

-- Students can only update their own wellness entries
CREATE POLICY "Students can update own wellness entries"
  ON wellness_entries
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    NOT EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('coach', 'admin')
    )
  )
  WITH CHECK (
    user_id = auth.uid() AND
    NOT EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('coach', 'admin')
    )
  );

-- Coaches and admins can update any wellness entry
CREATE POLICY "Coaches can update all wellness entries"
  ON wellness_entries
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('coach', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('coach', 'admin')
    )
  );

-- Students can delete their own entries within 24 hours (to correct mistakes)
CREATE POLICY "Students can delete recent wellness entries"
  ON wellness_entries
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    created_at > (now() - interval '24 hours')
  );

-- Coaches can delete any wellness entry (for data management)
CREATE POLICY "Coaches can delete any wellness entry"
  ON wellness_entries
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('coach', 'admin')
    )
  );

-- ============================================================
-- USER PROFILES - Protect role and research fields
-- ============================================================

-- Drop existing update policy  
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Students can update their profile but with field protection via trigger
CREATE POLICY "Students can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id AND
    NOT EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('coach', 'admin')
    )
  )
  WITH CHECK (auth.uid() = id);

-- Coaches can update any user profile (including protected fields)
CREATE POLICY "Coaches can update all profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('coach', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('coach', 'admin')
    )
  );

-- ============================================================
-- TRIGGER: Prevent students from modifying protected fields
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_student_role_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user making the update is a student
  IF EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role = 'student'
    AND id = NEW.id
  ) THEN
    -- Prevent students from changing these protected fields
    IF (OLD.role IS DISTINCT FROM NEW.role) THEN
      RAISE EXCEPTION 'Students cannot modify role field';
    END IF;
    
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

-- Create trigger on user_profiles
DROP TRIGGER IF EXISTS enforce_student_field_protection ON user_profiles;
CREATE TRIGGER enforce_student_field_protection
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_student_role_modification();

-- ============================================================
-- Add helpful documentation
-- ============================================================

COMMENT ON FUNCTION prevent_student_role_modification() IS 'Prevents students from escalating privileges or modifying research codes - critical security control';
COMMENT ON TRIGGER enforce_student_field_protection ON user_profiles IS 'Enforces field-level security for student profile updates';
COMMENT ON COLUMN user_profiles.role IS 'User role - only coaches/admins can modify';
COMMENT ON COLUMN user_profiles.research_code IS 'Anonymized research identifier - only coaches/admins can modify';
