import React, { useState, useEffect } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  BarChart,
  Bar,
  Legend
} from 'recharts'
import { TrendingUp, Users, Calendar, Target, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { format, subDays } from 'date-fns'

interface StudentData {
  id: string
  full_name: string
  student_id: string
  sport: string
  color: string
}

interface ChartData {
  date: string
  [key: string]: any // For dynamic student data
}

interface RadarData {
  metric: string
  [key: string]: any // For dynamic student data
}

const studentColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#f43f5e', '#8b5cf6', '#06b6d4', '#84cc16',
  '#f97316', '#6366f1', '#14b8a6', '#f43f5e', '#3b82f6'
]

export function AnalyticsCharts() {
  const [students, setStudents] = useState<StudentData[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [radarData, setRadarData] = useState<RadarData[]>([])
  const [selectedMetric, setSelectedMetric] = useState('mood')
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [selectedView, setSelectedView] = useState<'trends' | 'radar' | 'comparison'>('trends')
  const [timeRange, setTimeRange] = useState(7)
  const [loading, setLoading] = useState(true)
  const [visibleStudents, setVisibleStudents] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchStudentsAndData()
  }, [timeRange])

  // Debug logging to check data flow
  useEffect(() => {
    console.log('Students data:', students)
    console.log('Chart data:', chartData)
    console.log('Radar data:', radarData)
  }, [students, chartData, radarData])

  const fetchStudentsAndData = async () => {
    try {
      console.log('🔍 Fetching students and wellness data...')
      
      // Fetch all users (students and admins)
      const { data: studentsData, error: studentsError } = await supabase
        .from('user_profiles')
        .select('id, full_name, student_id, sport, role, email')
        .order('full_name')

      if (studentsError) throw studentsError
      
      console.log('📊 All user profiles fetched:', studentsData)
      
      // Filter to include students and admins who have wellness entries
      const usersWithWellnessData = []
      
      for (const user of studentsData || []) {
        const { data: hasEntries } = await supabase
          .from('wellness_entries')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
        
        // Include students OR any user (including admin/coach) who has wellness entries
        if (user.role === 'student' || (hasEntries && hasEntries.length > 0)) {
          usersWithWellnessData.push(user)
          console.log(`✅ Including ${user.full_name} (${user.email}) - Role: ${user.role}, Has entries: ${hasEntries?.length > 0}`)
        } else {
          console.log(`❌ Excluding ${user.full_name} (${user.email}) - Role: ${user.role}, Has entries: ${hasEntries?.length > 0}`)
        }
      }
      
      console.log('👥 Users with wellness data:', usersWithWellnessData)

      const studentsWithColors = usersWithWellnessData.map((student, index) => ({
        ...student,
        full_name: student.full_name || 'Unknown',
        student_id: student.student_id || '',
        sport: student.sport || '',
        color: studentColors[index % studentColors.length]
      }))
      
      console.log('🎨 Students with colors assigned:', studentsWithColors)

      setStudents(studentsWithColors)
      setVisibleStudents(new Set(studentsWithColors.slice(0, 5).map(s => s.id))) // Show first 5 by default

      // Fetch wellness data for all students
      const startDate = subDays(new Date(), timeRange).toISOString()
      
      const { data: wellnessData, error: wellnessError } = await supabase
        .from('wellness_entries')
        .select(`
          *,
          user_profiles!inner (
            id,
            full_name,
            student_id,
            sport,
            role,
            email
          )
        `)
        .in('user_profiles.id', usersWithWellnessData.map(u => u.id))
        .gte('created_at', startDate)
        .order('created_at')

      if (wellnessError) throw wellnessError
      
      console.log('📈 Wellness data fetched:', wellnessData?.length, 'entries')
      console.log('👤 Users in wellness data:', [...new Set(wellnessData?.map(entry => entry.user_profiles.email))])

      // Process data for line charts
      const groupedByDate: { [key: string]: { [studentId: string]: any } } = {}
      
      wellnessData?.forEach(entry => {
        const date = format(new Date(entry.created_at), 'MMM dd')
        if (!groupedByDate[date]) {
          groupedByDate[date] = {}
        }
        
        const studentId = entry.user_profiles.id
        if (!groupedByDate[date][studentId]) {
          groupedByDate[date][studentId] = []
        }
        groupedByDate[date][studentId].push(entry)
      })

      // Calculate daily averages for each student
      const chartData = Object.entries(groupedByDate).map(([date, studentEntries]) => {
        const dayData: any = { date }
        
        Object.entries(studentEntries).forEach(([studentId, entries]) => {
          const student = studentsWithColors.find(s => s.id === studentId)
          if (!student) return

          const metrics = [
            'sleep_quality', 'sleep_hours', 'energy_level', 'training_fatigue',
            'muscle_soreness', 'mood', 'stress_level', 'academic_pressure',
            'relationship_satisfaction', 'program_belonging'
          ]

          metrics.forEach(metric => {
            const values = entries.map((e: any) => e[metric]).filter((v: any) => v !== null)
            if (values.length > 0) {
              dayData[`${student.full_name}_${metric}`] = Math.round(values.reduce((a: number, b: number) => a + b, 0) / values.length * 10) / 10
            }
          })
        })

        return dayData
      })

      setChartData(chartData)

      // Process data for radar chart - calculate overall averages per student
      const radarMetrics = [
        { key: 'sleep_quality', label: 'Sleep Quality' },
        { key: 'energy_level', label: 'Energy Level' },
        { key: 'mood', label: 'Mood' },
        { key: 'training_fatigue', label: 'Training Fatigue' },
        { key: 'muscle_soreness', label: 'Muscle Soreness' },
        { key: 'stress_level', label: 'Stress Level' },
        { key: 'academic_pressure', label: 'Academic Pressure' },
        { key: 'relationship_satisfaction', label: 'Relationships' },
        { key: 'program_belonging', label: 'Program Belonging' }
      ]

      const radarData = radarMetrics.map(({ key, label }) => {
        const metricData: any = { metric: label }
        
        studentsWithColors.forEach(student => {
          const studentEntries = wellnessData?.filter(entry => entry.user_profiles.id === student.id) || []
          const values = studentEntries.map(entry => entry[key]).filter(v => v !== null)
          
          if (values.length > 0) {
            metricData[student.full_name] = Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10
          } else {
            metricData[student.full_name] = 0
          }
        })

        return metricData
      })

      setRadarData(radarData)

    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleStudentVisibility = (studentId: string) => {
    setVisibleStudents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(studentId)) {
        newSet.delete(studentId)
      } else {
        newSet.add(studentId)
      }
      return newSet
    })
  }

  const allMetrics = [
    { key: 'mood', label: 'Mood', color: '#ec4899' },
    { key: 'stress_level', label: 'Stress Level', color: '#ef4444' },
    { key: 'energy_level', label: 'Energy Level', color: '#eab308' },
    { key: 'sleep_quality', label: 'Sleep Quality', color: '#8b5cf6' },
    { key: 'sleep_hours', label: 'Sleep Hours', color: '#64748b' },
    { key: 'training_fatigue', label: 'Training Fatigue', color: '#f97316' },
    { key: 'muscle_soreness', label: 'Muscle Soreness', color: '#f59e0b' },
    { key: 'academic_pressure', label: 'Academic Pressure', color: '#3b82f6' },
    { key: 'relationship_satisfaction', label: 'Relationships', color: '#10b981' },
    { key: 'program_belonging', label: 'Program Belonging', color: '#6366f1' }
  ]

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
    <div id="analytics-charts" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h2>
        <div className="flex space-x-2">
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
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex space-x-1">
          <button
            onClick={() => setSelectedView('trends')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'trends'
                ? 'bg-blue-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Individual Metrics
          </button>
          <button
            onClick={() => setSelectedView('individual')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'individual'
                ? 'bg-blue-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Individual Student
          </button>
          <button
            onClick={() => setSelectedView('radar')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'radar'
                ? 'bg-blue-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Target className="w-4 h-4 inline mr-2" />
            Spider Chart
          </button>
          <button
            onClick={() => setSelectedView('comparison')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'comparison'
                ? 'bg-blue-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            All Students
          </button>
        </div>
      </div>

      {/* Student Visibility Controls */}
      {students.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Student Visibility ({visibleStudents.size} of {students.length} shown)</h3>
          <div className="flex flex-wrap gap-2">
            {students.map(student => (
              <button
                key={student.id}
                onClick={() => toggleStudentVisibility(student.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                  visibleStudents.has(student.id)
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: visibleStudents.has(student.id) ? student.color : undefined
                }}
              >
                {visibleStudents.has(student.id) ? (
                  <Eye className="w-3 h-3 mr-1" />
                ) : (
                  <EyeOff className="w-3 h-3 mr-1" />
                )}
                {student.full_name}
              </button>
            ))}
          </div>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={() => setVisibleStudents(new Set(students.map(s => s.id)))}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
            >
              Show All
            </button>
            <button
              onClick={() => setVisibleStudents(new Set())}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
            >
              Hide All
            </button>
          </div>
        </div>
      )}

      {selectedView === 'trends' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Metric to View
            </label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {allMetrics.map(metric => (
                <option key={metric.key} value={metric.key}>
                  {metric.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {allMetrics.find(m => m.key === selectedMetric)?.label} Trends - All Students
            </h3>
            {chartData.length > 0 ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis 
                      domain={selectedMetric === 'sleep_hours' ? [0, 12] : [0, 10]}
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
                    <Legend />
                    {students
                      .filter(student => visibleStudents.has(student.id))
                      .map(student => (
                      <Line
                        key={student.id}
                        type="monotone"
                        dataKey={`${student.full_name}_${selectedMetric}`}
                        stroke={student.color}
                        strokeWidth={2}
                        dot={{ fill: student.color, strokeWidth: 2, r: 4 }}
                        name={student.full_name}
                        connectNulls={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No data available for the selected time range</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedView === 'individual' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Student to View Individual Metrics
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose a student...</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.full_name} ({student.student_id}) - {student.sport}
                </option>
              ))}
            </select>
          </div>

          {selectedStudent && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Individual Student Line Chart */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {students.find(s => s.id === selectedStudent)?.full_name} - All Metrics Trends
                </h3>
                {chartData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#6b7280"
                          fontSize={10}
                        />
                        <YAxis 
                          domain={[0, 10]}
                          stroke="#6b7280"
                          fontSize={10}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend />
                        {allMetrics.filter(m => m.key !== 'sleep_hours').map(metric => {
                          const studentName = students.find(s => s.id === selectedStudent)?.full_name
                          return (
                            <Line
                              key={metric.key}
                              type="monotone"
                              dataKey={`${studentName}_${metric.key}`}
                              stroke={metric.color}
                              strokeWidth={2}
                              dot={{ fill: metric.color, strokeWidth: 2, r: 4 }}
                              name={metric.label}
                              connectNulls={false}
                            />
                          )
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No data available for this student</p>
                  </div>
                )}
              </div>

              {/* Individual Student Spider Chart */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {students.find(s => s.id === selectedStudent)?.full_name} - 7-Day Average Spider Chart
                </h3>
                {(() => {
                  const studentName = students.find(s => s.id === selectedStudent)?.full_name
                  const studentRadarData = radarData.map(metric => ({
                    metric: metric.metric,
                    value: metric[studentName] || 0
                  }))
                  
                  return studentRadarData.length > 0 ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={studentRadarData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
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
                            name={studentName}
                            dataKey="value"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.3}
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No data available for spider chart</p>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          {selectedStudent && (() => {
            const studentName = students.find(s => s.id === selectedStudent)?.full_name
            const studentAverages = radarData.reduce((acc, metric) => {
              acc[metric.metric] = metric[studentName] || 0
              return acc
            }, {} as Record<string, number>)

            // Function to get color coding based on metric value
            const getScoreColor = (metric: string, value: number) => {
              // For metrics where higher is better
              const higherIsBetter = [
                'Sleep Quality', 'Energy Level', 'Mood', 
                'Relationships', 'Program Belonging'
              ]
              
              // For metrics where lower is better
              const lowerIsBetter = [
                'Training Fatigue', 'Muscle Soreness', 'Stress Level', 'Academic Pressure'
              ]
              
              if (higherIsBetter.includes(metric)) {
                if (value >= 7) return 'bg-green-100 text-green-800 border-green-200'
                if (value >= 5) return 'bg-orange-100 text-orange-800 border-orange-200'
                return 'bg-red-100 text-red-800 border-red-200'
              } else if (lowerIsBetter.includes(metric)) {
                if (value <= 4) return 'bg-green-100 text-green-800 border-green-200'
                if (value <= 6) return 'bg-orange-100 text-orange-800 border-orange-200'
                return 'bg-red-100 text-red-800 border-red-200'
              } else {
                // Default for neutral metrics
                if (value >= 6) return 'bg-green-100 text-green-800 border-green-200'
                if (value >= 4) return 'bg-orange-100 text-orange-800 border-orange-200'
                return 'bg-red-100 text-red-800 border-red-200'
              }
            }
            return (
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {studentName} - 7-Day Average Scores
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {Object.entries(studentAverages).map(([metric, value]) => (
                    <div key={metric} className={`p-4 rounded-lg text-center border-2 ${getScoreColor(metric, value)}`}>
                      <p className="text-sm font-medium text-gray-700 mb-1">{metric}</p>
                      <p className="text-2xl font-bold">{value.toFixed(1)}/10</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 flex justify-center space-x-6 text-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-100 border-2 border-green-200 rounded mr-2"></div>
                    <span className="text-gray-600">Good (7-10 or 1-4 for stress/fatigue)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-orange-100 border-2 border-orange-200 rounded mr-2"></div>
                    <span className="text-gray-600">Moderate (5-6)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-100 border-2 border-red-200 rounded mr-2"></div>
                    <span className="text-gray-600">Concern (1-4 or 7-10 for stress/fatigue)</span>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {selectedView === 'radar' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Comparison - Spider Chart (All Metrics)</h3>
            {radarData.length > 0 ? (
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
                    <PolarGrid stroke="#e5e7eb" gridType="polygon" />
                    <PolarAngleAxis 
                      dataKey="metric" 
                      tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}
                      className="text-xs"
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 10]} 
                      tick={{ fontSize: 9, fill: '#6b7280' }}
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
                      formatter={(value: number, name: string) => [`${value}/10`, name]}
                    />
                    <Legend />
                    {students
                      .filter(student => visibleStudents.has(student.id))
                      .map(student => (
                      <Radar
                        key={student.id}
                        name={student.full_name}
                        dataKey={student.full_name}
                        stroke={student.color}
                        fill={student.color}
                        fillOpacity={0.1}
                        strokeWidth={2}
                        dot={{ fill: student.color, strokeWidth: 2, r: 3 }}
                      />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No data available for spider chart</p>
              </div>
            )}
          </div>

          {/* Average Scores Bar Chart */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Average Scores by Student</h3>
            {students.filter(student => visibleStudents.has(student.id)).length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={students.filter(student => visibleStudents.has(student.id)).map(student => {
                      const studentData: any = { name: student.full_name, color: student.color }
                      
                      // Calculate overall average for this student
                      const averages = radarData.map(metric => metric[student.full_name] || 0)
                      const overallAvg = averages.length > 0 ? averages.reduce((a, b) => a + b, 0) / averages.length : 0
                      
                      studentData.overall_average = Math.round(overallAvg * 10) / 10
                      
                      return studentData
                    })}
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#6b7280"
                      fontSize={10}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
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
                      formatter={(value: number) => [`${value}/10`, 'Overall Average']}
                    />
                    <Bar 
                      dataKey="overall_average"
                      radius={[4, 4, 0, 0]}
                      fill="#3b82f6"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Select students to view their average scores</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedView === 'comparison' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Students - All Metrics Comparison</h3>
          {chartData.length > 0 ? (
            <div className="space-y-6">
              {allMetrics.map(metric => (
                <div key={metric.key} className="border border-gray-100 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: metric.color }}
                    ></div>
                    {metric.label} - All Students
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#6b7280"
                          fontSize={10}
                        />
                        <YAxis 
                          domain={metric.key === 'sleep_hours' ? [0, 12] : [0, 10]}
                          stroke="#6b7280"
                          fontSize={10}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend />
                        {students
                          .filter(student => visibleStudents.has(student.id))
                          .map(student => (
                          <Line
                            key={student.id}
                            type="monotone"
                            dataKey={`${student.full_name}_${metric.key}`}
                            stroke={student.color}
                            strokeWidth={2}
                            dot={{ fill: student.color, strokeWidth: 1, r: 3 }}
                            name={student.full_name}
                            connectNulls={false}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No data available for comparison</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}