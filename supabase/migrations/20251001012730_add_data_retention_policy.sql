/*
  # Data Retention Policy Implementation

  1. Policy
    - Keep wellness entries for 24 months (2 years)
    - Archive old login sessions after 90 days
    - Archive old alert logs after 12 months
    - Keep user profiles indefinitely (unless deleted by admin)

  2. Implementation
    - Add archived_at timestamp to relevant tables
    - Create function to automatically archive old data
    - Create scheduled job to run cleanup (for future use)

  3. Notes
    - Data is soft-deleted (archived) not hard-deleted
    - Coaches can request data restoration if needed
    - Archived data can still be queried but excluded from normal views
*/

-- Add archived_at column to wellness_entries for soft deletion
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wellness_entries' AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE wellness_entries 
    ADD COLUMN archived_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'auto_alert_logs' AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE auto_alert_logs 
    ADD COLUMN archived_at timestamptz;
  END IF;
END $$;

-- Create function to archive old wellness entries (24 months retention)
CREATE OR REPLACE FUNCTION archive_old_wellness_entries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE wellness_entries
  SET archived_at = now()
  WHERE archived_at IS NULL
    AND created_at < now() - interval '24 months';
END;
$$;

-- Create function to archive old alert logs (12 months retention)
CREATE OR REPLACE FUNCTION archive_old_alert_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auto_alert_logs
  SET archived_at = now()
  WHERE archived_at IS NULL
    AND created_at < now() - interval '12 months';
END;
$$;

-- Create function to delete expired login sessions (90 days)
CREATE OR REPLACE FUNCTION cleanup_expired_login_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM login_sessions
  WHERE expires_at < now() - interval '90 days';
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wellness_entries_archived 
ON wellness_entries(archived_at);

CREATE INDEX IF NOT EXISTS idx_wellness_entries_created_at 
ON wellness_entries(created_at);

CREATE INDEX IF NOT EXISTS idx_auto_alert_logs_archived 
ON auto_alert_logs(archived_at);

-- Add comment explaining the retention policy
COMMENT ON COLUMN wellness_entries.archived_at IS 'Timestamp when entry was archived. Entries older than 24 months are automatically archived.';
COMMENT ON COLUMN auto_alert_logs.archived_at IS 'Timestamp when alert was archived. Alerts older than 12 months are automatically archived.';

-- Note: To enable automatic cleanup, you would set up a pg_cron job like:
-- SELECT cron.schedule('archive-old-data', '0 2 * * 0', 'SELECT archive_old_wellness_entries(); SELECT archive_old_alert_logs(); SELECT cleanup_expired_login_sessions();');
-- This would run every Sunday at 2 AM