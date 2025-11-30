import React, { useState } from 'react'
import { Heart, CheckCircle, Info, Shield, Users } from 'lucide-react'
import { BDCLogo } from '../BDCLogo'

interface ConsentModalProps {
  onParticipate: () => void
  onSkip: () => void
  showRememberOption?: boolean
}

export function ConsentModal({ onParticipate, onSkip, showRememberOption = true }: ConsentModalProps) {
  const [rememberChoice, setRememberChoice] = useState(false)

  const handleParticipate = () => {
    if (rememberChoice) {
      sessionStorage.setItem('consent_choice_session', 'participate')
    }
    onParticipate()
  }

  const handleSkip = () => {
    if (rememberChoice) {
      sessionStorage.setItem('consent_choice_session', 'skip')
    }
    onSkip()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <BDCLogo className="h-20 sm:h-24 w-auto" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Wellbeing Check-in
            </h2>
            <p className="text-lg text-gray-600">
              Your participation is completely voluntary
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Heart className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">
                    Would you like to complete your wellbeing check-in today?
                  </h3>
                  <p className="text-sm text-blue-800">
                    This helps your coaches understand how you're feeling and provide better support.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  <strong>Completely voluntary</strong> - You can skip any day without any consequences
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  <strong>No impact on your position</strong> - Your place in the HPP squad is never affected by participation
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  <strong>No impact on research</strong> - Research findings are not affected if you choose not to participate
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  <strong>Your data is protected</strong> - All information is confidential and securely stored
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  <strong>Support is always available</strong> - You can speak to school staff anytime, regardless of participation
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600">
                  Your wellbeing data helps coaches provide personalized support and may contribute to research
                  about student-athlete wellness. Participation is entirely your choice, and you can change your mind at any time.
                </p>
              </div>
            </div>
          </div>

          {showRememberOption && (
            <div className="mb-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberChoice}
                  onChange={(e) => setRememberChoice(e.target.checked)}
                  className="w-4 h-4 text-blue-900 border-gray-300 rounded focus:ring-blue-900"
                />
                <span className="text-sm text-gray-700">
                  Remember my choice for this session (until I log out)
                </span>
              </label>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleParticipate}
              className="flex-1 bg-gradient-to-r from-blue-900 to-blue-700 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-800 hover:to-blue-600 transition-all shadow-lg flex items-center justify-center space-x-2"
            >
              <Heart className="w-5 h-5" />
              <span>Yes, I'd like to participate today</span>
            </button>

            <button
              onClick={handleSkip}
              className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-all border-2 border-gray-300"
            >
              Not today, skip check-in
            </button>
          </div>

          <p className="text-xs text-center text-gray-500 mt-4">
            By participating, you confirm you're doing so voluntarily today
          </p>
        </div>
      </div>
    </div>
  )
}
