import React, { useState } from 'react'
import { Save, Moon, Zap, Dumbbell, Heart, Brain, Users, Trophy, MessageCircle, ChevronDown, AlertTriangle, Activity } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { BDCLogo } from '../BDCLogo'
import { formatDateForInput, formatDateTimeAEST } from '../../lib/dateUtils'

// School staff directory - you can easily update this list
const schoolStaff = [
  { name: 'Chris Cherry', email: 'ccherry@bdc.nsw.edu.au', role: 'Teacher PDHPE/HPP' },
  { name: 'Nat Titcume', email: 'ntitcume@bdc.nsw.edu.au', role: 'Teacher PDHPE/HPP' },
  { name: 'Sarah Stokes', email: 'sstokes@bdc.nsw.edu.au', role: 'Head of Primary' },
  { name: 'Sue Oconnor', email: 'sueoconnor@bdc.nsw.edu.au', role: 'Head of Secondary' },
  { name: 'Pat Galvin', email: 'pgalvin@bdc.nsw.edu.au', role: 'Primary Wellbeing Support' },
  { name: 'Andrea Wiffen', email: 'awiffen@bdc.nsw.edu.au', role: 'Director of Student Wellbeing' }
]

const questions = [
  {
    key: 'sleep_quality',
    question: 'How would you rate your sleep quality last night?',
    icon: Moon,
    color: 'purple',
    lowLabel: 'Very Poor',
    highLabel: 'Excellent'
  },
  {
    key: 'sleep_hours',
    question: 'How many hours of sleep did you get last night?',
    icon: Moon,
    color: 'purple',
    lowLabel: '0-3 hours',
    highLabel: '10+ hours',
    isHours: true
  },
  {
    key: 'energy_level',
    question: 'How are your energy levels today?',
    icon: Zap,
    color: 'yellow',
    lowLabel: 'Very Low',
    highLabel: 'Very High'
  },
  {
    key: 'training_fatigue',
    question: 'How fatigued from training do you feel today?',
    icon: Dumbbell,
    color: 'orange',
    lowLabel: 'Not Fatigued',
    highLabel: 'Very Fatigued'
  },
  {
    key: 'muscle_soreness',
    question: 'Rate your muscle soreness/stiffness today?',
    icon: Dumbbell,
    color: 'red',
    lowLabel: 'No Soreness',
    highLabel: 'Very Sore'
  },
  {
    key: 'mood',
    question: 'How would you describe your mood today?',
    icon: Heart,
    color: 'pink',
    lowLabel: 'Very Low',
    highLabel: 'Excellent'
  },
  {
    key: 'stress_level',
    question: 'How stressed are you feeling today?',
    icon: Brain,
    color: 'red',
    lowLabel: 'Not Stressed',
    highLabel: 'Very Stressed'
  },
  {
    key: 'academic_pressure',
    question: 'How much academic pressure are you experiencing?',
    icon: Brain,
    color: 'blue',
    lowLabel: 'No Pressure',
    highLabel: 'High Pressure'
  },
  {
    key: 'relationship_satisfaction',
    question: 'How satisfied with your relationships are you today?',
    icon: Users,
    color: 'green',
    lowLabel: 'Not Satisfied',
    highLabel: 'Very Satisfied'
  },
  {
    key: 'program_belonging',
    question: 'How much do you feel like you belong to the High Performance Sport Program today?',
    icon: Trophy,
    color: 'indigo',
    lowLabel: 'Don\'t Belong',
    highLabel: 'Fully Belong'
  }
]

interface WellbeingQuestionnaireProps {
  onSuccess?: () => void
}

export function WellbeingQuestionnaire({ onSuccess }: WellbeingQuestionnaireProps) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [responses, setResponses] = useState<Record<string, number>>({
    sleep_quality: 5,
    sleep_hours: 8,
    energy_level: 5,
    training_fatigue: 5,
    muscle_soreness: 5,
    mood: 5,
    stress_level: 5,
    academic_pressure: 5,
    relationship_satisfaction: 5,
    program_belonging: 5
  })
  const [notes, setNotes] = useState('')
  const [wantsToSpeak, setWantsToSpeak] = useState(false)
  const [isInjuredOrSick, setIsInjuredOrSick] = useState(false)
  const [injurySicknessNotes, setInjurySicknessNotes] = useState('')
  const [speakToWho, setSpeakToWho] = useState('')
  const [speakToEmail, setSpeakToEmail] = useState('')
  const [hrv, setHrv] = useState<string>('')
  const [restingHeartRate, setRestingHeartRate] = useState<string>('')
  const [showStaffDropdown, setShowStaffDropdown] = useState(false)
  const [filteredStaff, setFilteredStaff] = useState(schoolStaff)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [checkingSubmission, setCheckingSubmission] = useState(true)

  React.useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return

      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (data) {
          setProfile(data)
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      }
    }

    fetchUserProfile()
  }, [user])

  React.useEffect(() => {
    const checkTodaySubmission = async () => {
      if (!user) return

      const today = formatDateForInput(new Date())

      try {
        const { data, error } = await supabase
          .from('wellness_entries')
          .select('id')
          .eq('user_id', user.id)
          .eq('entry_date', today)
          .maybeSingle()

        if (!error && data) {
          setAlreadySubmitted(true)
        }
      } catch (err) {
        // Silently handle error
      } finally {
        setCheckingSubmission(false)
      }
    }

    checkTodaySubmission()
  }, [user])

  const handleStaffSearch = (value: string) => {
    setSpeakToWho(value)
    
    if (value.length > 0) {
      const filtered = schoolStaff.filter(staff => 
        staff.name.toLowerCase().includes(value.toLowerCase()) ||
        staff.role.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredStaff(filtered)
      setShowStaffDropdown(true)
    } else {
      setFilteredStaff(schoolStaff)
      setShowStaffDropdown(false)
    }
  }

  const selectStaff = (staff: typeof schoolStaff[0]) => {
    setSpeakToWho(staff.name)
    setSpeakToEmail(staff.email)
    setShowStaffDropdown(false)
  }

  const handleSliderChange = (key: string, value: number) => {
    setResponses(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    console.log('🔄 STARTING WELLNESS ENTRY SUBMISSION')
    console.log('🔄 User ID:', user.id)
    console.log('🔄 Entry date:', formatDateForInput(new Date()))
    console.log('🔄 Responses:', responses)
    console.log('🔄 Environment check:', {
      hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
      hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      supabaseUrlStart: import.meta.env.VITE_SUPABASE_URL?.substring(0, 20) + '...',
      supabaseKeyStart: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 10) + '...'
    })

    setSaving(true)
    setError(null)

    // Test basic Supabase connection first
    try {
      console.log('🔍 TESTING SUPABASE CONNECTION...')
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1)
        .single()
      
      console.log('🔍 Connection test result:', { testData, testError })
      
      if (testError) {
        console.error('❌ SUPABASE CONNECTION FAILED:', testError)
        throw new Error(`Database connection failed: ${testError.message}`)
      }
      
      console.log('✅ SUPABASE CONNECTION SUCCESSFUL')
    } catch (connectionError) {
      console.error('❌ CONNECTION TEST EXCEPTION:', connectionError)
      setError(`Connection test failed: ${connectionError instanceof Error ? connectionError.message : 'Unknown connection error'}`)
      setSaving(false)
      return
    }

    // Check that user profile exists in database
    try {
      console.log('🔍 CHECKING USER PROFILE EXISTS...')
      const { data: profileCheck, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      console.log('🔍 Profile check result:', { profileCheck, profileError })

      if (profileError || !profileCheck) {
        console.error('❌ PROFILE CHECK FAILED:', profileError)
        setError(`User profile not found: ${profileError?.message || 'Profile does not exist'}. Please refresh the page and try again.`)
        setSaving(false)
        return
      }
      console.log('✅ USER PROFILE EXISTS')
    } catch (profileCheckError) {
      console.error('❌ PROFILE CHECK EXCEPTION:', profileCheckError)
      setError(`Unable to verify user profile: ${profileCheckError instanceof Error ? profileCheckError.message : 'Unknown error'}. Please refresh and try again.`)
      setSaving(false)
      return
    }

    // Prepare the data to insert
    const entryData: any = {
      user_id: user.id,
      entry_date: formatDateForInput(new Date()),
      ...responses,
      notes: notes.trim() || null,
      wants_to_speak: wantsToSpeak
    }

    // Only include injury/sickness fields if the user indicated they are injured/sick
    if (isInjuredOrSick) {
      entryData.is_injured_or_sick = true
      if (injurySicknessNotes.trim()) {
        entryData.injury_sickness_notes = injurySicknessNotes.trim()
      }
    }

    // Only include speak-to fields if the user wants to speak to someone
    if (wantsToSpeak) {
      if (speakToWho.trim()) {
        entryData.speak_to_who = speakToWho.trim()
      }
      if (speakToEmail.trim()) {
        entryData.speak_to_email = speakToEmail.trim()
      }
    }

    // Include biometric fields if provided
    if (hrv.trim()) {
      const hrvValue = parseInt(hrv.trim())
      if (!isNaN(hrvValue) && hrvValue > 0) {
        entryData.hrv = hrvValue
      }
    }
    if (restingHeartRate.trim()) {
      const rhrValue = parseInt(restingHeartRate.trim())
      if (!isNaN(rhrValue) && rhrValue > 0) {
        entryData.resting_heart_rate = rhrValue
      }
    }

    console.log('💾 PREPARED ENTRY DATA:', entryData)

    try {
      console.log('💾 ATTEMPTING TO SAVE WELLNESS ENTRY...')
      // First save the wellness entry
      const { error } = await supabase
        .from('wellness_entries')
        .upsert(entryData, {
          onConflict: 'user_id,entry_date'
        })
      
      if (error) {
        console.error('❌ WELLNESS ENTRY SAVE ERROR:', error)
        console.error('❌ ERROR DETAILS:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          fullError: error
        })
        throw error
      }
      
      console.log('✅ WELLNESS ENTRY SAVED SUCCESSFULLY')

      // Check for low metrics and send alert
      const alertMessages: string[] = []
      if (responses.sleep_quality <= 3) {
        alertMessages.push(`Sleep Quality: ${responses.sleep_quality}/10 (Critical)`)
      }
      if (responses.sleep_hours <= 5) {
        alertMessages.push(`Sleep Hours: ${responses.sleep_hours} hours (Critical)`)
      }
      if (responses.energy_level <= 3) {
        alertMessages.push(`Energy Level: ${responses.energy_level}/10 (Critical)`)
      }
      if (responses.mood <= 3) {
        alertMessages.push(`Mood: ${responses.mood}/10 (Critical)`)
      }
      if (responses.relationship_satisfaction <= 3) {
        alertMessages.push(`Relationship Satisfaction: ${responses.relationship_satisfaction}/10 (Critical)`)
      }
      if (responses.program_belonging <= 3) {
        alertMessages.push(`Program Belonging: ${responses.program_belonging}/10 (Critical)`)
      }
      if (responses.stress_level >= 8) {
        alertMessages.push(`Stress Level: ${responses.stress_level}/10 (High)`)
      }
      if (responses.academic_pressure >= 8) {
        alertMessages.push(`Academic Pressure: ${responses.academic_pressure}/10 (High)`)
      }
      if (responses.training_fatigue >= 8) {
        alertMessages.push(`Training Fatigue: ${responses.training_fatigue}/10 (High)`)
      }
      if (isInjuredOrSick) {
        alertMessages.push('Student is injured or sick')
      }

      // Send alert email if there are critical metrics
      if (alertMessages.length > 0) {
        try {
          console.log('🚨 SENDING LOW METRIC ALERT...')
          const { error: alertError } = await supabase.functions.invoke('send-low-metric-alert', {
            body: {
              studentName: profile?.full_name || user.email || 'Unknown Student',
              studentEmail: user.email || 'No email',
              studentId: profile?.student_id || 'N/A',
              sport: profile?.sport || 'N/A',
              entryDate: formatDateForInput(new Date()),
              alerts: alertMessages,
              notes: notes || null,
              injurySicknessNotes: isInjuredOrSick ? injurySicknessNotes : null
            }
          })

          if (alertError) {
            console.warn('⚠️ ALERT EMAIL FAILED (NON-CRITICAL):', alertError)
          } else {
            console.log('✅ ALERT EMAIL SENT SUCCESSFULLY')
          }
        } catch (alertError) {
          console.warn('⚠️ ALERT EMAIL EXCEPTION (NON-CRITICAL):', alertError)
        }
      }

      // If they want to speak to someone and provided an email, send notification
      if (wantsToSpeak && speakToEmail.trim() && speakToWho.trim()) {
        try {
          console.log('📧 ATTEMPTING TO SEND SPEAK REQUEST EMAIL...')
          const { error: emailError } = await supabase.functions.invoke('send-speak-request-email', {
            body: {
              studentName: user.email || 'A student',
              studentEmail: user.email,
              recipientName: speakToWho.trim(),
              recipientEmail: speakToEmail.trim(),
              studentId: 'N/A',
              sport: 'N/A'
            }
          })

          if (emailError) {
            console.warn('⚠️ EMAIL SEND FAILED (NON-CRITICAL):', emailError)
            // Don't fail the whole submission if email fails
          }
          console.log('✅ EMAIL SENT SUCCESSFULLY')
        } catch (emailError) {
          console.warn('⚠️ EMAIL SEND EXCEPTION (NON-CRITICAL):', emailError)
          // Don't fail the whole submission if email fails
        }
      }
      
      console.log('🎉 SUBMISSION COMPLETED SUCCESSFULLY')
      setLastSaved(new Date())
      setNotes('')
      setWantsToSpeak(false)
      setIsInjuredOrSick(false)
      setInjurySicknessNotes('')
      setSpeakToWho('')
      setSpeakToEmail('')
      setHrv('')
      setRestingHeartRate('')
      setShowStaffDropdown(false)

      // Mark as completed for today in localStorage for notifications
      const today = formatDateForInput(new Date())
      localStorage.setItem(`completed_${user.id}_${today}`, 'true')

      onSuccess?.()
    } catch (error) {
      console.error('❌ SUBMISSION FAILED:', error)
      console.error('❌ FULL ERROR OBJECT:', JSON.stringify(error, null, 2))
      
      let errorMessage = 'Unknown error'
      if (error instanceof Error) {
        errorMessage = error.message
        console.error('❌ ERROR INSTANCE DETAILS:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause
        })
      } else {
        console.error('❌ NON-ERROR OBJECT THROWN:', typeof error, error)
      }
      
      // Provide more specific error messages based on common issues
      if (errorMessage.includes('JWT')) {
        errorMessage = 'Authentication expired. Please refresh the page and try again.'
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        errorMessage = 'Network connection issue. Please check your internet and try again.'
      } else if (errorMessage.includes('permission') || errorMessage.includes('policy')) {
        errorMessage = 'Permission denied. Please refresh the page and try again.'
      }
      
      console.error('❌ FINAL ERROR MESSAGE:', errorMessage)
      setError(`Failed to save: ${errorMessage}`)
    } finally {
      console.log('🏁 SUBMISSION PROCESS COMPLETED (success or failure)')
      setSaving(false)
    }
  }

  const getColorClasses = (color: string) => {
    const colors = {
      purple: 'text-purple-500',
      yellow: 'text-yellow-500',
      green: 'text-green-500',
      orange: 'text-orange-500',
      red: 'text-red-500',
      pink: 'text-pink-500',
      blue: 'text-blue-500',
      indigo: 'text-indigo-500'
    }
    return colors[color as keyof typeof colors] || 'text-gray-500'
  }

  const getBackgroundClasses = (color: string) => {
    const backgrounds = {
      purple: 'bg-purple-50 border-purple-200',
      yellow: 'bg-yellow-50 border-yellow-200',
      green: 'bg-green-50 border-green-200',
      orange: 'bg-orange-50 border-orange-200',
      red: 'bg-red-50 border-red-200',
      pink: 'bg-pink-50 border-pink-200',
      blue: 'bg-blue-50 border-blue-200',
      indigo: 'bg-indigo-50 border-indigo-200'
    }
    return backgrounds[color as keyof typeof backgrounds] || 'bg-gray-50 border-gray-200'
  }

  if (checkingSubmission) {
    return (
      <div className="w-full max-w-6xl mx-auto p-3 sm:p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-8 text-center">
          <div className="flex justify-center mb-4">
            <BDCLogo className="h-12 sm:h-16 w-auto" />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking today's submission...</p>
        </div>
      </div>
    )
  }

  if (alreadySubmitted) {
    return (
      <div className="w-full max-w-6xl mx-auto p-3 sm:p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <BDCLogo className="h-12 sm:h-16 w-auto" />
            </div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Save className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Already Checked In Today
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              You've already completed your daily wellbeing check-in for today. Come back tomorrow!
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors font-medium"
            >
              View Your Progress
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BDCLogo className="h-12 sm:h-16 w-auto" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Daily Wellbeing Check-in
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Help us understand how you're feeling today
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}
          
          {/* Group questions into pairs for mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {questions.map((question) => {
            const IconComponent = question.icon
            const value = responses[question.key]
            
            return (
              <div key={question.key} className={`${getBackgroundClasses(question.color)} rounded-xl p-4 space-y-3 border-2`}>
                <div className="flex items-start space-x-3">
                  <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 ${getColorClasses(question.color)} mt-1 flex-shrink-0`} />
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 leading-tight">
                    {question.question}
                  </h3>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-lg sm:text-xl font-bold text-gray-900 bg-white px-3 py-1 rounded-full border-2 border-gray-200">
                      {question.isHours ? `${value} hours` : `${value}/10`}
                    </span>
                  </div>
                  
                  <input
                    type="range"
                    min={question.isHours ? "0" : "1"}
                    max="10"
                    value={value}
                    onChange={(e) => handleSliderChange(question.key, Number(e.target.value))}
                    className="w-full h-2 sm:h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-navy-red"
                  />
                  
                  <div className="flex justify-between text-xs text-gray-600 mt-2">
                    <span className="text-left max-w-[45%]">{question.lowLabel}</span>
                    <span className="text-right max-w-[45%]">{question.highLabel}</span>
                  </div>
                </div>
              </div>
            )
          })}
          </div>

          <div className="space-y-4 mt-6 p-4 bg-teal-50 rounded-xl border-2 border-teal-200">
            <div className="flex items-start space-x-3 mb-4">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-medium text-teal-900 mb-1">
                  Wearable Device Data (Optional)
                </h3>
                <p className="text-xs sm:text-sm text-teal-700 mb-3">
                  If you wear a device like Whoop or Garmin to bed, you can record your overnight metrics here
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-teal-900 mb-2">
                  Heart Rate Variability (HRV) - ms
                </label>
                <input
                  type="number"
                  value={hrv}
                  onChange={(e) => setHrv(e.target.value)}
                  placeholder="e.g., 65"
                  min="0"
                  className="w-full px-3 py-2 border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-teal-600 mt-1">
                  Your overnight average HRV in milliseconds
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-teal-900 mb-2">
                  Resting Heart Rate - bpm
                </label>
                <input
                  type="number"
                  value={restingHeartRate}
                  onChange={(e) => setRestingHeartRate(e.target.value)}
                  placeholder="e.g., 55"
                  min="0"
                  className="w-full px-3 py-2 border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-teal-600 mt-1">
                  Your overnight resting heart rate in beats per minute
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-6">
            <label className="block text-base sm:text-lg font-medium text-gray-900">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional thoughts, concerns, or details you'd like to share..."
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm sm:text-base"
              rows={3}
            />
          </div>

          <div className="space-y-4 mt-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-medium text-orange-900 mb-3">
                  Are you currently injured or sick?
                </h3>
                
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-sm text-orange-800">No</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInjuredOrSick}
                      onChange={(e) => setIsInjuredOrSick(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-orange-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-orange-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                  <span className="text-sm text-orange-800">Yes</span>
                </div>

                {isInjuredOrSick && (
                  <div>
                    <label className="block text-sm font-medium text-orange-900 mb-2">
                      Can you provide more information about this?
                    </label>
                    <textarea
                      value={injurySicknessNotes}
                      onChange={(e) => setInjurySicknessNotes(e.target.value)}
                      placeholder="Please describe your injury or illness, when it started, and how it's affecting you..."
                      className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none"
                      rows={3}
                    />
                    <p className="text-xs text-orange-700 mt-1">
                      This information helps your coaches provide appropriate support and modify training if needed.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start space-x-3">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-medium text-blue-900 mb-3">
                  Would you like to speak to anybody from the school?
                </h3>
                
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-sm text-blue-800">No</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wantsToSpeak}
                      onChange={(e) => setWantsToSpeak(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-blue-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-blue-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-sm text-blue-800">Yes</span>
                </div>

                {wantsToSpeak && (
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="block text-sm font-medium text-blue-900 mb-2">
                        Who would you like to speak to?
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={speakToWho}
                          onChange={(e) => handleStaffSearch(e.target.value)}
                          onFocus={() => setShowStaffDropdown(true)}
                          placeholder="Start typing a name or role..."
                          className="w-full px-3 py-2 pr-8 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400" />
                        
                        {showStaffDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-blue-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {filteredStaff.length > 0 ? (
                              filteredStaff.map((staff, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => selectStaff(staff)}
                                  className="w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-blue-100 last:border-b-0"
                                >
                                  <div className="font-medium text-blue-900">{staff.name}</div>
                                  <div className="text-xs text-blue-600">{staff.role}</div>
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-blue-600">
                                No staff found. You can still type a custom name.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-2">
                        Email address
                      </label>
                      <input
                        type="email"
                        value={speakToEmail}
                        onChange={(e) => setSpeakToEmail(e.target.value)}
                        placeholder="Email will auto-fill when you select from the list above"
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required={wantsToSpeak}
                      />
                      <p className="text-xs text-blue-700 mt-1">
                        An email will be sent automatically to let them know you'd like to speak with them.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-blue-900 to-red-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-medium hover:from-blue-800 hover:to-red-700 focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center text-sm sm:text-base"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {saving ? 'Saving Responses...' : 'Submit Daily Check-in'}
            </button>

            {lastSaved && (
              <p className="text-xs sm:text-sm text-gray-500 text-center mt-3">
                Last submitted: {formatDateTimeAEST(lastSaved)}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}