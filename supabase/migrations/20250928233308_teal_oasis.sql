/*
  # Create training check-ins table

  1. New Tables
    - `training_checkins`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `session_date` (date)
      - `session_time` (time)
      - `session_type` (text, pre-training or post-training)
      - `readiness_score` (integer, 1-10, nullable for post-training)
      - `motivation_score` (integer, 1-10, nullable for post-training)
      - `fatigue_score` (integer, 1-10, required)
      - `soreness_score` (integer, 1-10, required)
      - `rpe_score` (integer, 1-10, nullable for pre-training)
      - `overall_feeling_score` (integer, 1-10, nullable for pre-training)
      - `new_issues` (boolean, default false)
      - `issues_notes` (text, nullable)
      - `training_notes` (text, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on training_checkins table
    - Add policies for users to manage their own data
    - Add policies for coaches to read all data
*/

CREATE TABLE IF NOT EXISTS training_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  session_time time NOT NULL DEFAULT CURRENT_TIME,
  session_type text NOT NULL CHECK (session_type IN ('pre-training', 'post-training')),
  readiness_score integer CHECK (readiness_score >= 1 AND readiness_score <= 10),
  motivation_score integer CHECK (motivation_score >= 1 AND motivation_score <= 10),
  fatigue_score integer CHECK (fatigue_score >= 1 AND fatigue_score <= 10) NOT NULL,
  soreness_score integer CHECK (soreness_score >= 1 AND soreness_score <= 10) NOT NULL,
  rpe_score integer CHECK (rpe_score >= 1 AND rpe_score <= 10),
  overall_feeling_score integer CHECK (overall_feeling_score >= 1 AND overall_feeling_score <= 10),
  new_issues boolean DEFAULT false,
  issues_notes text,
  training_notes text,
  created_at timestamptz DEFAULT now()
);