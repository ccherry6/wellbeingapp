import React, { useState, useEffect } from 'react'
import { Download, FileText, Calendar, Filter, CheckCircle, AlertCircle, Microscope, Database } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { formatDateAEST } from '../../lib/dateUtils'

interface ResearchParticipant {
  id: string
  full_name: string
  research_code: string
  sport: string | null
  program_year: number | null
}

interface WellnessEntry {
  id: string
  user_id: string
  entry_date: string
  mood: number
  energy_level: number
  sleep_hours: number
  sleep_quality: number
  stress_level: number
  training_fatigue: number
  muscle_soreness: number
  academic_pressure: number
  relationship_satisfaction: number
  program_belonging: number
  hrv: number | null
  resting_heart_rate: number | null
  is_injured_or_sick: boolean | null
  injury_sickness_notes: string | null
  notes: string | null
}

interface ExportHistoryItem {
  id: string
  export_date: string
  start_date: string
  end_date: string
  participant_count: number
  research_codes: string[]
  fields_exported: string[]
  notes: string | null
}

const METRIC_FIELDS = [
  { id: 'mood', label: 'Mood', category: 'Wellbeing' },
  { id: 'energy_level', label: 'Energy Level', category: 'Wellbeing' },
  { id: 'sleep_hours', label: 'Sleep Hours', category: 'Sleep' },
  { id: 'sleep_quality', label: 'Sleep Quality', category: 'Sleep' },
  { id: 'stress_level', label: 'Stress Level', category: 'Wellbeing' },
  { id: 'training_fatigue', label: 'Training Fatigue', category: 'Physical' },
  { id: 'muscle_soreness', label: 'Muscle Soreness', category: 'Physical' },
  { id: 'academic_pressure', label: 'Academic Pressure', category: 'Wellbeing' },
  { id: 'relationship_satisfaction', label: 'Relationship Satisfaction', category: 'Wellbeing' },
  { id: 'program_belonging', label: 'Program Belonging', category: 'Wellbeing' },
  { id: 'hrv', label: 'HRV', category: 'Biometric' },
  { id: 'resting_heart_rate', label: 'Resting Heart Rate', category: 'Biometric' },
  { id: 'is_injured_or_sick', label: 'Injured/Sick Status', category: 'Health' },
]

export default function ResearchExport() {
  const { user } = useAuth()
  const [participants, setParticipants] = useState<ResearchParticipant[]>([])
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedFields, setSelectedFields] = useState<string[]>(METRIC_FIELDS.map(f => f.id))
  const [includeNotes, setIncludeNotes] = useState(false)
  const [exportNotes, setExportNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([])

  useEffect(() => {
    loadParticipants()
    loadExportHistory()

    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)

    setEndDate(today.toISOString().split('T')[0])
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0])
  }, [])

  const loadParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, research_code, sport, program_year')
        .eq('research_participant', true)
        .not('research_code', 'is', null)
        .order('research_code')

      if (error) throw error
      setParticipants(data || [])
      setSelectedParticipants((data || []).map(p => p.id))
    } catch (err) {
      console.error('Error loading participants:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadExportHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('research_exports')
        .select('*')
        .order('export_date', { ascending: false })
        .limit(10)

      if (error) throw error
      setExportHistory(data || [])
    } catch (err) {
      console.error('Error loading export history:', err)
    }
  }

  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants(prev =>
      prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    )
  }

  const toggleAllParticipants = () => {
    if (selectedParticipants.length === participants.length) {
      setSelectedParticipants([])
    } else {
      setSelectedParticipants(participants.map(p => p.id))
    }
  }

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    )
  }

  const toggleAllFields = () => {
    if (selectedFields.length === METRIC_FIELDS.length) {
      setSelectedFields([])
    } else {
      setSelectedFields(METRIC_FIELDS.map(f => f.id))
    }
  }

  const handleExport = async () => {
    if (selectedParticipants.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one participant' })
      return
    }

    if (selectedFields.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one field to export' })
      return
    }

    if (!startDate || !endDate) {
      setMessage({ type: 'error', text: 'Please select a date range' })
      return
    }

    setExporting(true)
    setMessage(null)

    try {
      const { data: entries, error } = await supabase
        .from('wellness_entries')
        .select('*')
        .in('user_id', selectedParticipants)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .order('entry_date', { ascending: true })

      if (error) throw error

      const participantMap = new Map(participants.map(p => [p.id, p]))

      const csvRows: string[] = []
      const headers = ['research_code', 'entry_date', ...selectedFields]
      if (includeNotes) headers.push('notes')
      csvRows.push(headers.join(','))

      entries.forEach((entry: WellnessEntry) => {
        const participant = participantMap.get(entry.user_id)
        if (!participant) return

        const row = [
          participant.research_code,
          entry.entry_date,
          ...selectedFields.map(field => {
            const value = entry[field as keyof WellnessEntry]
            return value !== null && value !== undefined ? String(value) : ''
          })
        ]

        if (includeNotes) {
          const notes = entry.notes || ''
          row.push(`"${notes.replace(/"/g, '""')}"`)
        }

        csvRows.push(row.join(','))
      })

      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      const filename = `research_export_${startDate}_to_${endDate}_${new Date().getTime()}.csv`
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      const researchCodes = selectedParticipants
        .map(id => participantMap.get(id)?.research_code)
        .filter(Boolean) as string[]

      await supabase
        .from('research_exports')
        .insert({
          exported_by: user?.id,
          start_date: startDate,
          end_date: endDate,
          participant_count: selectedParticipants.length,
          research_codes: researchCodes,
          fields_exported: selectedFields,
          notes: exportNotes.trim() || null
        })

      setMessage({
        type: 'success',
        text: `Successfully exported ${entries.length} records from ${selectedParticipants.length} participants`
      })

      loadExportHistory()
    } catch (err) {
      console.error('Export error:', err)
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to export data'
      })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading research participants...</div>
      </div>
    )
  }

  if (participants.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <Microscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Research Participants</h3>
          <p className="text-gray-600 mb-4">
            No students have been assigned research codes yet. Assign research codes in the User Management tab first.
          </p>
        </div>
      </div>
    )
  }

  const groupedFields = METRIC_FIELDS.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = []
    acc[field.category].push(field)
    return acc
  }, {} as Record<string, typeof METRIC_FIELDS>)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Microscope className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Research Data Export</h2>
            <p className="text-sm text-gray-600">Export anonymized wellbeing data for research analysis</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date Range
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Participants ({selectedParticipants.length}/{participants.length})
                </h3>
                <button
                  onClick={toggleAllParticipants}
                  className="text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  {selectedParticipants.length === participants.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                {participants.map((participant) => (
                  <label
                    key={participant.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedParticipants.includes(participant.id)}
                      onChange={() => toggleParticipant(participant.id)}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="font-mono font-medium text-green-700 text-sm">
                        {participant.research_code}
                      </div>
                      <div className="text-xs text-gray-500">
                        {participant.sport} {participant.program_year ? `• Year ${participant.program_year}` : ''}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Data Fields ({selectedFields.length}/{METRIC_FIELDS.length})
                </h3>
                <button
                  onClick={toggleAllFields}
                  className="text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  {selectedFields.length === METRIC_FIELDS.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
                {Object.entries(groupedFields).map(([category, fields]) => (
                  <div key={category} className="border-b border-gray-100 last:border-b-0">
                    <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-700">
                      {category}
                    </div>
                    {fields.map((field) => (
                      <label
                        key={field.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFields.includes(field.id)}
                          onChange={() => toggleField(field.id)}
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">{field.label}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                Include student notes (free-text fields)
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Warning: Notes may contain identifiable information
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Notes (optional)
              </label>
              <textarea
                value={exportNotes}
                onChange={(e) => setExportNotes(e.target.value)}
                placeholder="Add notes about this export for your records..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleExport}
            disabled={exporting || selectedParticipants.length === 0 || selectedFields.length === 0}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            {exporting ? 'Generating Export...' : 'Export Anonymized Data'}
          </button>
        </div>

        {message && (
          <div className={`mt-4 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message.text}
              </p>
            </div>
          </div>
        )}
      </div>

      {exportHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Export History</h3>
              <p className="text-sm text-gray-600">Recent research data exports</p>
            </div>
          </div>

          <div className="space-y-3">
            {exportHistory.map((record) => (
              <div key={record.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {formatDateAEST(record.export_date)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {record.start_date} to {record.end_date}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {record.participant_count} participants • {record.fields_exported.length} fields
                    </div>
                    {record.notes && (
                      <div className="text-xs text-gray-500 mt-1 italic">{record.notes}</div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Codes: {record.research_codes.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
