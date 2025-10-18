import React, { useState, useEffect } from 'react'
import { User, AlertTriangle, TrendingDown, TrendingUp, Target } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { supabase } from '../../lib/supabase'
import { format, subDays } from 'date-fns'

interface Student {
  id: string
  full_name: string
  student_id: string
  sport: string
  program_year: string
  email: string
}

interface StudentData extends Student {
  latestResponse?: any
  averageScores?: any
  radarData?: any[]
  riskLevel: 'low' | 'medium' | 'high'
}

interface StudentOverviewProps {
  students: Student[]
  onStudentClick?: (studentId: string) => void
}

export function StudentOverview({ students, onStudentClick }: StudentOverviewProps) {
  const [studentData, setStudentData] = useState<StudentData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)

  useEffect(() => {
    if (students.length > 0) {
      fetchStudentData()
    } else {
      setLoading(false)
    }
  }, [students])

  const fetchStudentData = async () => {
    try {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString()
      
      const enrichedStudents = await Promise.all(
        students.map(async (student) => {
          // Get latest response
          const { data: latestResponse } = await supabase
            .from('wellness_entries')
            .select('*')
            .eq('user_id', student.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          // Get average scores for the last 7 days
          const { data: recentResponses } = await supabase
            .from('wellness_entries')
            .select('*')
            .eq('user_id', student.id)
            .gte('created_at', sevenDaysAgo)

          let averageScores = null
          let radarData = null
          let riskLevel: 'low' | 'medium' | 'high' = 'low'

          if (recentResponses && recentResponses.length > 0) {
            const totals = recentResponses.reduce((acc, response) => {
              Object.keys(response).forEach(key => {
                if (typeof response[key] === 'number' && key !== 'sleep_hours') {
                  acc[key] = (acc[key] || 0) + response[key]
                }
              })
              return acc
            }, {} as Record<string, number>)

            averageScores = Object.keys(totals).reduce((acc, key) => {
              acc[key] = Math.round(totals[key] / recentResponses.length)
              return acc
            }, {} as Record<string, number>)

            // Calculate risk level based on concerning metrics
            const concerningMetrics = [
              averageScores.stress_level > 7,
              averageScores.training_fatigue > 8,
              averageScores.mood < 4,
              averageScores.sleep_quality < 4,
              averageScores.academic_pressure > 8
            ]

            const riskCount = concerningMetrics.filter(Boolean).length
            if (riskCount >= 3) riskLevel = 'high'
            else if (riskCount >= 1) riskLevel = 'medium'

            // Create radar chart data for individual student
            radarData = [
              { metric: 'Sleep Quality', value: averageScores.sleep_quality || 0 },
              { metric: 'Energy Level', value: averageScores.energy_level || 0 },
              { metric: 'Mood', value: averageScores.mood || 0 },
              { metric: 'Training Fatigue', value: 10 - (averageScores.training_fatigue || 0) }, // Invert for better visualization
              { metric: 'Muscle Soreness', value: 10 - (averageScores.muscle_soreness || 0) }, // Invert for better visualization
              { metric: 'Stress Level', value: 10 - (averageScores.stress_level || 0) }, // Invert for better visualization
              { metric: 'Academic Pressure', value: 10 - (averageScores.academic_pressure || 0) }, // Invert for better visualization
              { metric: 'Relationships', value: averageScores.relationship_satisfaction || 0 },
              { metric: 'Program Belonging', value: averageScores.program_belonging || 0 }
            ]
          }

          return {
            ...student,
            latestResponse,
            averageScores,
            radarData,
            riskLevel
          }
        })
      )

      setStudentData(enrichedStudents)
    } catch (error) {
      // Silently handle error
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  const getRiskIcon = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high': return <AlertTriangle className="w-4 h-4" />
      case 'medium': return <TrendingDown className="w-4 h-4" />
      default: return <TrendingUp className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-gray-100 h-24 rounded-lg"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900">Total Students</h3>
          <p className="text-2xl font-bold text-blue-600">{students.length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-900">Medium Risk</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {studentData.filter(s => s.riskLevel === 'medium').length}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="font-semibold text-red-900">High Risk</h3>
          <p className="text-2xl font-bold text-red-600">
            {studentData.filter(s => s.riskLevel === 'high').length}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {studentData.map((student) => (
          <div
            key={student.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{student.full_name}</h3>
                  <p className="text-sm text-gray-600">
                    {student.student_id} • {student.sport} • {student.program_year}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(student.riskLevel)}`}>
                  {getRiskIcon(student.riskLevel)}
                  <span className="ml-1 capitalize">{student.riskLevel} Risk</span>
                </span>
                {onStudentClick && (
                  <button
                    onClick={() => onStudentClick(student.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                )}
                <button
                  onClick={() => setSelectedStudent(selectedStudent === student.id ? null : student.id)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  {selectedStudent === student.id ? 'Hide' : 'Quick View'}
                </button>
                {student.latestResponse && (
                  <span className="text-xs text-gray-500">
                    Last check-in: {format(new Date(student.latestResponse.created_at), 'MMM dd')}
                  </span>
                )}
              </div>
            </div>

            {selectedStudent === student.id && student.averageScores && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">7-Day Averages</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-purple-50 p-3 rounded">
                        <p className="text-purple-600 font-medium">Sleep Quality</p>
                        <p className="text-lg font-bold text-purple-900">{student.averageScores.sleep_quality}/10</p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded">
                        <p className="text-yellow-600 font-medium">Energy</p>
                        <p className="text-lg font-bold text-yellow-900">{student.averageScores.energy_level}/10</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded">
                        <p className="text-red-600 font-medium">Stress</p>
                        <p className="text-lg font-bold text-red-900">{student.averageScores.stress_level}/10</p>
                      </div>
                      <div className="bg-pink-50 p-3 rounded">
                        <p className="text-pink-600 font-medium">Mood</p>
                        <p className="text-lg font-bold text-pink-900">{student.averageScores.mood}/10</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-3">
                      <Target className="w-5 h-5 text-indigo-600 mr-2" />
                      <h4 className="font-medium text-gray-900">Individual Metrics Overview</h4>
                    </div>
                    {student.radarData ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={student.radarData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis 
                              dataKey="metric" 
                              tick={{ fontSize: 10, fill: '#374151' }}
                            />
                            <PolarRadiusAxis 
                              angle={90} 
                              domain={[0, 10]} 
                              tick={{ fontSize: 8, fill: '#6b7280' }}
                              tickCount={6}
                            />
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                fontSize: '12px'
                              }}
                              formatter={(value: number) => [`${value}/10`, 'Score']}
                            />
                            <Radar
                              name={student.full_name}
                              dataKey="value"
                              stroke="#3b82f6"
                              fill="#3b82f6"
                              fillOpacity={0.2}
                              strokeWidth={2}
                              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Target className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No data available for chart</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}