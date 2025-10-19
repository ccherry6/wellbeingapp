import React, { useState, useEffect } from 'react'
import { ArrowLeft, TrendingDown, TrendingUp, Minus, AlertTriangle, Calendar, MessageSquare, Edit2, Check, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

interface Student {
  id: string
  full_name: string
  student_id: string
  sport: string
  email: string
  program_year: number
}

interface WellnessEntry {
  id: string
  entry_date: string
  sleep_quality: number
  sleep_hours: number
  energy_level: number
  mood: number
  stress_level: number
  academic_pressure: number
  training_fatigue: number
  muscle_soreness: number
  relationship_satisfaction: number
  program_belonging: number
  notes: string
  wants_to_speak: boolean
  speak_to_who: string
  created_at: string
}

interface StudentDeepDiveProps {
  studentId: string
  onBack: () => void
}

export function StudentDeepDive({ studentId, onBack }: StudentDeepDiveProps) {
  const [student, setStudent] = useState<Student | null>(null)
  const [entries, setEntries] = useState<WellnessEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState<string>('all')
  const [editingSport, setEditingSport] = useState(false)
  const [sportValue, setSportValue] = useState('')

  useEffect(() => {
    fetchStudentData()
  }, [studentId])

  const fetchStudentData = async () => {
    try {
      setLoading(true)

      const { data: studentData, error: studentError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', studentId)
        .single()

      if (studentError) throw studentError

      const { data: entriesData, error: entriesError } = await supabase
        .from('wellness_entries')
        .select('*')
        .eq('user_id', studentId)
        .order('entry_date', { ascending: false })

      if (entriesError) throw entriesError

      setStudent(studentData)
      setEntries(entriesData)
    } catch (error) {
      console.error('Error fetching student data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditSport = () => {
    setEditingSport(true)
    setSportValue(student?.sport || '')
  }

  const handleCancelEdit = () => {
    setEditingSport(false)
    setSportValue('')
  }

  const handleSaveSport = async () => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ sport: sportValue })
        .eq('id', studentId)

      if (error) throw error

      setStudent(prev => prev ? { ...prev, sport: sportValue } : null)
      setEditingSport(false)
      setSportValue('')
    } catch (error) {
      console.error('Error updating sport:', error)
      alert('Failed to update sport. Please try again.')
    }
  }

  const calculateAverage = (key: keyof WellnessEntry): number => {
    if (entries.length === 0) return 0
    const sum = entries.reduce((acc, entry) => acc + (Number(entry[key]) || 0), 0)
    return Math.round((sum / entries.length) * 10) / 10
  }

  const calculateTrend = (key: keyof WellnessEntry): 'up' | 'down' | 'stable' => {
    if (entries.length < 2) return 'stable'

    const recent = entries.slice(0, Math.min(7, entries.length))
    const older = entries.slice(Math.min(7, entries.length), Math.min(14, entries.length))

    if (older.length === 0) return 'stable'

    const recentAvg = recent.reduce((acc, e) => acc + (Number(e[key]) || 0), 0) / recent.length
    const olderAvg = older.reduce((acc, e) => acc + (Number(e[key]) || 0), 0) / older.length

    const diff = recentAvg - olderAvg

    if (Math.abs(diff) < 0.5) return 'stable'
    return diff > 0 ? 'up' : 'down'
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable', isPositive: boolean) => {
    if (trend === 'stable') return <Minus className="w-5 h-5 text-gray-500" />
    if (trend === 'up') {
      return isPositive
        ? <TrendingUp className="w-5 h-5 text-green-600" />
        : <TrendingUp className="w-5 h-5 text-red-600" />
    }
    return isPositive
      ? <TrendingDown className="w-5 h-5 text-red-600" />
      : <TrendingDown className="w-5 h-5 text-green-600" />
  }

  const getRadarData = () => {
    if (entries.length === 0) return []

    const latestEntry = entries[0]
    return [
      { metric: 'Sleep', value: latestEntry.sleep_quality },
      { metric: 'Energy', value: latestEntry.energy_level },
      { metric: 'Mood', value: latestEntry.mood },
      { metric: 'Relationships', value: latestEntry.relationship_satisfaction },
      { metric: 'Belonging', value: latestEntry.program_belonging },
      { metric: 'Low Stress', value: 10 - latestEntry.stress_level },
    ]
  }

  const getTimeSeriesData = () => {
    return entries.slice().reverse().map(entry => ({
      date: format(parseISO(entry.entry_date), 'MMM d'),
      'Sleep Quality': entry.sleep_quality,
      'Energy': entry.energy_level,
      'Mood': entry.mood,
      'Stress': entry.stress_level,
      'Training Fatigue': entry.training_fatigue,
      'Muscle Soreness': entry.muscle_soreness,
    }))
  }

  const metrics = [
    { key: 'sleep_quality', label: 'Sleep Quality', positive: true },
    { key: 'energy_level', label: 'Energy Level', positive: true },
    { key: 'mood', label: 'Mood', positive: true },
    { key: 'stress_level', label: 'Stress Level', positive: false },
    { key: 'training_fatigue', label: 'Training Fatigue', positive: false },
    { key: 'muscle_soreness', label: 'Muscle Soreness', positive: false },
    { key: 'relationship_satisfaction', label: 'Relationships', positive: true },
    { key: 'program_belonging', label: 'Belonging', positive: true },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Student not found</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:text-blue-800">
          Go Back
        </button>
      </div>
    )
  }

  const speakRequests = entries.filter(e => e.wants_to_speak)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Overview
        </button>
      </div>

      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-xl p-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{student.full_name}</h1>
            <div className="flex items-center space-x-4 text-blue-100">
              <span>ID: {student.student_id || 'N/A'}</span>
              <span>•</span>
              {editingSport ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={sportValue}
                    onChange={(e) => setSportValue(e.target.value)}
                    className="text-sm border border-blue-300 rounded px-2 py-1 w-40 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveSport}
                    className="p-1 text-green-400 hover:bg-blue-800 rounded"
                    title="Save"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1 text-red-400 hover:bg-blue-800 rounded"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <span>{student.sport || 'No sport assigned'}</span>
                  <button
                    onClick={handleEditSport}
                    className="p-1 text-blue-200 hover:text-white hover:bg-blue-800 rounded"
                    title="Edit sport"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
              {student.program_year && (
                <>
                  <span>•</span>
                  <span>Year {student.program_year}</span>
                </>
              )}
            </div>
            <p className="text-blue-100 mt-2">{student.email}</p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Total Check-ins</p>
            <p className="text-4xl font-bold">{entries.length}</p>
          </div>
        </div>
      </div>

      {speakRequests.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-6">
          <div className="flex items-start">
            <MessageSquare className="w-6 h-6 text-amber-600 mr-3 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-amber-900 mb-2">
                Student Requested to Speak ({speakRequests.length} time{speakRequests.length > 1 ? 's' : ''})
              </h3>
              <div className="space-y-2">
                {speakRequests.slice(0, 3).map((entry) => (
                  <div key={entry.id} className="text-sm text-amber-800">
                    <span className="font-semibold">{format(parseISO(entry.entry_date), 'MMM d, yyyy')}</span>
                    {entry.speak_to_who && <span> - Want to speak with: {entry.speak_to_who}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const avg = calculateAverage(metric.key as keyof WellnessEntry)
          const trend = calculateTrend(metric.key as keyof WellnessEntry)

          return (
            <div key={metric.key} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm text-gray-600">{metric.label}</p>
                {getTrendIcon(trend, metric.positive)}
              </div>
              <p className="text-3xl font-bold text-gray-900">{avg}</p>
              <p className="text-xs text-gray-500 mt-1">Average</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Current Wellbeing Profile</h3>
          {entries.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={getRadarData()}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 10]} />
                <Radar name="Current" dataKey="value" stroke="#1e3a8a" fill="#3b82f6" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No data available
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Notes & Concerns</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {entries.filter(e => e.notes).length > 0 ? (
              entries
                .filter(e => e.notes)
                .slice(0, 10)
                .map((entry) => (
                  <div key={entry.id} className="border-l-2 border-blue-200 pl-3 py-2">
                    <p className="text-xs text-gray-500 mb-1">
                      {format(parseISO(entry.entry_date), 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm text-gray-700">{entry.notes}</p>
                  </div>
                ))
            ) : (
              <p className="text-gray-500 text-sm">No notes recorded</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Wellness Trends Over Time</h3>
        {entries.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={getTimeSeriesData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Sleep Quality" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="Energy" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="Mood" stroke="#f59e0b" strokeWidth={2} />
              <Line type="monotone" dataKey="Stress" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-96 text-gray-500">
            No wellness data available
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Check-in History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3">Date</th>
                <th className="text-center py-2 px-3">Sleep</th>
                <th className="text-center py-2 px-3">Energy</th>
                <th className="text-center py-2 px-3">Mood</th>
                <th className="text-center py-2 px-3">Stress</th>
                <th className="text-left py-2 px-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3 font-medium">
                    {format(parseISO(entry.entry_date), 'MMM d, yyyy')}
                  </td>
                  <td className="text-center py-3 px-3">{entry.sleep_quality}/10</td>
                  <td className="text-center py-3 px-3">{entry.energy_level}/10</td>
                  <td className="text-center py-3 px-3">{entry.mood}/10</td>
                  <td className="text-center py-3 px-3">{entry.stress_level}/10</td>
                  <td className="py-3 px-3 text-gray-600 truncate max-w-xs">
                    {entry.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
