import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Profile = Database['public']['Tables']['user_profiles']['Row']

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('🔄 Initializing auth...')
    
    // Get initial session with error handling
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('❌ Session fetch error:', error)
          // Handle refresh token errors gracefully
          if (error.message?.includes('Refresh Token Not Found') || error.message?.includes('refresh_token_not_found')) {
            console.log('🔄 Invalid refresh token detected, clearing session...')
            supabase.auth.signOut()
            setUser(null)
            setError(null) // Clear error state to allow re-authentication
          } else {
            setError(`Session error: ${error.message}`)
          }
        } else {
          console.log('✅ Initial session:', session?.user?.email || 'No session')
          setUser(session?.user ?? null)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('❌ Session fetch failed:', err)
        // Handle refresh token errors gracefully
        if (err.message?.includes('Refresh Token Not Found') || err.message?.includes('refresh_token_not_found')) {
          console.log('🔄 Invalid refresh token detected in catch, clearing session...')
          supabase.auth.signOut()
          setUser(null)
          setError(null) // Clear error state to allow re-authentication
        } else {
          setError(`Connection failed: ${err.message}`)
        }
        setLoading(false)
      })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email || 'No user')
        setUser(session?.user ?? null)
        setError(null) // Clear errors on auth change
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Fetch user profile when user changes
  useEffect(() => {
    if (user) {
      fetchUserProfile(user.id)
    } else {
      setUserProfile(null)
    }
  }, [user])

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('🔄 Fetching profile for user:', userId)
      
      // Check if Supabase is properly configured before making requests
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('Supabase environment variables not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.')
      }

      if (import.meta.env.VITE_SUPABASE_URL.includes('placeholder') || import.meta.env.VITE_SUPABASE_ANON_KEY.includes('placeholder')) {
        throw new Error('Supabase environment variables contain placeholder values. Please update them with your actual Supabase project URL and API key.')
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      console.log('📊 Profile fetch result:', { data: !!data, error: error?.message })
      
      if (error) {
        console.error('❌ Profile fetch error:', error)
        // Provide more specific error messages based on the error type
        if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
          setError('Unable to connect to database. Please check your internet connection and ensure Supabase environment variables are properly configured.')
        } else {
          setError(`Profile error: ${error.message}`)
        }
        setUserProfile(null)
      } else if (data) {
        console.log('✅ Profile loaded:', { role: data.role, name: data.full_name })
        setUserProfile(data)
        setError(null)
      } else {
        console.log('⚠️ No profile found, waiting for database trigger to create it...')
        // The database trigger should create the profile automatically
        // Wait a moment and try again
        await new Promise(resolve => setTimeout(resolve, 2000))

        const { data: retryData, error: retryError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()

        if (retryData) {
          console.log('✅ Profile found on retry')
          setUserProfile(retryData)
          setError(null)
        } else {
          console.error('❌ Profile still not found after retry')
          setError('Profile creation is taking longer than expected. Please refresh the page.')
        }
      }
    } catch (error) {
      console.error('❌ Profile fetch exception:', error)
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('Supabase environment variables')) {
          setError(error.message)
        } else if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
          setError('Unable to connect to the database. Please check your internet connection and ensure the application is properly configured.')
        } else {
          setError(`Connection failed: ${error.message}`)
        }
      } else {
        setError('Unknown connection error occurred')
      }
      setUserProfile(null)
    }
  }

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      console.log('🔄 Attempting sign up for:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })

      if (error) {
        console.error('❌ Sign up error:', error)
        return { data, error }
      }

      console.log('✅ Sign up successful:', data)

      return { data, error }
    } catch (error) {
      console.error('❌ Sign up exception:', error)
      return { data: null, error: { message: `Sign up failed: ${error instanceof Error ? error.message : 'Unknown error'}` } }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔄 Attempting sign in for:', email)
      
      const result = await supabase.auth.signInWithPassword({ email, password })
      
      if (result.error) {
        console.error('❌ Sign in error:', result.error.message)
      } else {
        console.log('✅ Sign in successful')
      }
      
      return result
    } catch (error) {
      console.error('❌ Sign in exception:', error)
      return { 
        data: null, 
        error: { 
          message: `Sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
        } 
      }
    }
  }

  const signInWithQR = async (sessionToken: string) => {
    try {
      console.log('🔄 QR login attempt with token:', sessionToken.substring(0, 8) + '...')
      
      if (sessionToken === 'demo-login-2025') {
        console.log('🎭 Demo login detected')
        const demoUserId = 'demo-user-id'
        
        let { data: existingProfile, error: fetchError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', demoUserId)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw new Error('Error checking demo user')
        }

        if (!existingProfile) {
          const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              id: demoUserId,
              email: 'demo@student.edu',
              full_name: 'Demo Student',
              student_id: 'DEMO001',
              sport: 'Swimming',
              role: 'student',
              program_year: 2
            })
            .select()
            .single()

          if (insertError) {
            console.error('❌ Error creating demo profile:', insertError)
            throw new Error('Failed to create demo user')
          }
          existingProfile = newProfile
        }

        setUserProfile(existingProfile)
        setUser({
          id: existingProfile.id,
          email: existingProfile.email,
          created_at: existingProfile.created_at
        } as User)

        console.log('✅ Demo login successful')
        return { data: { user: existingProfile }, error: null }
      }

      // Regular QR login
      const { data: session, error: sessionError } = await supabase
        .from('login_sessions')
        .select('*')
        .eq('qr_code', sessionToken)
        .eq('is_used', false)
        .single()

      if (sessionError || !session) {
        throw new Error('Invalid or expired QR code')
      }

      if (new Date(session.expires_at) < new Date()) {
        throw new Error('QR code has expired')
      }

      if (!session.user_id) {
        throw new Error('QR session not linked to a user')
      }

      await supabase
        .from('login_sessions')
        .update({ is_used: true })
        .eq('qr_code', sessionToken)

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user_id)
        .single()

      if (profileError || !profile) {
        throw new Error('User profile not found')
      }

      setUserProfile(profile)
      setUser({
        id: profile.id,
        email: profile.email,
        created_at: profile.created_at
      } as User)

      console.log('✅ QR login successful')
      return { data: { user: profile }, error: null }
    } catch (error: any) {
      console.error('❌ QR login failed:', error)
      return { data: null, error }
    }
  }
  
  const switchRole = async (newRole: 'student' | 'coach') => {
    if (!user || !userProfile) {
      console.log('❌ Cannot switch role: no user or profile')
      return
    }

    // Check if user's actual role allows switching (coaches and admins can switch)
    if (userProfile.actual_role !== 'coach' && userProfile.actual_role !== 'admin') {
      console.log('❌ Role switching not allowed for this user')
      return
    }

    try {
      console.log('🔄 Switching view from', userProfile.role, 'to', newRole)

      // Update only the view role, not the actual_role
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', user.id)

      if (error) {
        console.error('❌ Role switch database error:', error)
        throw error
      }

      console.log('✅ View role updated, refreshing page...')

      // Force page refresh to ensure clean state
      window.location.reload()
    } catch (error) {
      console.error('❌ Error switching role:', error)
      setError(`Role switch failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const signOut = async () => {
    try {
      console.log('🔄 Signing out...')
      const { error } = await supabase.auth.signOut()
      setUserProfile(null)
      setError(null)
      console.log('✅ Sign out successful')
      return { error }
    } catch (error) {
      console.error('❌ Sign out error:', error)
      setError(`Sign out failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { error }
    }
  }

  return {
    user,
    userProfile,
    loading,
    error,
    signUp,
    signIn,
    signInWithQR,
    switchRole,
    signOut
  }
}