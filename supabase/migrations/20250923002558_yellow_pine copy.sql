/*
  # Create wellness resources table for personalized recommendations

  1. New Tables
    - `wellness_resources`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text)
      - `url` (text, not null)
      - `metric_key` (text, not null) - matches wellness_entries columns
      - `trigger_condition` (text, not null) - 'less_than' or 'greater_than'
      - `trigger_value` (numeric, not null) - threshold value
      - `resource_type` (text) - 'article', 'video', 'exercise', 'meditation'
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on wellness_resources table
    - Add policy for authenticated users to read all resources

  3. Sample Data
    - Insert initial resources for testing and demonstration
*/

-- Create wellness resources table
CREATE TABLE IF NOT EXISTS wellness_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  url text NOT NULL,
  metric_key text NOT NULL CHECK (metric_key IN (
    'sleep_quality', 'sleep_hours', 'energy_level', 'training_fatigue',
    'muscle_soreness', 'mood', 'stress_level', 'academic_pressure',
    'relationship_satisfaction', 'program_belonging'
  )),
  trigger_condition text NOT NULL CHECK (trigger_condition IN ('less_than', 'greater_than')),
  trigger_value numeric NOT NULL,
  resource_type text DEFAULT 'article' CHECK (resource_type IN ('article', 'video', 'exercise', 'meditation', 'guide')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE wellness_resources ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read all resources
CREATE POLICY "Authenticated users can read all wellness resources"
  ON wellness_resources
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wellness_resources_metric ON wellness_resources(metric_key);
CREATE INDEX IF NOT EXISTS idx_wellness_resources_condition ON wellness_resources(trigger_condition, trigger_value);
CREATE INDEX IF NOT EXISTS idx_wellness_resources_type ON wellness_resources(resource_type);

-- Insert sample wellness resources
INSERT INTO wellness_resources (title, description, url, metric_key, trigger_condition, trigger_value, resource_type) VALUES
-- Stress Management Resources
('5-Minute Stress Relief Meditation', 'A quick guided meditation to calm your mind and reduce stress levels.', 'https://www.headspace.com/meditation/stress', 'stress_level', 'greater_than', 6, 'meditation'),
('Breathing Exercises for Athletes', 'Simple breathing techniques to manage stress and improve focus during training.', 'https://www.verywellmind.com/breathing-exercises-for-stress-relief-3144508', 'stress_level', 'greater_than', 7, 'exercise'),
('Managing Academic Stress', 'Practical strategies for handling academic pressure while maintaining athletic performance.', 'https://www.apa.org/topics/stress/student', 'academic_pressure', 'greater_than', 7, 'article'),

-- Sleep Quality Resources
('Sleep Hygiene for Athletes', 'Essential tips for improving sleep quality and recovery for student athletes.', 'https://www.sleepfoundation.org/how-sleep-works/sleep-hygiene-for-athletes', 'sleep_quality', 'less_than', 5, 'guide'),
('Creating the Perfect Sleep Environment', 'How to optimize your bedroom for better sleep quality and deeper rest.', 'https://www.sleepfoundation.org/bedroom-environment', 'sleep_quality', 'less_than', 4, 'article'),
('Progressive Muscle Relaxation for Sleep', 'A guided relaxation technique to help you fall asleep faster and sleep more deeply.', 'https://www.sleepfoundation.org/how-to-fall-asleep/progressive-muscle-relaxation', 'sleep_quality', 'less_than', 6, 'exercise'),

-- Mood and Energy Resources
('Mood Boosting Activities for Students', 'Simple daily activities that can naturally improve your mood and outlook.', 'https://www.verywellmind.com/mood-boosting-activities-1067835', 'mood', 'less_than', 4, 'article'),
('Energy-Boosting Nutrition Tips', 'Nutritional strategies to maintain consistent energy levels throughout the day.', 'https://www.healthline.com/nutrition/best-foods-for-energy', 'energy_level', 'less_than', 4, 'guide'),
('Quick Energy Boost Exercises', '10-minute exercises to naturally increase your energy when feeling low.', 'https://www.verywellfit.com/quick-energy-boosting-exercises-1231070', 'energy_level', 'less_than', 5, 'exercise'),

-- Training and Recovery Resources
('Managing Training Fatigue', 'Understanding and managing fatigue to optimize athletic performance and recovery.', 'https://www.verywellfit.com/overtraining-syndrome-3120480', 'training_fatigue', 'greater_than', 7, 'article'),
('Post-Workout Recovery Stretches', 'Essential stretching routines to reduce muscle soreness and improve flexibility.', 'https://www.verywellfit.com/post-workout-stretches-1231203', 'muscle_soreness', 'greater_than', 6, 'exercise'),
('Active Recovery Techniques', 'Low-intensity activities to promote recovery while staying active.', 'https://www.verywellfit.com/active-recovery-workouts-1231199', 'training_fatigue', 'greater_than', 8, 'guide'),

-- Social and Belonging Resources
('Building Connections in Sports Programs', 'Tips for developing meaningful relationships with teammates and coaches.', 'https://www.verywellmind.com/building-social-connections-5323876', 'relationship_satisfaction', 'less_than', 5, 'article'),
('Finding Your Place in Team Sports', 'Strategies for feeling more connected and valued within your sports program.', 'https://www.verywellmind.com/sense-of-belonging-5323841', 'program_belonging', 'less_than', 5, 'guide'),
('Communication Skills for Athletes', 'Effective communication techniques for better relationships with coaches and teammates.', 'https://www.verywellmind.com/communication-skills-4157244', 'relationship_satisfaction', 'less_than', 4, 'article');