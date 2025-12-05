import React, { useEffect, useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { AuthForm } from './components/Auth/AuthForm'
import { UpdatePassword } from './pages/UpdatePassword'
import { Header } from './components/Layout/Header'
import { StudentDashboard } from './components/Student/StudentDashboard'
import { CoachDashboard } from './components/Coach/CoachDashboard'
import { BDCLogo } from './components/BDCLogo'
import { supabase } from './lib/supabase'

function AuthListener() {
  const [isPasswordReset, setIsPasswordReset] = useState(false)

  useEffect(() => {
    console.log('🔍 AuthListener: Initializing password reset detection')
    console.log('🔍 Full URL:', window.location.href)
    console.log('🔍 Hash:', window.location.hash)

    const checkPasswordRecovery = () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const type = hashParams.get('type')
      const accessToken = hashParams.get('access_token')

      console.log('🔍 Manual check - Type:', type, '| Has Token:', !!accessToken)

      if (type === 'recovery' && accessToken) {
        console.log('✅ PASSWORD RECOVERY DETECTED via manual hash check')
        setIsPasswordReset(true)
        return true
      }
      return false
    }

    if (checkPasswordRecovery()) {
      return
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth event:', event)

      if (event === 'PASSWORD_RECOVERY') {
        console.log('✅ PASSWORD RECOVERY DETECTED via onAuthStateChange event')
        setIsPasswordReset(true)
      }
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  if (isPasswordReset) {
    return <UpdatePassword />
  }

  return <App />
}

function App() {
  const { user, userProfile, loading, error } = useAuth()

  // Show error state if there's a connection issue
  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <BDCLogo className="h-16 w-auto" />
          </div>
          <h1 className="text-xl font-bold text-red-900 mb-4">Connection Error</h1>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <BDCLogo className="h-16 w-auto" />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading BDC Thrive...</p>
        </div>
      </div>
    )
  }

  // Show auth form if no user
  if (!user) {
    return <AuthForm onSuccess={() => {}} />
  }

  // Show loading if user exists but no profile yet
  if (user && !userProfile) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <BDCLogo className="h-16 w-auto" />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
          <p className="text-xs text-gray-500 mt-2">User ID: {user.id}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        {userProfile?.role === 'coach' || userProfile?.role === 'admin' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <CoachDashboard />
          </div>
        ) : (
          <StudentDashboard />
        )}
      </main>
    </div>
  )
}

export default AuthListener