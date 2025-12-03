import React, { useState, useEffect } from 'react'
import { Flame, Award, TrendingUp, Calendar, Target, Star, X, Moon, Zap, Dumbbell, Heart, Brain, Users, Trophy, MessageCircle, Activity } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { format, parseISO, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns'

interface WellnessEntry {
  entry_date: string
  created_at: string
}

interface WellnessEntryDetail {
  entry_date: string
  sleep_quality: number
  sleep_hours: number
  energy_level: number
  training_fatigue: number
  muscle_soreness: number
  mood: number
  stress_level: number
  academic_pressure: number
  relationship_satisfaction: number
  program_belonging: number
  notes: string
  hrv: number | null
  resting_heart_rate: number | null
  created_at: string
}

interface ProgressTrackerProps {
  userId: string
}

export function ProgressTracker({ userId }: ProgressTrackerProps) {
  const [entries, setEntries] = useState<WellnessEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [totalCheckIns, setTotalCheckIns] = useState(0)
  const [thisMonthCheckIns, setThisMonthCheckIns] = useState(0)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<WellnessEntryDetail | null>(null)
  const [loadingEntry, setLoadingEntry] = useState(false)

  useEffect(() => {
    fetchProgress()
  }, [userId])

  const fetchProgress = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('wellness_entries')
        .select('entry_date, created_at')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })

      if (error) throw error

      setEntries(data)
      setTotalCheckIns(data.length)

      calculateStreaks(data)
      calculateMonthlyCheckIns(data)
    } catch (error) {
      console.error('Error fetching progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStreaks = (data: WellnessEntry[]) => {
    if (data.length === 0) {
      setCurrentStreak(0)
      setLongestStreak(0)
      return
    }

    const uniqueDates = [...new Set(data.map(e => e.entry_date))].sort().reverse()

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    let isCurrentStreakActive = false

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < uniqueDates.length; i++) {
      const entryDate = parseISO(uniqueDates[i])
      entryDate.setHours(0, 0, 0, 0)

      if (i === 0) {
        const daysDiff = differenceInDays(today, entryDate)
        if (daysDiff === 0 || daysDiff === 1) {
          tempStreak = 1
          currentStreak = 1
          isCurrentStreakActive = true
        } else {
          currentStreak = 0
          tempStreak = 1
          isCurrentStreakActive = false
        }
      } else {
        const prevDate = parseISO(uniqueDates[i - 1])
        prevDate.setHours(0, 0, 0, 0)
        const daysDiff = differenceInDays(prevDate, entryDate)

        if (daysDiff === 1) {
          tempStreak++
          if (isCurrentStreakActive) {
            currentStreak++
          }
        } else {
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak
          }
          tempStreak = 1
          isCurrentStreakActive = false
        }
      }
    }

    if (tempStreak > longestStreak) {
      longestStreak = tempStreak
    }

    setCurrentStreak(currentStreak)
    setLongestStreak(Math.max(longestStreak, currentStreak))
  }

  const calculateMonthlyCheckIns = (data: WellnessEntry[]) => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const thisMonth = data.filter(entry => {
      const entryDate = parseISO(entry.entry_date)
      return isWithinInterval(entryDate, { start: monthStart, end: monthEnd })
    })

    setThisMonthCheckIns(thisMonth.length)
  }

  const fetchEntryForDate = async (date: string) => {
    try {
      setLoadingEntry(true)
      const { data, error } = await supabase
        .from('wellness_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('entry_date', date)
        .maybeSingle()

      if (error) throw error

      setSelectedEntry(data)
      setSelectedDate(date)
    } catch (error) {
      console.error('Error fetching entry:', error)
    } finally {
      setLoadingEntry(false)
    }
  }

  const closeModal = () => {
    setSelectedDate(null)
    setSelectedEntry(null)
  }

  const getStreakMessage = () => {
    if (currentStreak === 0) return 'Start your streak today!'
    if (currentStreak === 1) return 'Great start! Keep it going!'
    if (currentStreak < 7) return `${currentStreak} days strong!`
    if (currentStreak < 30) return `Amazing! ${currentStreak} day streak!`
    return `Incredible! ${currentStreak} days in a row!`
  }

  const getCompletionRate = () => {
    const now = new Date()
    const daysInMonth = endOfMonth(now).getDate()
    const dayOfMonth = now.getDate()

    const expectedCheckIns = dayOfMonth
    const rate = expectedCheckIns > 0 ? (thisMonthCheckIns / expectedCheckIns) * 100 : 0
    return Math.min(100, Math.round(rate))
  }

  const getMonthlyCalendar = () => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // Calculate which day of week the month starts on (0 = Sunday)
    const startDayOfWeek = monthStart.getDay()

    // Create array of all days in the month
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Add padding days at the start
    const paddingDays = Array(startDayOfWeek).fill(null)

    const entryDates = new Set(entries.map(e => e.entry_date))

    const calendarDays = days.map(day => ({
      date: day,
      hasEntry: entryDates.has(format(day, 'yyyy-MM-dd')),
      isToday: format(day, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd'),
      isFuture: day > now
    }))

    return { paddingDays, calendarDays }
  }

  const achievements = [
    {
      icon: Flame,
      title: 'Current Streak',
      value: currentStreak,
      unit: currentStreak === 1 ? 'day' : 'days',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      message: getStreakMessage()
    },
    {
      icon: Award,
      title: 'Longest Streak',
      value: longestStreak,
      unit: longestStreak === 1 ? 'day' : 'days',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      message: longestStreak > 0 ? 'Personal best!' : 'Set your record!'
    },
    {
      icon: Target,
      title: 'This Month',
      value: thisMonthCheckIns,
      unit: 'check-ins',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      message: `${getCompletionRate()}% completion rate`
    },
    {
      icon: Star,
      title: 'Total Check-ins',
      value: totalCheckIns,
      unit: 'all time',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      message: totalCheckIns > 0 ? 'Keep going!' : 'Start tracking today!'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  const { paddingDays, calendarDays } = getMonthlyCalendar()
  const completionRate = getCompletionRate()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <TrendingUp className="w-7 h-7 mr-2 text-blue-600" />
            Your Progress
          </h2>
          <p className="text-gray-600 mt-1">Track your wellness journey</p>
          <p className="text-xs text-blue-600 mt-1 italic">Streaks are fun, but never required - participation is always voluntary</p>
        </div>
      </div>

      {currentStreak >= 3 && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-2">
              <Flame className="w-8 h-8" />
              <h3 className="text-2xl font-bold">{currentStreak} Day Streak!</h3>
            </div>
            <p className="text-orange-100">You're on fire! Keep checking in daily to maintain your streak.</p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-20">
            <Flame className="w-32 h-32" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {achievements.map((achievement, idx) => {
          const Icon = achievement.icon
          return (
            <div key={idx} className={`${achievement.bgColor} rounded-lg p-6 border border-gray-200`}>
              <Icon className={`w-8 h-8 ${achievement.color} mb-3`} />
              <p className="text-sm text-gray-600 font-medium mb-1">{achievement.title}</p>
              <p className={`text-3xl font-bold ${achievement.color} mb-1`}>
                {achievement.value}
              </p>
              <p className="text-xs text-gray-500 mb-2">{achievement.unit}</p>
              <p className="text-sm font-medium text-gray-700">{achievement.message}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            {format(new Date(), 'MMMM yyyy')}
          </h3>
          <div className="text-right">
            <p className="text-sm text-gray-600">Completion Rate</p>
            <p className="text-2xl font-bold text-blue-600">{completionRate}%</p>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
          <div
            className="bg-gradient-to-r from-blue-600 to-blue-400 h-3 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-600 pb-2">
              {day}
            </div>
          ))}

          {/* Padding for days before month starts */}
          {paddingDays.map((_, idx) => (
            <div key={`padding-${idx}`} className="aspect-square"></div>
          ))}

          {/* Actual calendar days */}
          {calendarDays.map((day, idx) => {
            const isToday = day.isToday
            const hasEntry = day.hasEntry
            const isFuture = day.isFuture

            let baseClasses = 'aspect-square rounded-lg flex items-center justify-center text-sm font-medium select-none'
            let statusClasses = ''
            let tooltipText = ''

            if (isFuture) {
              statusClasses = 'bg-gray-50 text-gray-300 cursor-not-allowed'
              tooltipText = 'Future date'
            } else if (hasEntry) {
              statusClasses = 'bg-green-500 text-white shadow-md hover:shadow-lg hover:scale-105 cursor-pointer'
              tooltipText = `Checked in on ${format(day.date, 'MMMM d, yyyy')} - Click to view`
            } else if (isToday) {
              statusClasses = 'bg-blue-500 text-white border-2 border-blue-700 font-bold ring-2 ring-blue-300'
              tooltipText = `Today - ${format(day.date, 'MMMM d, yyyy')}`
            } else {
              statusClasses = 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105 cursor-pointer'
              tooltipText = `No check-in on ${format(day.date, 'MMMM d, yyyy')}`
            }

            return (
              <button
                key={idx}
                className={`${baseClasses} ${statusClasses}`}
                title={tooltipText}
                onClick={() => hasEntry && fetchEntryForDate(format(day.date, 'yyyy-MM-dd'))}
                disabled={!hasEntry}
              >
                {format(day.date, 'd')}
              </button>
            )
          })}
        </div>

        <div className="mt-6 flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 border-2 border-blue-600 rounded mr-2"></div>
            <span className="text-gray-600">Today</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
            <span className="text-gray-600">Missed</span>
          </div>
        </div>
      </div>

      {longestStreak >= 7 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-start">
            <Award className="w-8 h-8 text-purple-600 mr-4 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-purple-900 mb-2">Achievement Unlocked!</h3>
              <p className="text-purple-700">
                You've maintained a {longestStreak}-day streak! Consistent self-monitoring is key to wellbeing. Keep up the excellent work!
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Check-in Details - {format(parseISO(selectedDate), 'MMMM d, yyyy')}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              {loadingEntry ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
                </div>
              ) : selectedEntry ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MetricCard
                      icon={Moon}
                      label="Sleep Quality"
                      value={selectedEntry.sleep_quality}
                      color="bg-indigo-50 text-indigo-600"
                    />
                    <MetricCard
                      icon={Moon}
                      label="Sleep Hours"
                      value={selectedEntry.sleep_hours}
                      color="bg-indigo-50 text-indigo-600"
                      suffix="hrs"
                    />
                    <MetricCard
                      icon={Zap}
                      label="Energy Level"
                      value={selectedEntry.energy_level}
                      color="bg-yellow-50 text-yellow-600"
                    />
                    <MetricCard
                      icon={Dumbbell}
                      label="Training Fatigue"
                      value={selectedEntry.training_fatigue}
                      color="bg-orange-50 text-orange-600"
                    />
                    <MetricCard
                      icon={Heart}
                      label="Muscle Soreness"
                      value={selectedEntry.muscle_soreness}
                      color="bg-red-50 text-red-600"
                    />
                    <MetricCard
                      icon={Brain}
                      label="Mood"
                      value={selectedEntry.mood}
                      color="bg-pink-50 text-pink-600"
                    />
                    <MetricCard
                      icon={Brain}
                      label="Stress Level"
                      value={selectedEntry.stress_level}
                      color="bg-purple-50 text-purple-600"
                    />
                    <MetricCard
                      icon={Trophy}
                      label="Academic Pressure"
                      value={selectedEntry.academic_pressure}
                      color="bg-blue-50 text-blue-600"
                    />
                    <MetricCard
                      icon={Users}
                      label="Relationship Satisfaction"
                      value={selectedEntry.relationship_satisfaction}
                      color="bg-green-50 text-green-600"
                    />
                    <MetricCard
                      icon={MessageCircle}
                      label="Program Belonging"
                      value={selectedEntry.program_belonging}
                      color="bg-teal-50 text-teal-600"
                    />
                    {selectedEntry.hrv && (
                      <MetricCard
                        icon={Activity}
                        label="HRV"
                        value={selectedEntry.hrv}
                        color="bg-cyan-50 text-cyan-600"
                        suffix="ms"
                      />
                    )}
                    {selectedEntry.resting_heart_rate && (
                      <MetricCard
                        icon={Activity}
                        label="Resting Heart Rate"
                        value={selectedEntry.resting_heart_rate}
                        color="bg-cyan-50 text-cyan-600"
                        suffix="bpm"
                      />
                    )}
                  </div>

                  {selectedEntry.notes && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Additional Notes</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedEntry.notes}</p>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-200">
                    Submitted at {format(parseISO(selectedEntry.created_at), 'h:mm a')}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-600">
                  No data found for this date
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, color, suffix }: {
  icon: React.ElementType
  label: string
  value: number
  color: string
  suffix?: string
}) {
  return (
    <div className={`${color} rounded-lg p-4 border border-gray-200`}>
      <div className="flex items-center mb-2">
        <Icon className="w-5 h-5 mr-2" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold">
        {value}{suffix && <span className="text-lg ml-1">{suffix}</span>}
      </div>
      <div className="text-xs text-gray-600 mt-1">out of 10</div>
    </div>
  )
}
