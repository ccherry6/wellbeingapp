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
      console.log('🔄 UpdatePassword: Starting password reset flow')
      console.log('🔄 Full URL:', window.location.href)

      if (!window.location.hash) {
        console.error('❌ No hash parameters found')
        setError('Invalid password reset link. The link may be incomplete or corrupted.')
        setVerifying(false)
        return
      }

      const hash = window.location.hash.substring(1)
      console.log('🔄 Hash content:', hash)

      const hashParams = new URLSearchParams(hash)
      const resetToken = hashParams.get('reset')

      if (resetToken) {
        console.log('✅ Password reset token detected:', resetToken.substring(0, 10) + '...')
        ;(window as any).resetToken = resetToken
        setSessionReady(true)
        setVerifying(false)
        return
      }

      console.error('❌ No valid reset token found in URL')
      setError('Invalid password reset link. Please request a new password reset email.')
      setVerifying(false)
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
      const resetToken = (window as any).resetToken

      if (!resetToken) {
        throw new Error('Reset token is missing. Please use the link from your email.')
      }

      console.log('🔄 Calling password reset API...')

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
        console.error('❌ API error:', data)
        throw new Error(data.error || data.details || 'Failed to update password')
      }

      console.log('✅ Password updated successfully:', data.message)
      setSuccess(true)

      setTimeout(() => {
        console.log('🔄 Redirecting to login...')
        window.location.href = '/'
      }, 2500)
    } catch (err: any) {
      console.error('❌ Password update error:', err)
      setError(err.message || 'An error occurred while updating your password')
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
        ) : error && !sessionReady ? (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-600 text-sm font-medium mb-1">Reset Link Error</p>
                <p className="text-red-600 text-sm mb-2">{error}</p>
                <p className="text-xs text-red-500">
                  Please click "Forgot Password" on the login page to request a new reset link.
                </p>
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
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

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
              className="w-full bg-gradient-to-r from-blue-900 to-red-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-800 hover:to-red-700 focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>

            <button
              type="button"
              onClick={() => (window.location.href = '/')}
              className="w-full text-blue-900 hover:text-blue-800 font-medium py-2"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
