/*
  # Remove old coach_invitations trigger
  
  1. Changes
    - Drop the old trigger that references coach_invitations table
    - Drop the old link_coach_invitation_to_user function
    - We now use invitation_tokens table exclusively
  
  2. Notes
    - This prevents conflicts between two invitation systems
    - The handle_new_user function in invitation_tokens handles all invitation logic
*/

-- Drop the old trigger
DROP TRIGGER IF EXISTS on_auth_user_created_link_invitation ON auth.users;

-- Drop the old function
DROP FUNCTION IF EXISTS link_coach_invitation_to_user();