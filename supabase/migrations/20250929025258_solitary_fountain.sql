-- Force disable RLS and remove all policies for training_checkins table

-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can read own training checkins" ON training_checkins;
DROP POLICY IF EXISTS "Users can insert own training checkins" ON training_checkins;
DROP POLICY IF EXISTS "Users can update own training checkins" ON training_checkins;
DROP POLICY IF EXISTS "Users can delete own training checkins" ON training_checkins;
DROP POLICY IF EXISTS "Coaches can read all training checkins" ON training_checkins;

-- Disable RLS completely
ALTER TABLE training_checkins DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'training_checkins';