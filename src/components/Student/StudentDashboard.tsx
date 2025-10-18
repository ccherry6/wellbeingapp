import React, { useState } from 'react'
import { Calendar, TrendingUp, Settings, Award } from 'lucide-react'
import { WellbeingQuestionnaire } from './WellbeingQuestionnaire'
import { StudentProgress } from './StudentProgress'
import { ProgressTracker } from './ProgressTracker'
import { NotificationSettings } from '../Settings/NotificationSettings'
import { useAuth } from '../../hooks/useAuth'
import { format } from 'date-fns'

export function StudentDashboard() {
  const { user } = useAuth()
  const [selectedView, setSelectedView] = useState<'checkin' | 'progress' | 'tracker' | 'settings'>('checkin')
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
        <p className="text-gray-600 text-center">
          {format(new Date(), 'EEEE, MMMM do, yyyy')}
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
            <WellbeingQuestionnaire onSuccess={() => setSelectedView('tracker')} />
          </div>
        )}
        {selectedView === 'tracker' && user && <ProgressTracker userId={user.id} />}
        {selectedView === 'progress' && <StudentProgress />}
        {selectedView === 'settings' && <NotificationSettings />}
      </div>
    </div>
  )
}