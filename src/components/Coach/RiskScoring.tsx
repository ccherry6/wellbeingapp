import React, { useState, useEffect } from 'react'
import { AlertTriangle, TrendingDown, TrendingUp, Activity, Brain, Heart } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface RiskScore {
  user_id: string
  full_name: string
  student_id: string
  sport: string
  overall_risk: number
  mental_health_risk: number
  physical_health_risk: number
  academic_risk: number
  last_entry_date: string
  days_since_entry: number
}

export default function RiskScoring() {
  const [riskScores, setRiskScores] = useState<RiskScore[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  useEffect(() => {
    calculateRiskScores()
  }, [])

  const calculateRiskScores = async () => {
    try {
      const { data: students, error: studentsError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'student')

      if (studentsError) throw studentsError

      const scores: RiskScore[] = []

      for (const student of students || []) {
        const { data: entries, error: entriesError } = await supabase
          .from('wellness_entries')
          .select('*')
          .eq('user_id', student.id)
          .order('created_at', { ascending: false })
          .limit(7)

        if (entriesError) throw entriesError

        if (!entries || entries.length === 0) {
          scores.push({
            user_id: student.id,
            full_name: student.full_name || '',
            student_id: student.student_id || '',
            sport: student.sport || '',
            overall_risk: 50,
            mental_health_risk: 50,
            physical_health_risk: 50,
            academic_risk: 50,
            last_entry_date: 'Never',
            days_since_entry: 999
          })
          continue
        }

        const lastEntry = entries[0]
        const daysSince = Math.floor((Date.now() - new Date(lastEntry.created_at).getTime()) / (1000 * 60 * 60 * 24))

        let mentalHealthRisk = 0
        let physicalHealthRisk = 0
        let academicRisk = 0

        entries.forEach(entry => {
          mentalHealthRisk += (10 - entry.mood) + (10 - entry.energy_level) + entry.stress_level
          physicalHealthRisk += entry.training_fatigue + entry.muscle_soreness + (10 - entry.sleep_quality)
          academicRisk += entry.academic_pressure + (10 - entry.program_belonging)
        })

        mentalHealthRisk = Math.min(100, (mentalHealthRisk / (entries.length * 3)) * 10)
        physicalHealthRisk = Math.min(100, (physicalHealthRisk / (entries.length * 3)) * 10)
        academicRisk = Math.min(100, (academicRisk / (entries.length * 2)) * 10)

        const overallRisk = (mentalHealthRisk + physicalHealthRisk + academicRisk) / 3

        const engagementPenalty = Math.min(30, daysSince * 5)
        const adjustedOverallRisk = Math.min(100, overallRisk + engagementPenalty)

        scores.push({
          user_id: student.id,
          full_name: student.full_name || '',
          student_id: student.student_id || '',
          sport: student.sport || '',
          overall_risk: Math.round(adjustedOverallRisk),
          mental_health_risk: Math.round(mentalHealthRisk),
          physical_health_risk: Math.round(physicalHealthRisk),
          academic_risk: Math.round(academicRisk),
          last_entry_date: new Date(lastEntry.created_at).toLocaleDateString(),
          days_since_entry: daysSince
        })
      }

      scores.sort((a, b) => b.overall_risk - a.overall_risk)
      setRiskScores(scores)
    } catch (error) {
      console.error('Error calculating risk scores:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevel = (score: number): 'high' | 'medium' | 'low' => {
    if (score >= 70) return 'high'
    if (score >= 40) return 'medium'
    return 'low'
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'bg-red-100 text-red-800 border-red-300'
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-green-100 text-green-800 border-green-300'
  }

  const getRiskBadgeColor = (score: number) => {
    if (score >= 70) return 'bg-red-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const filteredScores = riskScores.filter(score => {
    if (filter === 'all') return true
    return getRiskLevel(score.overall_risk) === filter
  })

  if (loading) {
    return <div className="text-center py-8">Calculating risk scores...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Risk Scoring</h2>
          <p className="text-gray-600">Identify students who may need support</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all' ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'high' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            High Risk
          </button>
          <button
            onClick={() => setFilter('medium')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'medium' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Medium Risk
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'low' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Low Risk
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">High Risk</p>
              <p className="text-3xl font-bold text-red-900">
                {riskScores.filter(s => getRiskLevel(s.overall_risk) === 'high').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Medium Risk</p>
              <p className="text-3xl font-bold text-yellow-900">
                {riskScores.filter(s => getRiskLevel(s.overall_risk) === 'medium').length}
              </p>
            </div>
            <Activity className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Low Risk</p>
              <p className="text-3xl font-bold text-green-900">
                {riskScores.filter(s => getRiskLevel(s.overall_risk) === 'low').length}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Risk Scoring Methodology</h3>
        <p className="text-sm text-blue-800">
          Risk scores are calculated based on recent wellness entries (last 7 days), considering mental health indicators (mood, energy, stress),
          physical health factors (fatigue, soreness, sleep), and academic pressures. Higher scores indicate greater concern.
          Students with no recent entries receive a moderate risk score and engagement penalty.
        </p>
      </div>

      <div className="space-y-3">
        {filteredScores.map((score) => (
          <div
            key={score.user_id}
            className={`border-2 rounded-lg p-4 ${getRiskColor(score.overall_risk)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{score.full_name}</h3>
                <p className="text-sm opacity-75">
                  {score.student_id} • {score.sport}
                </p>
                <p className="text-xs opacity-75 mt-1">
                  Last entry: {score.last_entry_date}
                  {score.days_since_entry > 0 && ` (${score.days_since_entry} days ago)`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{score.overall_risk}</div>
                <div className="text-xs opacity-75">Overall Risk</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white bg-opacity-50 rounded p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Brain className="w-4 h-4" />
                  <span className="text-xs font-medium">Mental Health</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getRiskBadgeColor(score.mental_health_risk)}`}
                      style={{ width: `${score.mental_health_risk}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold">{score.mental_health_risk}</span>
                </div>
              </div>

              <div className="bg-white bg-opacity-50 rounded p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Heart className="w-4 h-4" />
                  <span className="text-xs font-medium">Physical Health</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getRiskBadgeColor(score.physical_health_risk)}`}
                      style={{ width: `${score.physical_health_risk}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold">{score.physical_health_risk}</span>
                </div>
              </div>

              <div className="bg-white bg-opacity-50 rounded p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs font-medium">Academic</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getRiskBadgeColor(score.academic_risk)}`}
                      style={{ width: `${score.academic_risk}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold">{score.academic_risk}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredScores.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No students found in this risk category</p>
        </div>
      )}
    </div>
  )
}
