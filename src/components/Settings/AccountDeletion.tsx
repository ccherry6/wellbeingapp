import React, { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export function AccountDeletion() {
  const { user } = useAuth()
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE MY ACCOUNT') {
      setError('Please type "DELETE MY ACCOUNT" exactly to confirm')
      return
    }

    setDeleting(true)
    setError(null)

    try {
      const { data, error: deleteError } = await supabase.functions.invoke('delete-account', {
        body: { userId: user?.id }
      })

      if (deleteError) {
        throw deleteError
      }

      if (data.error) {
        throw new Error(data.error)
      }

      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (err) {
      console.error('Account deletion error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete account. Please contact support.')
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
      <div className="flex items-center mb-6">
        <Trash2 className="w-6 h-6 text-red-500 mr-3" />
        <h2 className="text-xl font-semibold text-gray-900">Delete Account</h2>
      </div>

      {!showConfirmation ? (
        <div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-red-900 mb-2">Warning: This action cannot be undone</h3>
                <p className="text-sm text-red-700 mb-2">
                  Deleting your account will permanently remove:
                </p>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                  <li>Your profile information</li>
                  <li>All wellbeing check-in data and history</li>
                  <li>Progress tracking and streaks</li>
                  <li>Notification settings</li>
                  <li>All associated records</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            If you're having issues with the app or have concerns, please contact your coach or administrator before deleting your account.
          </p>

          <button
            onClick={() => setShowConfirmation(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Proceed to Delete Account
          </button>
        </div>
      ) : (
        <div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-red-900 mb-2">Final Confirmation Required</h3>
                <p className="text-sm text-red-700">
                  This is your last chance. Once you confirm, your account and all data will be permanently deleted.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="confirm-text" className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-bold">DELETE MY ACCOUNT</span> to confirm
            </label>
            <input
              id="confirm-text"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={deleting}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleDeleteAccount}
              disabled={deleting || confirmText !== 'DELETE MY ACCOUNT'}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? 'Deleting Account...' : 'Permanently Delete My Account'}
            </button>
            <button
              onClick={() => {
                setShowConfirmation(false)
                setConfirmText('')
                setError(null)
              }}
              disabled={deleting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
