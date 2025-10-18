import React, { useState } from 'react'
import { ArrowLeft, QrCode, Scan } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface QRLoginProps {
  onBack: () => void
  onSuccess: () => void
}

export function QRLogin({ onBack, onSuccess }: QRLoginProps) {
  const [qrToken, setQrToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signInWithQR } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await signInWithQR(qrToken)
      if (error) throw error
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
           type="button"
            className="mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">QR Code Login</h1>
        </div>

        <div className="text-center mb-8">
          <img 
            src="/BDC Logo.jpg" 
            alt="BDC Logo" 
            className="h-20 w-auto mx-auto mb-4 object-contain"
          />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">BDC Thrive</h2>
          <p className="text-gray-600">
            Scan the QR code provided by your coach or enter the code manually
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              QR Code or Session Token
            </label>
            <div className="relative">
              <Scan className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                placeholder="Enter QR code or token"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !qrToken.trim()}
            className="w-full bg-gradient-to-r from-blue-900 to-red-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-800 hover:to-red-700 focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Verifying...' : 'Login with QR Code'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">How to use QR Login:</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Ask your coach for a QR code</li>
            <li>2. Scan it with your phone camera or QR app</li>
            <li>3. Enter the code shown in the field above</li>
          </ol>
        </div>
      </div>
    </div>
  )
}