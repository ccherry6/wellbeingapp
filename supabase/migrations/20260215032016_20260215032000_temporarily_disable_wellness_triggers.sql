/*
  # Temporarily Disable Wellness Entry Triggers
  
  Temporarily disabling triggers to diagnose if they're causing insert failures.
  This will help us isolate the issue.
*/

-- Disable the triggers temporarily
ALTER TABLE wellness_entries DISABLE TRIGGER trigger_check_critical_scores;
ALTER TABLE wellness_entries DISABLE TRIGGER wellness_metrics_alert_trigger;
