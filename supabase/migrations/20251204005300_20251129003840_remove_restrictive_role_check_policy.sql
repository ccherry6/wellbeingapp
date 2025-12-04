/*
  # Remove Restrictive Role Check Policy

  This migration removes the overly restrictive policy that prevents students from switching views.
  
  ## Changes
  
  1. Drop "Users can update own profile with role check" policy
  2. Keep only "Users can update own profile and switch views" which allows role field updates
  3. The actual_role field is protected by the trigger created in the previous migration

  ## Security
  
  - Users can update their `role` field freely (for view switching)
  - The `actual_role` field is immutable via trigger
  - RLS still ensures users can only update their own profile
*/

-- Drop the restrictive policy that blocks students from changing role field
DROP POLICY IF EXISTS "Users can update own profile with role check" ON user_profiles;