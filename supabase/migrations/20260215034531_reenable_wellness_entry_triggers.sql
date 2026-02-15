/*
  # Re-enable Wellness Entry Triggers
  
  The triggers were temporarily disabled to diagnose issues.
  Now that we've fixed:
  1. The trigger functions to handle errors gracefully (20260215031145)
  2. The auto_alert_logs INSERT policy (20260215031210)
  
  We can safely re-enable the triggers.
  
  ## Changes
  1. Re-enable trigger_check_critical_scores
  2. Re-enable wellness_metrics_alert_trigger
  
  ## Security
  - Triggers now have proper error handling to prevent blocking inserts
  - Auto_alert_logs table now has proper RLS INSERT policy
*/

-- Re-enable the triggers
ALTER TABLE wellness_entries ENABLE TRIGGER trigger_check_critical_scores;
ALTER TABLE wellness_entries ENABLE TRIGGER wellness_metrics_alert_trigger;
