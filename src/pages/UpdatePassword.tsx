import React, { useState, useEffect } from 'react'
import { Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function UpdatePassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [verifying, setVerifying] = useState(true)

  useEffect(() => {
    const handleRecovery = async () => {
      console.log('🔄 UpdatePassword: Handling recovery')
      console.log('🔄 Full URL:', window.location.href)
      console.log('🔄 Hash:', window.location.hash)

      if (!window.location.hash) {
        console.error('❌ No hash parameters found')
        setError('Invalid password reset link. Please request a new one.')
        setVerifying(false)
        return
      }

      const hash = window.location.hash.substring(1)
      const hashParams = new URLSearchParams(hash)

      // Check for custom reset token format: #reset=TOKEN
      const resetToken = hashParams.get('reset')

      if (resetToken) {
        console.log('✅ Custom reset token detected')
        // Store token for later use
        window.resetToken = resetToken
        setSessionReady(true)
        setVerifying(false)
        return
      }

      // Fallback: Handle Supabase native recovery format
      const type = hashParams.get('type')
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      console.log('🔄 Parsed params:', {
        type,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
      })

      if (type !== 'recovery') {
        console.error('❌ Invalid reset link format')
        setError('Invalid password reset link. Please request a new one.')
        setVerifying(false)
        return
      }

      if (!accessToken) {
        console.error('❌ Access token missing')
        setError('Invalid password reset link - security token is missing.')
        setVerifying(false)
        return
      }

      try {
        console.log('🔄 Setting session with tokens...')
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })

        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          if (sessionError.message.includes('expired') || sessionError.message.includes('invalid')) {
            setError('This password reset link has expired. Please request a new one.')
          } else {
            setError(`Failed to verify reset link: ${sessionError.message}`)
          }
          setVerifying(false)
          return
        }

        console.log('✅ Session established for:', data.session?.user?.email)
        setSessionReady(true)
        setVerifying(false)
      } catch (err: any) {
        console.error('❌ Recovery error:', err)
        setError(`Failed to verify reset link: ${err.message}`)
        setVerifying(false)
      }
    }

    handleRecovery()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      console.log('🔄 Updating password...')

      // Check if using custom token system
      const resetToken = (window as any).resetToken

      if (resetToken) {
        console.log('🔄 Using custom reset token')
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-reset-token`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: resetToken,
              newPassword: password
            }),
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update password')
        }
      } else {
        // Fallback to Supabase native method
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        })

        if (updateError) {
          throw updateError
        }
      }

      console.log('✅ Password updated successfully')
      setSuccess(true)

      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (err: any) {
      console.error('❌ Password update error:', err)
      setError(err.message)
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
            <span className="text-blue-900">Set New Password</span>
          </h1>
          <p className="text-gray-600">
            {success ? 'Password updated successfully!' : 'Enter your new password below'}
          </p>
        </div>

        {verifying ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mb-4"></div>
            <p className="text-gray-600">Verifying reset link...</p>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-800 text-sm font-medium mb-1">
                  Password Updated Successfully!
                </p>
                <p className="text-green-700 text-sm">
                  Redirecting you to the dashboard...
                </p>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-600 text-sm font-medium mb-1">Reset Link Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
            <button
              onClick={() => (window.location.href = '/')}
              className="w-full bg-blue-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-800 focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 transition-all"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
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
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">Must be at least 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-800 focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
