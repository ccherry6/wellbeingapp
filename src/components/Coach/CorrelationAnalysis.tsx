import React, { useState, useEffect } from 'react'
import { Activity, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface CorrelationData {
  factor1: string
  factor2: string
  correlation: number
  sampleSize: number
  strength: 'strong' | 'moderate' | 'weak'
  direction: 'positive' | 'negative'
}

export default function CorrelationAnalysis() {
  const [correlations, setCorrelations] = useState<CorrelationData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    calculateCorrelations()
  }, [])

  const calculateCorrelations = async () => {
    try {
      const { data: entries, error } = await supabase
        .from('wellness_entries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (error) throw error
      if (!entries || entries.length < 10) {
        setLoading(false)
        return
      }

      const factors = [
        { key: 'sleep_quality', label: 'Sleep Quality' },
        { key: 'sleep_hours', label: 'Sleep Hours' },
        { key: 'energy_level', label: 'Energy Level' },
        { key: 'training_fatigue', label: 'Training Fatigue' },
        { key: 'muscle_soreness', label: 'Muscle Soreness' },
        { key: 'mood', label: 'Mood' },
        { key: 'stress_level', label: 'Stress Level' },
        { key: 'academic_pressure', label: 'Academic Pressure' },
        { key: 'relationship_satisfaction', label: 'Relationship Satisfaction' },
        { key: 'program_belonging', label: 'Program Belonging' },
        { key: 'hrv', label: 'HRV' },
        { key: 'resting_heart_rate', label: 'Resting HR' }
      ]

      const correlationResults: CorrelationData[] = []

      for (let i = 0; i < factors.length; i++) {
        for (let j = i + 1; j < factors.length; j++) {
          const factor1 = factors[i]
          const factor2 = factors[j]

          const values1: number[] = []
          const values2: number[] = []

          entries.forEach(entry => {
            const val1 = entry[factor1.key as keyof typeof entry]
            const val2 = entry[factor2.key as keyof typeof entry]
            if (typeof val1 === 'number' && typeof val2 === 'number') {
              values1.push(val1)
              values2.push(val2)
            }
          })

          if (values1.length > 5) {
            const correlation = calculatePearsonCorrelation(values1, values2)
            const absCorr = Math.abs(correlation)

            if (absCorr > 0.3) {
              correlationResults.push({
                factor1: factor1.label,
                factor2: factor2.label,
                correlation: correlation,
                sampleSize: values1.length,
                strength: absCorr > 0.7 ? 'strong' : absCorr > 0.5 ? 'moderate' : 'weak',
                direction: correlation > 0 ? 'positive' : 'negative'
              })
            }
          }
        }
      }

      correlationResults.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
      setCorrelations(correlationResults)
    } catch (error) {
      console.error('Error calculating correlations:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePearsonCorrelation = (x: number[], y: number[]): number => {
    const n = x.length
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

    return denominator === 0 ? 0 : numerator / denominator
  }

  const getCorrelationColor = (correlation: number) => {
    const abs = Math.abs(correlation)
    if (abs > 0.7) return correlation > 0 ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'
    if (abs > 0.5) return correlation > 0 ? 'bg-blue-100 border-blue-300' : 'bg-orange-100 border-orange-300'
    return 'bg-gray-100 border-gray-300'
  }

  const getStrengthBadge = (strength: string) => {
    switch (strength) {
      case 'strong':
        return 'bg-blue-900 text-white'
      case 'moderate':
        return 'bg-blue-600 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  if (loading) {
    return <div className="text-center py-8">Analyzing correlations...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Correlation Analysis</h2>
        <p className="text-gray-600">Discover relationships between wellbeing factors</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Understanding Correlations
        </h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Positive correlation:</strong> When one factor increases, the other tends to increase</p>
          <p><strong>Negative correlation:</strong> When one factor increases, the other tends to decrease</p>
          <p><strong>Strength:</strong> Strong (0.7+), Moderate (0.5-0.7), Weak (0.3-0.5)</p>
          <p className="text-xs mt-2 opacity-75">Note: Correlation does not imply causation. These patterns help identify areas for further investigation.</p>
        </div>
      </div>

      {correlations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Not enough data yet to calculate correlations</p>
          <p className="text-sm">Need at least 10 wellness entries</p>
        </div>
      ) : (
        <div className="space-y-3">
          {correlations.map((corr, index) => (
            <div
              key={index}
              className={`border-2 rounded-lg p-4 ${getCorrelationColor(corr.correlation)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStrengthBadge(corr.strength)}`}>
                      {corr.strength.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      corr.direction === 'positive'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {corr.direction === 'positive' ? 'POSITIVE' : 'NEGATIVE'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">
                    {corr.factor1} ↔ {corr.factor2}
                  </h3>
                  <p className="text-sm opacity-75">
                    Based on {corr.sampleSize} data points
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    {(corr.correlation * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs opacity-75">Correlation</div>
                </div>
              </div>

              <div className="bg-white bg-opacity-50 rounded p-3">
                <div className="flex items-center space-x-2 mb-2">
                  {corr.direction === 'positive' ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                  <span className="text-sm font-medium">Interpretation:</span>
                </div>
                <p className="text-sm">
                  {corr.direction === 'positive' ? (
                    <>
                      Higher <strong>{corr.factor1}</strong> is associated with higher <strong>{corr.factor2}</strong>.
                      When students report improvements in one area, they tend to report improvements in the other as well.
                    </>
                  ) : (
                    <>
                      Higher <strong>{corr.factor1}</strong> is associated with lower <strong>{corr.factor2}</strong>.
                      When one factor increases, the other tends to decrease.
                    </>
                  )}
                </p>
              </div>

              <div className="mt-3">
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 ${
                      corr.correlation > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.abs(corr.correlation) * 100}%`,
                      marginLeft: corr.correlation < 0 ? `${100 - Math.abs(corr.correlation) * 100}%` : '0'
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>-100% (Strong Negative)</span>
                  <span>0 (No Correlation)</span>
                  <span>+100% (Strong Positive)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">Actionable Insights</h3>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li>Strong correlations suggest areas where targeted interventions could have broad benefits</li>
          <li>Negative correlations between stress/fatigue and wellbeing highlight the importance of recovery</li>
          <li>Positive correlations between sleep and performance metrics emphasize sleep hygiene</li>
          <li>Use these insights to design holistic support programs addressing interconnected factors</li>
        </ul>
      </div>
    </div>
  )
}
