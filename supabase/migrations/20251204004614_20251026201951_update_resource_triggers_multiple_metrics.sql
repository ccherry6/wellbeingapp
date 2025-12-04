/*
  # Update Resource Triggers for Multiple Metrics and Email Notifications
  
  1. Changes
    - Add support for multiple metric triggers per resource
    - Add email notification field
    - Update trigger structure to use JSONB array for flexibility
  
  2. New Structure
    - triggers: JSONB array of trigger objects
      Each trigger object contains:
      {
        "metric_name": "sleep_quality",
        "condition": "less_than",
        "value": 4
      }
    - trigger_logic: 'any' or 'all' (any metric matches OR all metrics must match)
    - send_email: boolean to enable email notifications
    - email_subject: customizable email subject
    - email_message: customizable email message
*/

-- Add new columns for multiple metrics support
DO $$ 
BEGIN
  -- Add triggers column (JSONB array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resources' AND column_name = 'triggers'
  ) THEN
    ALTER TABLE resources ADD COLUMN triggers jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add trigger_logic column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resources' AND column_name = 'trigger_logic'
  ) THEN
    ALTER TABLE resources ADD COLUMN trigger_logic text DEFAULT 'any';
    ALTER TABLE resources ADD CONSTRAINT resources_trigger_logic_check
      CHECK (trigger_logic IN ('any', 'all'));
  END IF;

  -- Add email notification columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resources' AND column_name = 'send_email'
  ) THEN
    ALTER TABLE resources ADD COLUMN send_email boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resources' AND column_name = 'email_subject'
  ) THEN
    ALTER TABLE resources ADD COLUMN email_subject text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resources' AND column_name = 'email_message'
  ) THEN
    ALTER TABLE resources ADD COLUMN email_message text;
  END IF;
END $$;

-- Migrate existing single-metric triggers to new format
UPDATE resources
SET triggers = jsonb_build_array(
  jsonb_build_object(
    'metric_name', metric_name,
    'condition', trigger_condition,
    'value', trigger_value
  )
)
WHERE metric_name IS NOT NULL 
  AND trigger_condition IS NOT NULL 
  AND trigger_value IS NOT NULL
  AND (triggers IS NULL OR triggers = '[]'::jsonb);

-- Create index for faster trigger lookups
CREATE INDEX IF NOT EXISTS idx_resources_triggers_enabled 
  ON resources(trigger_enabled) 
  WHERE trigger_enabled = true;

-- Update resource_deployments to track email sent status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_deployments' AND column_name = 'email_sent'
  ) THEN
    ALTER TABLE resource_deployments ADD COLUMN email_sent boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_deployments' AND column_name = 'email_sent_at'
  ) THEN
    ALTER TABLE resource_deployments ADD COLUMN email_sent_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_deployments' AND column_name = 'triggered_metrics'
  ) THEN
    ALTER TABLE resource_deployments ADD COLUMN triggered_metrics jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add comment explaining the triggers format
COMMENT ON COLUMN resources.triggers IS 'Array of trigger objects: [{"metric_name": "sleep_quality", "condition": "less_than", "value": 4}]';
COMMENT ON COLUMN resources.trigger_logic IS 'Logic for multiple triggers: "any" (OR) or "all" (AND)';
COMMENT ON COLUMN resources.send_email IS 'Whether to send email notification when resource is deployed';