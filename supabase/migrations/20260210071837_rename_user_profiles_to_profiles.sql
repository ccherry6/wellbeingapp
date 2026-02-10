/*
  # Rename user_profiles table to profiles

  ## Overview
  Renames the `user_profiles` table to `profiles` to simplify the codebase and align with Supabase conventions.
  This migration handles all dependent objects including foreign key constraints, RLS policies, triggers, and indexes.

  ## Changes
  1. **Table Rename**
     - Rename `user_profiles` table to `profiles`
  
  2. **Dependent Objects**
     - All foreign key constraints are automatically renamed by PostgreSQL
     - All RLS policies are automatically updated by PostgreSQL
     - All triggers are automatically updated by PostgreSQL
     - All indexes are automatically updated by PostgreSQL

  ## Security
  - RLS policies remain enabled and functional after rename
  - No data is lost or modified during rename
  - All existing permissions and constraints are preserved
*/

-- Rename the table from user_profiles to profiles
-- PostgreSQL automatically updates all dependent objects (foreign keys, triggers, RLS policies, etc.)
ALTER TABLE IF EXISTS user_profiles RENAME TO profiles;
