/*
  # Add Injury/Sickness Fields to Wellness Entries

  1. New Columns
    - `is_injured_or_sick` (boolean) - Indicates if student is currently injured or sick
    - `injury_sickness_notes` (text) - Additional details about injury or sickness
    
  2. Changes
    - Adds nullable columns to wellness_entries table
    - Allows students to flag health concerns in their check-ins
*/

-- Add injury/sickness tracking fields
ALTER TABLE wellness_entries 
ADD COLUMN IF NOT EXISTS is_injured_or_sick boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS injury_sickness_notes text;

-- Add comment for documentation
COMMENT ON COLUMN wellness_entries.is_injured_or_sick IS 'Indicates if the student is currently injured or sick';
COMMENT ON COLUMN wellness_entries.injury_sickness_notes IS 'Additional details about injury or sickness if applicable';
