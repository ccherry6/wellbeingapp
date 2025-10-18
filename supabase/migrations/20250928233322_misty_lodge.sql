/*
  # Add indexes for training check-ins

  1. Performance
    - Add indexes for common query patterns
    - Optimize for user-specific and date-based queries
*/

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_checkins_user_id ON training_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_training_checkins_date ON training_checkins(session_date);
CREATE INDEX IF NOT EXISTS idx_training_checkins_type ON training_checkins(session_type);
CREATE INDEX IF NOT EXISTS idx_training_checkins_user_date ON training_checkins(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_training_checkins_created_at ON training_checkins(created_at);