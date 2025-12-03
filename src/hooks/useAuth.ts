import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Profile = Database['public']['Tables']['user_profiles']['Row']

let sharedUser: User | null = null
let sharedUserProfile: Profile | null = null
let sharedLoading = true
let sharedError: string | null = null
let listeners: Set<() => void> = new Set()
let initialized = false

const notifyListeners = () => {
  listeners.forEach(listener => listener())
}

const setSharedState = (user: User | null, profile: Profile | null, loading: boolean, error: string | null) => {
  sharedUser = user
  sharedUserProfile = profile
  sharedLoading = loading
  sharedError = error
  notifyListeners()
}

const initializeAuth = () => {
  if (initialized) return
  initialized = true

  console.log('🔄 Initializing auth (once)...')

  supabase.auth.getSession()
    .then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ Session fetch error:', error)
        if (error.message?.includes('Refresh Token Not Found') || error.message?.includes('refresh_token_not_found')) {
          console.log('🔄 Invalid refresh token detected, clearing session...')
          supabase.auth.signOut()
          setSharedState(null, null, false, null)
        } else {
          setSharedState(null, null, false, `Session error: ${error.message}`)
        }
      } else {
        console.log('✅ Initial session:', session?.user?.email || 'No session')
        sharedUser = session?.user ?? null
        sharedLoading = false
        if (sharedUser) {
          fetchUserProfile(sharedUser.id)
        } else {
          setSharedState(null, null, false, null)
        }
      }
    })
    .catch((err) => {
      console.error('❌ Session fetch failed:', err)
      if (err.message?.includes('Refresh Token Not Found') || err.message?.includes('refresh_token_not_found')) {
        console.log('🔄 Invalid refresh token detected in catch, clearing session...')
        supabase.auth.signOut()
        setSharedState(null, null, false, null)
      } else {
        setSharedState(null, null, false, `Connection failed: ${err.message}`)
      }
    })

  supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔄 Auth state change:', event, session?.user?.email || 'No user')

    // Handle sign out explicitly
    if (event === 'SIGNED_OUT') {
      console.log('🔄 User signed out, clearing state')
      setSharedState(null, null, false, null)
      return
    }

    // Handle sign in
    if (event === 'SIGNED_IN' && session?.user) {
      console.log('🔄 User signed in, fetching profile')
      sharedUser = session.user
      sharedError = null
      fetchUserProfile(session.user.id)
      return
    }

    // General state update
    sharedUser = session?.user ?? null
    sharedError = null
    if (sharedUser) {
      fetchUserProfile(sharedUser.id)
    } else {
      setSharedState(null, null, false, null)
    }
  })
}

const fetchUserProfile = async (userId: string) => {
  try {
    console.log('🔄 Fetching profile for user:', userId)

    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      throw new Error('Supabase environment variables not configured.')
    }

    if (import.meta.env.VITE_SUPABASE_URL.includes('placeholder') || import.meta.env.VITE_SUPABASE_ANON_KEY.includes('placeholder')) {
      throw new Error('Supabase environment variables contain placeholder values.')
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    console.log('📊 Profile fetch result:', { data: !!data, error: error?.message })

    if (error) {
      console.error('❌ Profile fetch error:', error)
      setSharedState(sharedUser, null, false, `Profile error: ${error.message}`)
    } else if (data) {
      console.log('✅ Profile loaded:', { role: data.role, name: data.full_name })
      setSharedState(sharedUser, data, false, null)
    } else {
      console.log('⚠️ No profile found, waiting for database trigger...')
      await new Promise(resolve => setTimeout(resolve, 2000))

      const { data: retryData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (retryData) {
        console.log('✅ Profile found on retry')
        setSharedState(sharedUser, retryData, false, null)
      } else {
        console.error('❌ Profile still not found after retry')
        setSharedState(sharedUser, null, false, 'Profile creation is taking longer than expected. Please refresh the page.')
      }
    }
  } catch (error) {
    console.error('❌ Profile fetch exception:', error)
    setSharedState(sharedUser, null, false, error instanceof Error ? error.message : 'Unknown error')
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(sharedUser)
  const [userProfile, setUserProfile] = useState<Profile | null>(sharedUserProfile)
  const [loading, setLoading] = useState(sharedLoading)
  const [error, setError] = useState<string | null>(sharedError)

  useEffect(() => {
    initializeAuth()

    const updateState = () => {
      setUser(sharedUser)
      setUserProfile(sharedUserProfile)
      setLoading(sharedLoading)
      setError(sharedError)
    }

    listeners.add(updateState)
    return () => {
      listeners.delete(updateState)
    }
  }, [])

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


  const switchRole = async (newRole: 'student' | 'coach') => {
    if (!user || !userProfile) {
      const errorMsg = 'Cannot switch role: no user or profile'
      console.log('❌', errorMsg)
      alert(`Error: ${errorMsg}`)
      return
    }

    if (userProfile.actual_role !== 'coach' && userProfile.actual_role !== 'admin') {
      const errorMsg = 'Role switching not allowed for this user'
      console.log('❌', errorMsg)
      alert(`Error: ${errorMsg}`)
      return
    }

    try {
      console.log('🔄 Switching view from', userProfile.role, 'to', newRole)
      console.log('🔄 User ID:', user.id)
      console.log('🔄 Actual role:', userProfile.actual_role)

      const { data, error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', user.id)
        .select()

      console.log('🔄 Update result:', { data, error })

      if (error) {
        console.error('❌ Role switch database error:', error)
        alert(`Database error: ${error.message}\nCode: ${error.code}\nDetails: ${error.details}`)
        throw error
      }

      console.log('✅ View role updated, refreshing page...')
      window.location.reload()
    } catch (error) {
      console.error('❌ Error switching role:', error)
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      alert(`Role switch failed: ${errorMsg}`)
      setSharedState(sharedUser, sharedUserProfile, false, `Role switch failed: ${errorMsg}`)
    }
  }

  const signOut = async () => {
    try {
      console.log('🔄 Signing out...')

      // Clear shared state immediately
      setSharedState(null, null, false, null)

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('❌ Sign out error:', error)
      } else {
        console.log('✅ Sign out successful')
      }

      // Clear any stored session data
      localStorage.removeItem('supabase.auth.token')
      sessionStorage.clear()

      // Force reload to clear all state
      window.location.href = '/'

      return { error }
    } catch (error) {
      console.error('❌ Sign out exception:', error)
      // Even if there's an error, clear state and reload
      setSharedState(null, null, false, null)
      window.location.href = '/'
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
    switchRole,
    signOut
  }
}
