/*
  # Create resources table for Resource Management

  1. New Tables
    - `resources`
      - `id` (uuid, primary key)
      - `title` (text) - Resource name
      - `description` (text) - Detailed description
      - `category` (enum) - mental_health, physical_health, academic, emergency, other
      - `resource_type` (enum) - link, phone, document, video
      - `url` (text, optional) - For links, documents, videos
      - `phone_number` (text, optional) - For phone contacts
      - `is_emergency` (boolean) - Flag for emergency resources
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `resources` table
    - Add policies for authenticated users to read resources
    - Add policies for admin/coach to manage resources
*/

CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('mental_health', 'physical_health', 'academic', 'emergency', 'other')),
  resource_type text NOT NULL CHECK (resource_type IN ('link', 'phone', 'document', 'video')),
  url text,
  phone_number text,
  is_emergency boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view resources"
  ON resources
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and coach can insert resources"
  ON resources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'coach')
    )
  );

CREATE POLICY "Admin and coach can update resources"
  ON resources
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'coach')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'coach')
    )
  );

CREATE POLICY "Admin and coach can delete resources"
  ON resources
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'coach')
    )
  );
