import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

let sharedUser: User | null = null
let sharedUserProfile: Profile | null = null
let sharedLoading = true
let sharedError: string | null = null
let listeners: Set<() => void> = new Set()
let initialized = false
let isFetchingProfile = false

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

const fetchUserProfile = async (userId: string) => {
  if (isFetchingProfile) {
    console.log('⏭️ Profile fetch already in progress, skipping...')
    return
  }

  isFetchingProfile = true

  // Add timeout to prevent hanging
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Profile fetch timeout')), 8000)
  })

  try {
    console.log('🔄 Fetching profile for user:', userId)

    const fetchPromise = supabase
      .from('profiles')
      .select('*, organizations(id, name, slug)')
      .eq('id', userId)
      .maybeSingle()

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any

    console.log('📊 Profile fetch result:', { data: !!data, error: error?.message })

    if (error) {
      console.error('❌ Profile fetch error:', error)
      setSharedState(sharedUser, null, false, `Profile error: ${error.message}`)
    } else if (data) {
      console.log('✅ Profile loaded:', {
        role: data.role,
        name: data.full_name,
        organization: data.organizations?.name
      })
      setSharedState(sharedUser, data, false, null)
    } else {
      console.log('⚠️ No profile found')
      setSharedState(sharedUser, null, false, 'Profile not found. Please contact support.')
    }
  } catch (error) {
    console.error('❌ Profile fetch exception:', error)
    setSharedState(sharedUser, null, false, error instanceof Error ? error.message : 'Unknown error')
  } finally {
    isFetchingProfile = false
  }
}

const initializeAuth = () => {
  if (initialized) return
  initialized = true

  console.log('🔄 Initializing auth (once)...')

  // Add a timeout to prevent infinite loading
  const loadingTimeout = setTimeout(() => {
    if (sharedLoading) {
      console.warn('⚠️ Auth initialization timeout - forcing completion')
      setSharedState(sharedUser, sharedUserProfile, false, null)
    }
  }, 10000) // 10 second timeout

  supabase.auth.getSession()
    .then(({ data: { session }, error }) => {
      clearTimeout(loadingTimeout)
      if (error) {
        console.error('❌ Session fetch error:', error)
        setSharedState(null, null, false, null)
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
      clearTimeout(loadingTimeout)
      console.error('❌ Session fetch failed:', err)
      setSharedState(null, null, false, null)
    })

  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('🔄 Auth state change:', event, session?.user?.email || 'No user')

    if (event === 'SIGNED_OUT') {
      console.log('🔄 User signed out, clearing state')
      isFetchingProfile = false
      setSharedState(null, null, false, null)
      return
    }

    if (event === 'SIGNED_IN' && session?.user) {
      console.log('🔄 User signed in, fetching profile')
      sharedUser = session.user
      sharedError = null
      await fetchUserProfile(session.user.id)
      return
    }

    if (event === 'TOKEN_REFRESHED' && session?.user) {
      console.log('🔄 Token refreshed')
      sharedUser = session.user
      return
    }

    sharedUser = session?.user ?? null
    if (sharedUser && !sharedUserProfile && !isFetchingProfile) {
      await fetchUserProfile(sharedUser.id)
    } else if (!sharedUser) {
      setSharedState(null, null, false, null)
    }
  })
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
        .from('profiles')
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

      isFetchingProfile = false

      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('❌ Sign out error:', error)
        throw error
      }

      console.log('✅ Sign out successful')

      setSharedState(null, null, false, null)

      window.location.href = '/'

      return { error: null }
    } catch (error) {
      console.error('❌ Sign out exception:', error)

      setSharedState(null, null, false, null)

      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch (e) {
        console.error('Failed to clear storage:', e)
      }

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
