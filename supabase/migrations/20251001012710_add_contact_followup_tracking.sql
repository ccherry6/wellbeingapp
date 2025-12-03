/*
  # Add Contact Follow-up Tracking

  1. Changes
    - Add `contact_status` field to track follow-up status for speak requests
    - Add `contacted_by` field to track who handled the contact
    - Add `contacted_at` field to track when contact was made
    - Add `contact_notes` field for follow-up notes

  2. Security
    - Only coaches and admins can update contact status fields
*/

-- Add contact follow-up tracking columns to wellness_entries
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wellness_entries' AND column_name = 'contact_status'
  ) THEN
    ALTER TABLE wellness_entries 
    ADD COLUMN contact_status text CHECK (contact_status IN ('pending', 'contacted', 'scheduled', 'completed')) DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wellness_entries' AND column_name = 'contacted_by'
  ) THEN
    ALTER TABLE wellness_entries 
    ADD COLUMN contacted_by uuid REFERENCES user_profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wellness_entries' AND column_name = 'contacted_at'
  ) THEN
    ALTER TABLE wellness_entries 
    ADD COLUMN contacted_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wellness_entries' AND column_name = 'contact_notes'
  ) THEN
    ALTER TABLE wellness_entries 
    ADD COLUMN contact_notes text;
  END IF;
END $$;

-- Create index for faster queries on contact status
CREATE INDEX IF NOT EXISTS idx_wellness_entries_contact_status 
ON wellness_entries(contact_status) 
WHERE wants_to_speak = true;