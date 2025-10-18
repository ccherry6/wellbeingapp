import React, { useState, useEffect } from 'react'
import { Flame, Award, TrendingUp, Calendar, Target, Star } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { format, parseISO, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns'

interface WellnessEntry {
  entry_date: string
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

    let current = 0
    let longest = 0
    let temp = 0

    // Current date: Sunday, October 5th, 2025
    const today = new Date('2025-10-05')
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < uniqueDates.length; i++) {
      const entryDate = parseISO(uniqueDates[i])
      entryDate.setHours(0, 0, 0, 0)

      if (i === 0) {
        const daysDiff = differenceInDays(today, entryDate)
        if (daysDiff === 0 || daysDiff === 1) {
          temp = 1
          current = 1
        } else {
          current = 0
        }
      } else {
        const prevDate = parseISO(uniqueDates[i - 1])
        prevDate.setHours(0, 0, 0, 0)
        const daysDiff = differenceInDays(prevDate, entryDate)

        if (daysDiff === 1) {
          temp++
          if (current > 0) current++
        } else {
          if (temp > longest) longest = temp
          temp = 1
        }
      }
    }

    if (temp > longest) longest = temp

    setCurrentStreak(current)
    setLongestStreak(Math.max(longest, current))
  }

  const calculateMonthlyCheckIns = (data: WellnessEntry[]) => {
    // Current date: Sunday, October 5th, 2025
    const now = new Date('2025-10-05')
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const thisMonth = data.filter(entry => {
      const entryDate = parseISO(entry.entry_date)
      return isWithinInterval(entryDate, { start: monthStart, end: monthEnd })
    })

    setThisMonthCheckIns(thisMonth.length)
  }

  const getStreakMessage = () => {
    if (currentStreak === 0) return 'Start your streak today!'
    if (currentStreak === 1) return 'Great start! Keep it going!'
    if (currentStreak < 7) return `${currentStreak} days strong!`
    if (currentStreak < 30) return `Amazing! ${currentStreak} day streak!`
    return `Incredible! ${currentStreak} days in a row!`
  }

  const getCompletionRate = () => {
    // Current date: Sunday, October 5th, 2025
    const now = new Date('2025-10-05')
    const daysInMonth = endOfMonth(now).getDate()
    const dayOfMonth = now.getDate()

    const expectedCheckIns = dayOfMonth
    const rate = expectedCheckIns > 0 ? (thisMonthCheckIns / expectedCheckIns) * 100 : 0
    return Math.min(100, Math.round(rate))
  }

  const getMonthlyCalendar = () => {
    // Current date: Sunday, October 5th, 2025
    const now = new Date('2025-10-05')
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
      isToday: format(day, 'yyyy-MM-dd') === '2025-10-05',
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
            {format(new Date('2025-10-05'), 'MMMM yyyy')}
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
              tooltipText = `Checked in on ${format(day.date, 'MMMM d, yyyy')}`
            } else if (isToday) {
              statusClasses = 'bg-blue-500 text-white border-2 border-blue-700 font-bold ring-2 ring-blue-300'
              tooltipText = `Today - ${format(day.date, 'MMMM d, yyyy')}`
            } else {
              statusClasses = 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105 cursor-pointer'
              tooltipText = `No check-in on ${format(day.date, 'MMMM d, yyyy')}`
            }

            return (
              <div
                key={idx}
                className={`${baseClasses} ${statusClasses}`}
                title={tooltipText}
              >
                {format(day.date, 'd')}
              </div>
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
    </div>
  )
}
