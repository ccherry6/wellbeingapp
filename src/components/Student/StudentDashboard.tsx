import React, { useState, useEffect } from 'react'
import { Calendar, TrendingUp, Settings, Award } from 'lucide-react'
import { WellbeingQuestionnaire } from './WellbeingQuestionnaire'
import { StudentProgress } from './StudentProgress'
import { ProgressTracker } from './ProgressTracker'
import { NotificationSettings } from '../Settings/NotificationSettings'
import { ConsentModal } from './ConsentModal'
import { SkipConfirmation } from './SkipConfirmation'
import { useAuth } from '../../hooks/useAuth'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabase'

export function StudentDashboard() {
  const { user } = useAuth()
  const [selectedView, setSelectedView] = useState<'checkin' | 'progress' | 'tracker' | 'settings'>('checkin')
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [hasSkipped, setHasSkipped] = useState(false)
  const [consentChoice, setConsentChoice] = useState<'participate' | 'skip' | null>(null)

  useEffect(() => {
    if (selectedView === 'checkin') {
      const sessionChoice = sessionStorage.getItem('consent_choice_session')
      if (sessionChoice === 'participate') {
        setConsentChoice('participate')
        setShowConsentModal(false)
      } else if (sessionChoice === 'skip') {
        setConsentChoice('skip')
        setHasSkipped(true)
        setShowConsentModal(false)
      } else {
        setShowConsentModal(true)
        setConsentChoice(null)
      }
    }
  }, [selectedView])

  const handleParticipate = async () => {
    setConsentChoice('participate')
    setShowConsentModal(false)
    setHasSkipped(false)

    if (user) {
      try {
        await supabase.from('consent_log').insert({
          user_id: user.id,
          consent_given: true,
          consent_version: 'v1.0',
          session_id: sessionStorage.getItem('session_id') || null
        })

        await supabase
          .from('user_profiles')
          .update({
            consent_given: true,
            consent_date: new Date().toISOString(),
            consent_version: 'v1.0'
          })
          .eq('id', user.id)
      } catch (error) {
        console.error('Error logging consent:', error)
      }
    }
  }

  const handleSkip = async () => {
    setConsentChoice('skip')
    setShowConsentModal(false)
    setHasSkipped(true)

    if (user) {
      try {
        await supabase.from('consent_log').insert({
          user_id: user.id,
          consent_given: false,
          consent_version: 'v1.0',
          session_id: sessionStorage.getItem('session_id') || null
        })
      } catch (error) {
        console.error('Error logging skip:', error)
      }
    }
  }

  const handleChangeMindsCompleteCheckIn = () => {
    setHasSkipped(false)
    setConsentChoice('participate')
    sessionStorage.setItem('consent_choice_session', 'participate')
  }

  const handleViewProgressFromSkip = () => {
    setSelectedView('tracker')
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-center mb-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to your Wellbeing Hub
          </h1>
          <img
            src="/BDC Logo.jpg"
            alt="BDC Logo"
            className="h-10 w-auto ml-4 object-contain"
          />
        </div>
        <p className="text-gray-600 text-center mb-1">
          {format(new Date(), 'EEEE, MMMM do, yyyy')}
        </p>
        <p className="text-sm text-blue-600 text-center font-medium">
          Your participation is always your choice
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 justify-center flex-wrap">
          <button
            onClick={() => setSelectedView('checkin')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'checkin'
                ? 'bg-blue-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Daily Check-in
          </button>
          <button
            onClick={() => setSelectedView('tracker')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'tracker'
                ? 'bg-blue-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Award className="w-4 h-4 inline mr-2" />
            Streaks & Progress
          </button>
          <button
            onClick={() => setSelectedView('progress')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'progress'
                ? 'bg-blue-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Trends
          </button>
          <button
            onClick={() => setSelectedView('settings')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'settings'
                ? 'bg-blue-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Settings
          </button>
        </div>

        {/* Content Area */}
        {selectedView === 'checkin' && (
          <div>
            {showConsentModal && (
              <ConsentModal
                onParticipate={handleParticipate}
                onSkip={handleSkip}
                showRememberOption={true}
              />
            )}
            {!showConsentModal && hasSkipped && (
              <SkipConfirmation
                onCompleteCheckIn={handleChangeMindsCompleteCheckIn}
                onViewProgress={handleViewProgressFromSkip}
              />
            )}
            {!showConsentModal && !hasSkipped && consentChoice === 'participate' && (
              <WellbeingQuestionnaire
                onSuccess={() => setSelectedView('tracker')}
                onSkip={handleSkip}
              />
            )}
          </div>
        )}
        {selectedView === 'tracker' && user && <ProgressTracker userId={user.id} />}
        {selectedView === 'progress' && <StudentProgress />}
        {selectedView === 'settings' && <NotificationSettings />}
      </div>
    </div>
  )
}