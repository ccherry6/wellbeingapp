/*
  # Complete BDC Wellbeing Database Schema Setup
  
  This script creates the entire database schema from scratch for a new Supabase project.
  
  1. New Tables
    - user_profiles (user information and roles)
    - wellness_entries (daily wellbeing responses)
    - login_sessions (QR code login sessions)
    - user_goals (student goals)
    - wellness_activities (wellness activities)
    - wellness_resources (wellness resources)
    - coach_alerts (coach alert configurations)
    - auto_alert_logs (critical alert logs)
  
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
  
  3. Functions and Triggers
    - Critical score checking function
    - New user handling function
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table first (other tables depend on it)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    full_name text,
    student_id text,
    sport text,
    role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'coach', 'admin')),
    program_year integer,
    created_at timestamptz DEFAULT now(),
    notification_settings jsonb DEFAULT '{"notification_time": "09:00", "email_notifications": true, "browser_notifications": true}'::jsonb
);

-- Create wellness_entries table
CREATE TABLE IF NOT EXISTS public.wellness_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    entry_date date NOT NULL,
    sleep_quality integer CHECK (sleep_quality >= 1 AND sleep_quality <= 10) NOT NULL,
    sleep_hours numeric CHECK (sleep_hours >= 0 AND sleep_hours <= 24) NOT NULL,
    energy_level integer CHECK (energy_level >= 1 AND energy_level <= 10) NOT NULL,
    training_fatigue integer CHECK (training_fatigue >= 1 AND training_fatigue <= 10) NOT NULL,
    muscle_soreness integer CHECK (muscle_soreness >= 1 AND muscle_soreness <= 10) NOT NULL,
    mood integer CHECK (mood >= 1 AND mood <= 10) NOT NULL,
    stress_level integer CHECK (stress_level >= 1 AND stress_level <= 10) NOT NULL,
    academic_pressure integer CHECK (academic_pressure >= 1 AND academic_pressure <= 10) NOT NULL,
    relationship_satisfaction integer CHECK (relationship_satisfaction >= 1 AND relationship_satisfaction <= 10) NOT NULL,
    program_belonging integer CHECK (program_belonging >= 1 AND program_belonging <= 10) NOT NULL,
    notes text DEFAULT '',
    created_at timestamptz DEFAULT now(),
    wants_to_speak boolean DEFAULT false,
    speak_to_who text,
    speak_to_email text,
    UNIQUE(user_id, entry_date)
);

-- Create login_sessions table
CREATE TABLE IF NOT EXISTS public.login_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_code text NOT NULL,
    expires_at timestamptz NOT NULL,
    is_used boolean DEFAULT false,
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    access_token text,
    refresh_token text,
    created_at timestamptz DEFAULT now()
);

-- Create user_goals table
CREATE TABLE IF NOT EXISTS public.user_goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    category text NOT NULL CHECK (category IN ('academic', 'health', 'fitness', 'personal')),
    target_date date,
    completed boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Create wellness_activities table
CREATE TABLE IF NOT EXISTS public.wellness_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    activity_type text NOT NULL CHECK (activity_type IN ('meditation', 'breathing', 'walk', 'journaling', 'stretching', 'gratitude')),
    duration_minutes integer NOT NULL,
    notes text,
    completed_at timestamptz DEFAULT now()
);

-- Create wellness_resources table
CREATE TABLE IF NOT EXISTS public.wellness_resources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    url text NOT NULL,
    metric_key text NOT NULL CHECK (metric_key IN ('sleep_quality', 'sleep_hours', 'energy_level', 'training_fatigue', 'muscle_soreness', 'mood', 'stress_level', 'academic_pressure', 'relationship_satisfaction', 'program_belonging')),
    trigger_condition text NOT NULL CHECK (trigger_condition IN ('less_than', 'greater_than')),
    trigger_value numeric NOT NULL,
    resource_type text DEFAULT 'article' CHECK (resource_type IN ('article', 'video', 'exercise', 'meditation', 'guide')),
    created_at timestamptz DEFAULT now()
);

-- Create coach_alerts table
CREATE TABLE IF NOT EXISTS public.coach_alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    student_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    metric text NOT NULL CHECK (metric IN ('sleep_quality', 'sleep_hours', 'energy_level', 'training_fatigue', 'muscle_soreness', 'mood', 'stress_level', 'academic_pressure', 'relationship_satisfaction', 'program_belonging')),
    condition_type text NOT NULL CHECK (condition_type IN ('greater_than', 'less_than', 'average_below', 'average_above')),
    threshold_value numeric NOT NULL,
    time_period_days integer DEFAULT 7 CHECK (time_period_days > 0),
    is_active boolean DEFAULT true,
    last_triggered_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Create auto_alert_logs table
CREATE TABLE IF NOT EXISTS public.auto_alert_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    metric_triggered text NOT NULL,
    score_value numeric NOT NULL,
    alert_sent_at timestamptz DEFAULT now(),
    admin_email text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_alert_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can read own profile') THEN
        CREATE POLICY "Users can read own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Allow profile creation') THEN
        CREATE POLICY "Allow profile creation" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Allow all reads for authenticated users') THEN
        CREATE POLICY "Allow all reads for authenticated users" ON public.user_profiles FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

-- Create RLS policies for wellness_entries
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wellness_entries' AND policyname = 'Users can read own wellness entries') THEN
        CREATE POLICY "Users can read own wellness entries" ON public.wellness_entries FOR SELECT USING (user_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wellness_entries' AND policyname = 'Users can insert own wellness entries') THEN
        CREATE POLICY "Users can insert own wellness entries" ON public.wellness_entries FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wellness_entries' AND policyname = 'Users can update own wellness entries') THEN
        CREATE POLICY "Users can update own wellness entries" ON public.wellness_entries FOR UPDATE USING (user_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wellness_entries' AND policyname = 'Coaches can read all wellness entries') THEN
        CREATE POLICY "Coaches can read all wellness entries" ON public.wellness_entries FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.user_profiles 
                WHERE id = auth.uid() AND role IN ('coach', 'admin')
            )
        );
    END IF;
END $$;

-- Create RLS policies for login_sessions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'login_sessions' AND policyname = 'Allow anonymous read unexpired sessions') THEN
        CREATE POLICY "Allow anonymous read unexpired sessions" ON public.login_sessions FOR SELECT TO anon, authenticated USING (expires_at > now() AND NOT is_used);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'login_sessions' AND policyname = 'Allow anonymous insert login sessions') THEN
        CREATE POLICY "Allow anonymous insert login sessions" ON public.login_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'login_sessions' AND policyname = 'Allow anonymous update login sessions') THEN
        CREATE POLICY "Allow anonymous update login sessions" ON public.login_sessions FOR UPDATE TO anon, authenticated USING (true);
    END IF;
END $$;

-- Create RLS policies for user_goals
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_goals' AND policyname = 'Users can read own goals') THEN
        CREATE POLICY "Users can read own goals" ON public.user_goals FOR SELECT USING (user_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_goals' AND policyname = 'Users can insert own goals') THEN
        CREATE POLICY "Users can insert own goals" ON public.user_goals FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_goals' AND policyname = 'Users can update own goals') THEN
        CREATE POLICY "Users can update own goals" ON public.user_goals FOR UPDATE USING (user_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_goals' AND policyname = 'Users can delete own goals') THEN
        CREATE POLICY "Users can delete own goals" ON public.user_goals FOR DELETE USING (user_id = auth.uid());
    END IF;
END $$;

-- Create RLS policies for wellness_activities
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wellness_activities' AND policyname = 'Users can read own activities') THEN
        CREATE POLICY "Users can read own activities" ON public.wellness_activities FOR SELECT USING (user_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wellness_activities' AND policyname = 'Users can insert own activities') THEN
        CREATE POLICY "Users can insert own activities" ON public.wellness_activities FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wellness_activities' AND policyname = 'Users can update own activities') THEN
        CREATE POLICY "Users can update own activities" ON public.wellness_activities FOR UPDATE USING (user_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wellness_activities' AND policyname = 'Users can delete own activities') THEN
        CREATE POLICY "Users can delete own activities" ON public.wellness_activities FOR DELETE USING (user_id = auth.uid());
    END IF;
END $$;

-- Create RLS policies for wellness_resources
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wellness_resources' AND policyname = 'Authenticated users can read all wellness resources') THEN
        CREATE POLICY "Authenticated users can read all wellness resources" ON public.wellness_resources FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

-- Create RLS policies for coach_alerts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coach_alerts' AND policyname = 'Coaches can read own alerts') THEN
        CREATE POLICY "Coaches can read own alerts" ON public.coach_alerts FOR SELECT USING (coach_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coach_alerts' AND policyname = 'Coaches can insert own alerts') THEN
        CREATE POLICY "Coaches can insert own alerts" ON public.coach_alerts FOR INSERT WITH CHECK (coach_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coach_alerts' AND policyname = 'Coaches can update own alerts') THEN
        CREATE POLICY "Coaches can update own alerts" ON public.coach_alerts FOR UPDATE USING (coach_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coach_alerts' AND policyname = 'Coaches can delete own alerts') THEN
        CREATE POLICY "Coaches can delete own alerts" ON public.coach_alerts FOR DELETE USING (coach_id = auth.uid());
    END IF;
END $$;

-- Create RLS policies for auto_alert_logs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'auto_alert_logs' AND policyname = 'Coaches can read alert logs') THEN
        CREATE POLICY "Coaches can read alert logs" ON public.auto_alert_logs FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.user_profiles 
                WHERE id = auth.uid() AND role IN ('coach', 'admin')
            )
        );
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_notifications ON public.user_profiles USING gin(notification_settings);
CREATE INDEX IF NOT EXISTS idx_wellness_entries_user_date ON public.wellness_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_wellness_entries_date ON public.wellness_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_login_sessions_cleanup ON public.login_sessions(expires_at, is_used);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON public.user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_category ON public.user_goals(category);
CREATE INDEX IF NOT EXISTS idx_wellness_activities_user_id ON public.wellness_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_activities_type ON public.wellness_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_wellness_activities_date ON public.wellness_activities(completed_at);
CREATE INDEX IF NOT EXISTS idx_wellness_resources_metric ON public.wellness_resources(metric_key);
CREATE INDEX IF NOT EXISTS idx_wellness_resources_condition ON public.wellness_resources(trigger_condition, trigger_value);
CREATE INDEX IF NOT EXISTS idx_wellness_resources_type ON public.wellness_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_coach_alerts_coach_id ON public.coach_alerts(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_alerts_student_id ON public.coach_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_coach_alerts_metric ON public.coach_alerts(metric);
CREATE INDEX IF NOT EXISTS idx_coach_alerts_active ON public.coach_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_coach_alerts_triggered ON public.coach_alerts(last_triggered_at);
CREATE INDEX IF NOT EXISTS idx_auto_alert_logs_student_id ON public.auto_alert_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_auto_alert_logs_metric ON public.auto_alert_logs(metric_triggered);
CREATE INDEX IF NOT EXISTS idx_auto_alert_logs_date ON public.auto_alert_logs(alert_sent_at);

-- Create trigger functions
CREATE OR REPLACE FUNCTION public.check_critical_scores()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    student_profile public.user_profiles;
    admin_email TEXT := 'ccherry@bdc.nsw.edu.au';
    critical_metrics TEXT[] := '{}';
    is_critical BOOLEAN := FALSE;
    last_alert_time TIMESTAMPTZ;
BEGIN
    SELECT * INTO student_profile FROM public.user_profiles WHERE id = NEW.user_id;

    IF student_profile IS NULL THEN
        RAISE WARNING 'Student profile not found for user_id: %', NEW.user_id;
        RETURN NEW;
    END IF;

    IF NEW.sleep_quality <= 3 THEN
        critical_metrics := array_append(critical_metrics, 'Sleep Quality: ' || NEW.sleep_quality || '/10');
        is_critical := TRUE;
    END IF;
    IF NEW.energy_level <= 3 THEN
        critical_metrics := array_append(critical_metrics, 'Energy Level: ' || NEW.energy_level || '/10');
        is_critical := TRUE;
    END IF;
    IF NEW.mood <= 3 THEN
        critical_metrics := array_append(critical_metrics, 'Mood: ' || NEW.mood || '/10');
        is_critical := TRUE;
    END IF;
    IF NEW.stress_level >= 8 THEN
        critical_metrics := array_append(critical_metrics, 'Stress Level: ' || NEW.stress_level || '/10');
        is_critical := TRUE;
    END IF;
    IF NEW.academic_pressure >= 8 THEN
        critical_metrics := array_append(critical_metrics, 'Academic Pressure: ' || NEW.academic_pressure || '/10');
        is_critical := TRUE;
    END IF;

    IF array_length(critical_metrics, 1) >= 3 THEN
        SELECT alert_sent_at INTO last_alert_time
        FROM public.auto_alert_logs
        WHERE student_id = NEW.user_id
        AND alert_sent_at >= CURRENT_DATE
        ORDER BY alert_sent_at DESC
        LIMIT 1;

        IF last_alert_time IS NULL THEN
            INSERT INTO public.auto_alert_logs (student_id, metric_triggered, score_value, admin_email)
            VALUES (NEW.user_id, array_to_string(critical_metrics, ', '), 0, admin_email);
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_emails text[] := ARRAY['ccherry@bdc.nsw.edu.au'];
  user_role text := 'student';
BEGIN
  IF NEW.email = ANY(admin_emails) THEN
    user_role := 'coach';
  END IF;

  INSERT INTO public.user_profiles (
    id, 
    email, 
    full_name,
    student_id,
    sport,
    role,
    program_year
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'student_id', ''), ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'sport', ''), ''),
    user_role,
    COALESCE((NEW.raw_user_meta_data->>'program_year')::int, 1)
  );
  
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_check_critical_scores ON public.wellness_entries;
CREATE TRIGGER trigger_check_critical_scores
    AFTER INSERT OR UPDATE ON public.wellness_entries
    FOR EACH ROW EXECUTE FUNCTION public.check_critical_scores();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Drop the existing unique constraint on student_id if it exists
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_student_id_key;

-- Create a partial unique index that only applies to non-empty student_ids
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_student_id_key 
ON user_profiles (student_id) 
WHERE student_id IS NOT NULL AND student_id != '';