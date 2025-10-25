import React, { useState } from 'react'
import { Mail, Lock, User, Trophy, QrCode } from 'lucide-react'
import QRCode from 'react-qr-code'
import { useAuth } from '../../hooks/useAuth'
import { QRLogin } from './QRLogin'
import { BDCLogo } from '../BDCLogo'

interface AuthFormProps {
  onSuccess: () => void
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [showQRLogin, setShowQRLogin] = useState(false)
  const [showPublicQR, setShowPublicQR] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [sport, setSport] = useState('')
  const [role, setRole] = useState<'student' | 'coach'>('student')
  const [registrationCode, setRegistrationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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

  // Generate a public demo token
  const publicDemoToken = 'demo-login-2025'
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

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
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          throw error
        }
        // User should now be automatically signed in after signup
        console.log('✅ Signup successful, user should be logged in')
      }
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (showQRLogin) {
    return <QRLogin onBack={() => setShowQRLogin(false)} onSuccess={onSuccess} />
  }

  if (showPublicQR) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <BDCLogo className="h-20 w-auto" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Public Demo Access
            </h1>
            <p className="text-gray-600">
              Scan this QR code to access the demo
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-6">
            <QRCode
              value={publicDemoToken}
              size={200}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            />
          </div>

          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-2">Demo Token:</p>
            <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono">
              {publicDemoToken}
            </code>
          </div>

          <button
            onClick={() => setShowPublicQR(false)}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Back to Login
          </button>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Demo Access:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Scan QR code or enter token manually</li>
              <li>• Access demo student account</li>
              <li>• Try all wellbeing features</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/BDC Logo.jpg" 
            alt="BDC Logo" 
            className="h-20 w-auto mx-auto mb-4 object-contain"
          />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            <span className="text-blue-900">BDC Thrive</span>
          </h1>
          <p className="text-gray-600 mb-4">Wellbeing Monitoring Platform</p>
          <p className="text-gray-600">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            onClick={() => setShowPublicQR(true)}
            className="bg-green-100 text-green-900 py-3 px-2 rounded-lg font-medium hover:bg-green-200 transition-colors flex flex-col items-center justify-center text-xs"
          >
            <QrCode className="w-4 h-4 mb-1" />
            Demo QR
          </button>
          <button
            onClick={() => setShowQRLogin(true)}
            className="bg-blue-100 text-blue-900 py-3 px-2 rounded-lg font-medium hover:bg-blue-200 transition-colors flex flex-col items-center justify-center text-xs"
          >
            <QrCode className="w-4 h-4 mb-1" />
            QR Login
          </button>
          <div className="bg-gray-100 text-gray-700 py-3 px-2 rounded-lg font-medium flex flex-col items-center justify-center text-xs">
            <Mail className="w-4 h-4 mb-1" />
            Email Login
          </div>
        </div>

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
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-900 focus:ring-blue-900 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember my email address
              </label>
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

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-900 hover:text-blue-800 font-medium"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  )
}