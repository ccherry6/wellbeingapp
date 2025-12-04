/*
  # Add metadata fields to coach_invitations table

  1. Changes
    - Add `role` field to store the invited user's role (coach, student, admin)
    - Add `full_name` field to store the invited user's name
    - Add `sport` field for students
    - Add `student_id` field for students  
    - Add `program_year` field for students
    - Add `expires_at` field for invitation expiration (7 days)

  2. Purpose
    These fields allow the invitation to pre-populate signup data and
    automatically assign the correct role when a user registers via invitation.
*/

-- Add new fields to coach_invitations table
ALTER TABLE public.coach_invitations 
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'coach' CHECK (role IN ('student', 'coach', 'admin')),
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS sport text,
ADD COLUMN IF NOT EXISTS student_id text,
ADD COLUMN IF NOT EXISTS program_year integer,
ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT (now() + interval '7 days');

-- Create index for token-based lookups
CREATE INDEX IF NOT EXISTS idx_coach_invitations_id ON coach_invitations(id);