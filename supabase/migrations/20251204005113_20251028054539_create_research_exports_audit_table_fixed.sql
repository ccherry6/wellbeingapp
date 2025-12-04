/*
  # Create Research Exports Audit Table

  1. New Tables
    - `research_exports`
      - `id` (uuid, primary key) - Unique identifier for each export
      - `exported_by` (uuid, foreign key to auth.users) - Coach who performed the export
      - `export_date` (timestamptz) - When the export was generated
      - `start_date` (date) - Start of date range for exported data
      - `end_date` (date) - End of date range for exported data
      - `participant_count` (integer) - Number of research participants included
      - `research_codes` (text[]) - Array of research codes included in export
      - `fields_exported` (text[]) - Which data fields were included
      - `notes` (text) - Optional notes about the export
      - `created_at` (timestamptz) - Timestamp of record creation
  
  2. Security
    - Enable RLS on `research_exports` table
    - Only authenticated coaches can insert export records
    - Only authenticated coaches can view export history
  
  3. Purpose
    - Maintains audit trail of all research data exports
    - Supports compliance with research ethics requirements
    - Allows tracking of when and what data was exported for analysis
*/

-- Create research_exports table
CREATE TABLE IF NOT EXISTS research_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exported_by uuid REFERENCES auth.users(id) NOT NULL,
  export_date timestamptz DEFAULT now() NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  participant_count integer DEFAULT 0 NOT NULL,
  research_codes text[] DEFAULT '{}' NOT NULL,
  fields_exported text[] DEFAULT '{}' NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE research_exports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Coaches can create export records" ON research_exports;
DROP POLICY IF EXISTS "Coaches can view export records" ON research_exports;

-- Policy: Coaches can insert export records
CREATE POLICY "Coaches can create export records"
  ON research_exports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'coach'
    )
  );

-- Policy: Coaches can view export history
CREATE POLICY "Coaches can view export records"
  ON research_exports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'coach'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS research_exports_exported_by_idx ON research_exports(exported_by);
CREATE INDEX IF NOT EXISTS research_exports_export_date_idx ON research_exports(export_date DESC);