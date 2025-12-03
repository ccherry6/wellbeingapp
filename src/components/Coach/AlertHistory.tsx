import React, { useState, useEffect } from 'react'
import { AlertCircle, Clock, Mail, User, Calendar, Filter, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'

interface Alert {
  id: string
  student_id: string
  student_name: string
  student_email: string
  sport: string
  metric_triggered: string
  score_value: string
  admin_email: string
  alert_sent_at: string
  created_at: string
}

export function AlertHistory() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSport, setFilterSport] = useState<string>('all')
  const [filterDays, setFilterDays] = useState<number>(30)
  const [sports, setSports] = useState<string[]>([])

  useEffect(() => {
    fetchAlerts()
  }, [filterSport, filterDays])

  const fetchAlerts = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('auto_alert_logs')
        .select(`
          *,
          user_profiles!auto_alert_logs_student_id_fkey (
            full_name,
            email,
            sport
          )
        `)
        .order('alert_sent_at', { ascending: false })

      if (filterDays > 0) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - filterDays)
        query = query.gte('alert_sent_at', cutoffDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      const formattedAlerts = data.map((alert: any) => ({
        id: alert.id,
        student_id: alert.student_id,
        student_name: alert.user_profiles?.full_name || 'Unknown',
        student_email: alert.user_profiles?.email || '',
        sport: alert.user_profiles?.sport || 'N/A',
        metric_triggered: alert.metric_triggered,
        score_value: alert.score_value,
        admin_email: alert.admin_email,
        alert_sent_at: alert.alert_sent_at,
        created_at: alert.created_at
      }))

      const filteredAlerts = filterSport === 'all'
        ? formattedAlerts
        : formattedAlerts.filter(a => a.sport === filterSport)

      setAlerts(filteredAlerts)

      const uniqueSports = [...new Set(formattedAlerts.map(a => a.sport).filter(Boolean))]
      setSports(uniqueSports.sort())
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const parseMetrics = (metricString: string): string[] => {
    return metricString.split(', ').filter(Boolean)
  }

  const getSeverityColor = (count: number): string => {
    if (count >= 7) return 'bg-red-100 border-red-500 text-red-900'
    if (count >= 5) return 'bg-orange-100 border-orange-500 text-orange-900'
    return 'bg-yellow-100 border-yellow-500 text-yellow-900'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <AlertCircle className="w-7 h-7 mr-2 text-red-600" />
            Alert History
          </h2>
          <p className="text-gray-600 mt-1">Review all automated critical wellbeing alerts</p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900 font-semibold">{alerts.length} Total Alerts</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex-1 flex items-center space-x-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Time Period:</label>
              <select
                value={filterDays}
                onChange={(e) => setFilterDays(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={0}>All time</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Sport:</label>
              <select
                value={filterSport}
                onChange={(e) => setFilterSport(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Sports</option>
                {sports.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>
            {(filterSport !== 'all' || filterDays !== 30) && (
              <button
                onClick={() => {
                  setFilterSport('all')
                  setFilterDays(30)
                }}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">No alerts found</p>
          <p className="text-gray-500 text-sm mt-2">
            {filterSport !== 'all' || filterDays !== 30
              ? 'Try adjusting your filters'
              : 'Critical alerts will appear here when students report concerning scores'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const metrics = parseMetrics(alert.metric_triggered)
            const severityClass = getSeverityColor(metrics.length)

            return (
              <div
                key={alert.id}
                className={`rounded-lg border-l-4 p-6 ${severityClass}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <User className="w-5 h-5" />
                      <h3 className="text-lg font-bold">{alert.student_name}</h3>
                      {alert.sport && (
                        <span className="text-sm bg-white bg-opacity-60 px-3 py-1 rounded-full font-medium">
                          {alert.sport}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm">
                        <Mail className="w-4 h-4 mr-2 opacity-60" />
                        <span>{alert.student_email}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="w-4 h-4 mr-2 opacity-60" />
                        <span>{format(new Date(alert.alert_sent_at), 'PPp')}</span>
                      </div>
                    </div>

                    <div className="bg-white bg-opacity-60 rounded-lg p-4">
                      <p className="text-sm font-semibold mb-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Critical Metrics ({metrics.length}):
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {metrics.map((metric, idx) => (
                          <div key={idx} className="text-sm font-medium">
                            • {metric}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 text-right">
                    <div className="bg-white bg-opacity-80 rounded-lg px-4 py-2">
                      <p className="text-xs text-gray-600">Alert sent to:</p>
                      <p className="text-sm font-semibold">{alert.admin_email}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
