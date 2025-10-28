export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'student' | 'coach' | 'admin'
          actual_role: 'student' | 'coach' | 'admin'
          student_id: string | null
          sport: string | null
          program_year: number | null
          notification_settings: any | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'student' | 'coach' | 'admin'
          actual_role: 'student' | 'coach' | 'admin'
          student_id?: string | null
          sport?: string | null
          program_year?: number | null
          notification_settings?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'student' | 'coach' | 'admin'
          actual_role?: 'student' | 'coach' | 'admin'
          student_id?: string | null
          sport?: string | null
          program_year?: number | null
          notification_settings?: any | null
          created_at?: string
        }
      }
      wellness_entries: {
        Row: {
          id: string
          user_id: string
          sleep_quality: number
          sleep_hours: number
          energy_level: number
          training_fatigue: number
          muscle_soreness: number
          mood: number
          stress_level: number
          academic_pressure: number
          relationship_satisfaction: number
          program_belonging: number
          notes: string | null
          entry_date: string
          created_at: string
          is_injured_or_sick: boolean
          injury_sickness_notes: string | null
          wants_to_speak: boolean
          speak_to_who: string | null
          speak_to_email: string | null
          hrv: number | null
          resting_heart_rate: number | null
        }
        Insert: {
          id?: string
          user_id: string
          sleep_quality: number
          sleep_hours: number
          energy_level: number
          training_fatigue: number
          muscle_soreness: number
          mood: number
          stress_level: number
          academic_pressure: number
          relationship_satisfaction: number
          program_belonging: number
          notes?: string | null
          entry_date: string
          created_at?: string
          is_injured_or_sick?: boolean
          injury_sickness_notes?: string | null
          wants_to_speak?: boolean
          speak_to_who?: string | null
          speak_to_email?: string | null
          hrv?: number | null
          resting_heart_rate?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          sleep_quality?: number
          sleep_hours?: number
          energy_level?: number
          training_fatigue?: number
          muscle_soreness?: number
          mood?: number
          stress_level?: number
          academic_pressure?: number
          relationship_satisfaction?: number
          program_belonging?: number
          notes?: string | null
          entry_date?: string
          created_at?: string
          is_injured_or_sick?: boolean
          injury_sickness_notes?: string | null
          wants_to_speak?: boolean
          speak_to_who?: string | null
          speak_to_email?: string | null
          hrv?: number | null
          resting_heart_rate?: number | null
        }
      }
      login_sessions: {
        Row: {
          id: string
          qr_code: string
          user_id: string | null
          expires_at: string
          is_used: boolean
          access_token: string | null
          refresh_token: string | null
          created_at: string
        }
        Insert: {
          id?: string
          qr_code: string
          user_id?: string | null
          expires_at: string
          is_used?: boolean
          access_token?: string | null
          refresh_token?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          qr_code?: string
          user_id?: string | null
          expires_at?: string
          is_used?: boolean
          access_token?: string | null
          refresh_token?: string | null
          created_at?: string
        }
      }
      training_checkins: {
        Row: {
          id: string
          user_id: string
          session_date: string
          session_time: string
          session_type: 'pre-training' | 'post-training'
          readiness_score: number | null
          motivation_score: number | null
          fatigue_score: number
          soreness_score: number
          rpe_score: number | null
          overall_feeling_score: number | null
          new_issues: boolean | null
          issues_notes: string | null
          training_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_date?: string
          session_time?: string
          session_type: 'pre-training' | 'post-training'
          readiness_score?: number | null
          motivation_score?: number | null
          fatigue_score: number
          soreness_score: number
          rpe_score?: number | null
          overall_feeling_score?: number | null
          new_issues?: boolean | null
          issues_notes?: string | null
          training_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_date?: string
          session_time?: string
          session_type?: 'pre-training' | 'post-training'
          readiness_score?: number | null
          motivation_score?: number | null
          fatigue_score?: number
          soreness_score?: number
          rpe_score?: number | null
          overall_feeling_score?: number | null
          new_issues?: boolean | null
          issues_notes?: string | null
          training_notes?: string | null
          created_at?: string
        }
      }
      notification_settings: {
        Row: {
          id: string
          user_id: string
          browser_notifications: boolean
          email_notifications: boolean
          notification_time: string
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          browser_notifications?: boolean
          email_notifications?: boolean
          notification_time?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          browser_notifications?: boolean
          email_notifications?: boolean
          notification_time?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
      }
      coach_invitations: {
        Row: {
          id: string
          invited_by: string
          invited_email: string
          invited_user_id: string | null
          status: 'pending' | 'accepted' | 'revoked'
          created_at: string
          accepted_at: string | null
          revoked_at: string | null
        }
        Insert: {
          id?: string
          invited_by: string
          invited_email: string
          invited_user_id?: string | null
          status?: 'pending' | 'accepted' | 'revoked'
          created_at?: string
          accepted_at?: string | null
          revoked_at?: string | null
        }
        Update: {
          id?: string
          invited_by?: string
          invited_email?: string
          invited_user_id?: string | null
          status?: 'pending' | 'accepted' | 'revoked'
          created_at?: string
          accepted_at?: string | null
          revoked_at?: string | null
        }
      }
    }
  }
}