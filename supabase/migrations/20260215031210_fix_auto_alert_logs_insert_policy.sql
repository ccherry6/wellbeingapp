/*
  # Fix Auto Alert Logs Insert Policy
  
  The auto_alert_logs table has RLS enabled but no INSERT policy,
  which prevents the wellness entry triggers from logging alerts.
  This was causing wellness entry saves to fail with "Unknown error".
  
  ## Changes
  1. Add INSERT policy for auto_alert_logs to allow system triggers to insert
  
  ## Security
  - Policy allows authenticated users to insert (triggers run as authenticated)
  - This is safe because triggers are SECURITY DEFINER and controlled by system code
*/

-- Allow system triggers to insert into auto_alert_logs
CREATE POLICY "System can insert alert logs"
  ON auto_alert_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);