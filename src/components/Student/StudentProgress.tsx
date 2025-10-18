import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Calendar } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { format, subDays } from 'date-fns'

interface ProgressData {
  date: string
  sleep_quality: number
  energy_levels: number
  mood: number
  stress_level: number
  training_fatigue: number
  program_belonging: number
}

export function StudentProgress() {
  const { user } = useAuth()
  const [progressData, setProgressData] = useState<ProgressData[]>([])
  const [selectedMetrics, setSelectedMetrics] = useState(['mood', 'energy_level', 'stress_level'])
  const [timeRange, setTimeRange] = useState(14)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchProgressData()
    }
  }, [user, timeRange])

  const fetchProgressData = async () => {
    try {
      const startDate = subDays(new Date(), timeRange).toISOString()
      
      const { data, error } = await supabase
        .from('wellness_entries')
        .select('*')
        .eq('user_id', user!.id)
        .gte('created_at', startDate)
        .order('created_at')

      if (error) throw error

      const chartData = data.map(response => ({
        date: format(new Date(response.created_at), 'MMM dd'),
        sleep_quality: response.sleep_quality,
        energy_level: response.energy_level,
        mood: response.mood,
        stress_level: response.stress_level,
        training_fatigue: response.training_fatigue,
        program_belonging: response.program_belonging
      }))

      setProgressData(chartData)
    } catch (error) {
      console.error('Error fetching progress data:', error)
    } finally {
      setLoading(false)
    }
  }

  const metrics = [
    { key: 'mood', label: 'Mood', color: '#ec4899' },
    { key: 'stress_level', label: 'Stress Level', color: '#ef4444' },
    { key: 'energy_level', label: 'Energy Levels', color: '#eab308' },
    { key: 'sleep_quality', label: 'Sleep Quality', color: '#8b5cf6' },
    { key: 'training_fatigue', label: 'Training Fatigue', color: '#f97316' },
    { key: 'program_belonging', label: 'Program Belonging', color: '#10b981' }
  ]

  const toggleMetric = (metricKey: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricKey)
        ? prev.filter(m => m !== metricKey)
        : [...prev, metricKey]
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-900">Your Progress</h2>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Select Metrics to Display</h3>
        <div className="flex flex-wrap gap-2">
          {metrics.map(metric => (
            <button
              key={metric.key}
              onClick={() => toggleMetric(metric.key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedMetrics.includes(metric.key)
                  ? 'text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              style={{
                backgroundColor: selectedMetrics.includes(metric.key) ? metric.color : undefined
              }}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      {progressData.length > 0 ? (
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  domain={[0, 10]}
                  stroke="#6b7280"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                {selectedMetrics.map(metricKey => {
                  const metric = metrics.find(m => m.key === metricKey)
                  if (!metric) return null
                  
                  return (
                    <Line
                      key={metricKey}
                      type="monotone"
                      dataKey={metricKey}
                      stroke={metric.color}
                      strokeWidth={3}
                      dot={{ fill: metric.color, strokeWidth: 2, r: 5 }}
                      name={metric.label}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Complete a few daily check-ins to see your progress trends</p>
        </div>
      )}
    </div>
  )
}