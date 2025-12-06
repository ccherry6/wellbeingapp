import React, { useState } from 'react'
import { Mail, Lock, User, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { BDCLogo } from '../BDCLogo'
import { supabase } from '../../lib/supabase'

interface AuthFormProps {
  onSuccess: () => void
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [sport, setSport] = useState('')
  const [role, setRole] = useState<'student' | 'coach'>('student')
  const [registrationCode, setRegistrationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [invitationToken, setInvitationToken] = useState<string | null>(null)
  const [invitationData, setInvitationData] = useState<any>(null)

  const { signUp, signIn } = useAuth()

  // Check for invitation token in URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (token) {
      console.log('🎫 Invitation token detected:', token)
      setInvitationToken(token)
      setIsSignUp(true) // Switch to signup mode

      // Fetch invitation data
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/invitation_tokens?token=eq.${token}&used=eq.false&expires_at=gt.${new Date().toISOString()}`, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            const invitation = data[0]
            console.log('✅ Invitation loaded:', invitation)
            setInvitationData(invitation)
            setEmail(invitation.email)
            setRole(invitation.role)
            setRegistrationCode('BDC2026') // Pre-fill registration code
          } else {
            console.log('❌ Invalid or expired invitation token')
            setError('Invalid or expired invitation link')
          }
        })
        .catch(err => {
          console.error('❌ Error loading invitation:', err)
          setError('Failed to load invitation')
        })
    }
  }, [])

  // Registration code - you can change this to whatever you want
  const VALID_REGISTRATION_CODE = 'BDC2026'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isSignUp) {
        // Validate registration code for sign-ups
        if (registrationCode.toUpperCase() !== VALID_REGISTRATION_CODE) {
          setError('Invalid registration code. Please contact your coach for the correct code.')
          setLoading(false)
          return
        }

        const { data, error } = await signUp(email, password, {
          full_name: fullName,
          role,
          student_id: role === 'student' ? studentId : null,
          sport: role === 'student' ? sport : null
        })
        if (error) {
          throw error
        }
        console.log('✅ Signup successful')
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          throw error
        }
        console.log('✅ Sign in successful')
      }

      // Clear any URL parameters (like invitation tokens) after successful auth
      window.history.replaceState({}, document.title, window.location.pathname)

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      console.log('🔄 Sending password reset to:', email)

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/request-password-reset`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email')
      }

      console.log('✅ Reset email sent successfully')
      setSuccess('Password reset email sent! Check your inbox and spam folder.')
      setEmail('')
    } catch (err: any) {
      console.error('❌ Reset email exception:', err)
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/Thrive Wellbeing Logo.png"
            alt="Thrive Wellbeing Logo"
            className="h-40 w-auto mx-auto mb-4 object-contain"
          />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            <span className="text-blue-900">Thrive Wellbeing</span>
          </h1>
          <p className="text-gray-600 mb-4">Wellbeing Check-in</p>
          <p className="text-gray-600">
            {isForgotPassword ? 'Reset your password' : isSignUp ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        {isForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-600 text-sm">{success}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  placeholder="your.email@school.edu"
                  required
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                We'll send you a secure link to reset your password. Check your spam folder if you don't see it.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-900 to-red-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-800 hover:to-red-700 focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false)
                setError('')
                setSuccess('')
              }}
              className="w-full flex items-center justify-center space-x-2 text-blue-900 hover:text-blue-800 font-medium py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          {invitationData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-sm font-medium">
                🎉 You've been invited to join as a {invitationData.role}!
              </p>
              <p className="text-blue-600 text-xs mt-1">
                Complete the form below to create your account.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {isSignUp && !invitationData && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    role === 'student'
                      ? 'border-blue-900 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('coach')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    role === 'coach'
                      ? 'border-blue-900 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Coach
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="your.email@school.edu"
                required
                disabled={!!invitationData}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                    placeholder="Your full name"
                    required
                  />
                </div>
              </div>

              {role === 'student' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student ID
                    </label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                      placeholder="Your student ID"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sport
                    </label>
                    <input
                      type="text"
                      value={sport}
                      onChange={(e) => setSport(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                      placeholder="e.g., Swimming, Basketball"
                      required
                    />
                  </div>
                </>
              )}
            </>
          )}

          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Code
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={registrationCode}
                  onChange={(e) => setRegistrationCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent uppercase tracking-wider"
                  placeholder="Enter registration code"
                  required
                  maxLength={10}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Contact your coach or administrator for the registration code
              </p>
            </div>
          )}

          {!isSignUp && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-900 focus:ring-blue-900 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-sm text-blue-900 hover:text-blue-800 font-medium"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-900 to-red-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-800 hover:to-red-700 focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>
        )}

        {!isForgotPassword && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-900 hover:text-blue-800 font-medium"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}