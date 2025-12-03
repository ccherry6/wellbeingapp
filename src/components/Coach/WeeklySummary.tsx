import React, { useState, useEffect } from 'react'
import { Calendar, TrendingUp, TrendingDown, Users, AlertTriangle, CheckCircle, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface WeeklySummaryData {
  weekStart: string
  weekEnd: string
  totalResponses: number
  uniqueStudents: number
  averageScores: {
    sleep_quality: number
    energy_level: number
    mood: number
    stress_level: number
    training_fatigue: number
  }
  alertCount: number
  participationRate: number
  topConcerns: string[]
  improvements: string[]
}

export default function WeeklySummary() {
  const [summary, setSummary] = useState<WeeklySummaryData | null>(null)
  const [selectedWeek, setSelectedWeek] = useState(0)
  const [loading, setLoading] = useState(true)
  const [totalStudents, setTotalStudents] = useState(0)

  useEffect(() => {
    fetchWeeklySummary()
  }, [selectedWeek])

  const getWeekDates = (weeksAgo: number) => {
    const now = new Date()
    const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (weeksAgo * 7))
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekStart.getDate() - 6)

    return {
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0],
      startDisplay: weekStart.toLocaleDateString(),
      endDisplay: weekEnd.toLocaleDateString()
    }
  }

  const fetchWeeklySummary = async () => {
    setLoading(true)
    try {
      const { data: students, error: studentsError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', 'student')

      if (studentsError) throw studentsError
      setTotalStudents(students?.length || 0)

      const dates = getWeekDates(selectedWeek)

      const { data: entries, error: entriesError } = await supabase
        .from('wellness_entries')
        .select('*')
        .gte('entry_date', dates.start)
        .lte('entry_date', dates.end)

      if (entriesError) throw entriesError

      if (!entries || entries.length === 0) {
        setSummary(null)
        setLoading(false)
        return
      }

      const uniqueStudents = new Set(entries.map(e => e.user_id)).size

      const avgScores = {
        sleep_quality: entries.reduce((sum, e) => sum + e.sleep_quality, 0) / entries.length,
        energy_level: entries.reduce((sum, e) => sum + e.energy_level, 0) / entries.length,
        mood: entries.reduce((sum, e) => sum + e.mood, 0) / entries.length,
        stress_level: entries.reduce((sum, e) => sum + e.stress_level, 0) / entries.length,
        training_fatigue: entries.reduce((sum, e) => sum + e.training_fatigue, 0) / entries.length
      }

      const { data: alerts, error: alertsError } = await supabase
        .from('wellness_alerts')
        .select('id')
        .gte('created_at', dates.start + 'T00:00:00')
        .lte('created_at', dates.end + 'T23:59:59')

      if (alertsError) throw alertsError

      const concerns: string[] = []
      const improvements: string[] = []

      if (avgScores.sleep_quality < 5) concerns.push('Low sleep quality')
      else if (avgScores.sleep_quality > 7) improvements.push('Good sleep quality')

      if (avgScores.energy_level < 5) concerns.push('Low energy levels')
      else if (avgScores.energy_level > 7) improvements.push('High energy levels')

      if (avgScores.mood < 5) concerns.push('Low mood scores')
      else if (avgScores.mood > 7) improvements.push('Positive mood trends')

      if (avgScores.stress_level > 6) concerns.push('Elevated stress levels')
      else if (avgScores.stress_level < 4) improvements.push('Well-managed stress')

      if (avgScores.training_fatigue > 7) concerns.push('High training fatigue')
      else if (avgScores.training_fatigue < 5) improvements.push('Managed training load')

      setSummary({
        weekStart: dates.startDisplay,
        weekEnd: dates.endDisplay,
        totalResponses: entries.length,
        uniqueStudents: uniqueStudents,
        averageScores: avgScores,
        alertCount: alerts?.length || 0,
        participationRate: totalStudents > 0 ? (uniqueStudents / totalStudents) * 100 : 0,
        topConcerns: concerns,
        improvements: improvements
      })
    } catch (error) {
      console.error('Error fetching weekly summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportSummary = () => {
    if (!summary) return

    const report = `
Thrive Wellbeing - Weekly Summary Report
Week of ${summary.weekStart} to ${summary.weekEnd}

PARTICIPATION
- Total Responses: ${summary.totalResponses}
- Unique Students: ${summary.uniqueStudents}
- Participation Rate: ${summary.participationRate.toFixed(1)}%

AVERAGE SCORES (out of 10)
- Sleep Quality: ${summary.averageScores.sleep_quality.toFixed(1)}
- Energy Level: ${summary.averageScores.energy_level.toFixed(1)}
- Mood: ${summary.averageScores.mood.toFixed(1)}
- Stress Level: ${summary.averageScores.stress_level.toFixed(1)}
- Training Fatigue: ${summary.averageScores.training_fatigue.toFixed(1)}

ALERTS TRIGGERED
- Total Alerts: ${summary.alertCount}

TOP CONCERNS
${summary.topConcerns.map(c => `- ${c}`).join('\n')}

POSITIVE TRENDS
${summary.improvements.map(i => `- ${i}`).join('\n')}

Generated: ${new Date().toLocaleString()}
    `.trim()

    // Use data URI for better mobile compatibility
    const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(report)
    const a = document.createElement('a')
    a.href = dataUri
    a.download = `weekly-summary-${summary.weekStart}-${summary.weekEnd}.txt`
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const getScoreColor = (score: number, isInverse: boolean = false) => {
    if (isInverse) {
      if (score >= 7) return 'text-red-600'
      if (score >= 5) return 'text-yellow-600'
      return 'text-green-600'
    } else {
      if (score >= 7) return 'text-green-600'
      if (score >= 5) return 'text-yellow-600'
      return 'text-red-600'
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading weekly summary...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Weekly Summary</h2>
          <p className="text-gray-600">Comprehensive overview of student wellbeing</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>This Week</option>
            <option value={1}>Last Week</option>
            <option value={2}>2 Weeks Ago</option>
            <option value={3}>3 Weeks Ago</option>
            <option value={4}>4 Weeks Ago</option>
          </select>
          {summary && (
            <button
              onClick={exportSummary}
              className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          )}
        </div>
      </div>

      {!summary ? (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No data available for this week</p>
          <p className="text-sm">Try selecting a different week</p>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-r from-blue-900 to-red-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold">Week of {summary.weekStart}</h3>
                <p className="opacity-90">to {summary.weekEnd}</p>
              </div>
              <Calendar className="w-12 h-12 opacity-75" />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm opacity-90">Total Responses</p>
                <p className="text-3xl font-bold">{summary.totalResponses}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Unique Students</p>
                <p className="text-3xl font-bold">{summary.uniqueStudents}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Participation Rate</p>
                <p className="text-3xl font-bold">{summary.participationRate.toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Alerts</p>
                <p className="text-3xl font-bold">{summary.alertCount}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Sleep Quality</p>
              <p className={`text-3xl font-bold ${getScoreColor(summary.averageScores.sleep_quality)}`}>
                {summary.averageScores.sleep_quality.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">out of 10</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Energy Level</p>
              <p className={`text-3xl font-bold ${getScoreColor(summary.averageScores.energy_level)}`}>
                {summary.averageScores.energy_level.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">out of 10</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Mood</p>
              <p className={`text-3xl font-bold ${getScoreColor(summary.averageScores.mood)}`}>
                {summary.averageScores.mood.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">out of 10</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Stress Level</p>
              <p className={`text-3xl font-bold ${getScoreColor(summary.averageScores.stress_level, true)}`}>
                {summary.averageScores.stress_level.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">out of 10</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Training Fatigue</p>
              <p className={`text-3xl font-bold ${getScoreColor(summary.averageScores.training_fatigue, true)}`}>
                {summary.averageScores.training_fatigue.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">out of 10</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-900">Top Concerns</h3>
              </div>
              {summary.topConcerns.length > 0 ? (
                <ul className="space-y-2">
                  {summary.topConcerns.map((concern, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-600 mr-2">•</span>
                      <span className="text-red-800">{concern}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-red-700 text-sm">No significant concerns identified</p>
              )}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Positive Trends</h3>
              </div>
              {summary.improvements.length > 0 ? (
                <ul className="space-y-2">
                  {summary.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span className="text-green-800">{improvement}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-green-700 text-sm">Continue monitoring for positive trends</p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Recommended Actions</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              {summary.participationRate < 50 && (
                <li>Increase engagement: Participation rate is below 50%. Consider reminders or incentives.</li>
              )}
              {summary.alertCount > 5 && (
                <li>Follow up on alerts: {summary.alertCount} alerts triggered this week. Review and contact students.</li>
              )}
              {summary.averageScores.sleep_quality < 5 && (
                <li>Sleep education: Average sleep quality is low. Share sleep hygiene resources.</li>
              )}
              {summary.averageScores.stress_level > 6 && (
                <li>Stress management: Elevated stress levels detected. Consider stress reduction workshops.</li>
              )}
              {summary.topConcerns.length === 0 && summary.improvements.length > 0 && (
                <li>Continue current approach: Positive trends indicate effective support strategies.</li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
