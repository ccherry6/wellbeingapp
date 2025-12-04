/*
  # Create Audit Log System

  1. New Table: data_access_log
    - Tracks all sensitive data access for compliance and security
    - Records: who accessed what, when, and from where
    - Immutable audit trail (INSERT only, no UPDATE/DELETE)
    
  2. Security
    - Enable RLS on audit log table
    - Only admins can read audit logs
    - System can insert logs via triggers
    - No one can update or delete audit logs
    
  3. Purpose
    - Compliance with healthcare and research data regulations
    - Security monitoring and anomaly detection
    - Forensic investigation if data breach suspected
    - Demonstrates duty of care for student wellbeing data
    
  4. What Gets Logged
    - Research data exports
    - Bulk wellness entry queries by coaches
    - Profile updates by coaches
    - Sensitive field access (notes, injury details)
*/

-- Create data_access_log table
CREATE TABLE IF NOT EXISTS data_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('research_export', 'bulk_query', 'profile_update', 'sensitive_access', 'data_deletion')),
  table_name text NOT NULL,
  record_count integer DEFAULT 1,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_data_access_log_user_id ON data_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_log_created_at ON data_access_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_access_log_action_type ON data_access_log(action_type);

-- Enable RLS
ALTER TABLE data_access_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can read audit logs" ON data_access_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON data_access_log;

-- Only admins can read audit logs (for compliance and security monitoring)
CREATE POLICY "Admins can read audit logs"
  ON data_access_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- System and authenticated users can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON data_access_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- NO UPDATE OR DELETE POLICIES - audit logs are immutable

-- Helper function to log data access
CREATE OR REPLACE FUNCTION log_data_access(
  p_user_id uuid,
  p_action_type text,
  p_table_name text,
  p_record_count integer DEFAULT 1,
  p_details jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO data_access_log (
    user_id,
    action_type,
    table_name,
    record_count,
    details
  ) VALUES (
    p_user_id,
    p_action_type,
    p_table_name,
    p_record_count,
    p_details
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comments
COMMENT ON TABLE data_access_log IS 'Immutable audit trail of sensitive data access - critical for compliance and security';
COMMENT ON COLUMN data_access_log.action_type IS 'Type of data access: research_export, bulk_query, profile_update, sensitive_access, data_deletion';
COMMENT ON COLUMN data_access_log.record_count IS 'Number of records accessed in this action';
COMMENT ON COLUMN data_access_log.details IS 'Additional context about the access (filters, reasons, etc)';
COMMENT ON FUNCTION log_data_access IS 'Helper function to log data access events - use in application code for compliance';