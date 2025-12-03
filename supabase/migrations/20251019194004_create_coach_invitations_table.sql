/*
  # Coach Invitations Management System

  ## Overview
  Creates a system to track coach access invitations sent by the head coach, allowing them to manage and revoke coach permissions.

  ## New Tables
  - `coach_invitations`
    - `id` (uuid, primary key) - Unique invitation identifier
    - `invited_by` (uuid, foreign key) - Head coach who sent the invitation (references auth.users)
    - `invited_email` (text) - Email address of invited coach
    - `invited_user_id` (uuid, nullable, foreign key) - User ID once they sign up (references auth.users)
    - `status` (text) - Invitation status: 'pending', 'accepted', 'revoked'
    - `created_at` (timestamptz) - When invitation was sent
    - `accepted_at` (timestamptz, nullable) - When invitation was accepted
    - `revoked_at` (timestamptz, nullable) - When access was revoked

  ## Security
  - Enable RLS on `coach_invitations` table
  - Head coach (ccherry@thrivewellbeing.me) can view all invitations they sent
  - Head coach can insert new invitations
  - Head coach can update invitations to revoke access
  - Regular coaches can view their own invitation record
*/

-- Create coach_invitations table
CREATE TABLE IF NOT EXISTS coach_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invited_by uuid REFERENCES auth.users(id) NOT NULL,
  invited_email text NOT NULL,
  invited_user_id uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  revoked_at timestamptz
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_coach_invitations_invited_by ON coach_invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_coach_invitations_invited_email ON coach_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_coach_invitations_invited_user_id ON coach_invitations(invited_user_id);

-- Enable RLS
ALTER TABLE coach_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Head coach can view all invitations they sent
CREATE POLICY "Head coach can view own invitations"
  ON coach_invitations
  FOR SELECT
  TO authenticated
  USING (
    invited_by = auth.uid()
  );

-- Policy: Head coach can create invitations
CREATE POLICY "Head coach can create invitations"
  ON coach_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

-- Policy: Head coach can update invitations (to revoke access)
CREATE POLICY "Head coach can update own invitations"
  ON coach_invitations
  FOR UPDATE
  TO authenticated
  USING (invited_by = auth.uid())
  WITH CHECK (invited_by = auth.uid());

-- Policy: Coaches can view their own invitation record
CREATE POLICY "Coaches can view own invitation"
  ON coach_invitations
  FOR SELECT
  TO authenticated
  USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    invited_user_id = auth.uid()
  );

-- Function to automatically update invited_user_id when a user signs up
CREATE OR REPLACE FUNCTION link_coach_invitation_to_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's a pending invitation for this email
  UPDATE coach_invitations
  SET 
    invited_user_id = NEW.id,
    status = 'accepted',
    accepted_at = now()
  WHERE 
    invited_email = NEW.email AND
    status = 'pending' AND
    invited_user_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to link invitation when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_link_invitation ON auth.users;
CREATE TRIGGER on_auth_user_created_link_invitation
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION link_coach_invitation_to_user();