import React, { useState, useEffect } from 'react'
import { Download, FileText, Calendar, Filter, CheckCircle, AlertCircle, Microscope, Database, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { formatDateAEST } from '../../lib/dateUtils'

interface UserProfile {
  id: string
  full_name: string
  email: string
  student_id: string | null
  research_code: string | null
  sport: string | null
  program_year: number | null
  role: string
  research_participant: boolean | null
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

type ExportMode = 'all_users' | 'research_only'

export default function ResearchExport() {
  const { user } = useAuth()
  const [allUsers, setAllUsers] = useState<UserProfile[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedFields, setSelectedFields] = useState<string[]>(METRIC_FIELDS.map(f => f.id))
  const [includeNotes, setIncludeNotes] = useState(false)
  const [includeInjuryNotes, setIncludeInjuryNotes] = useState(false)
  const [exportNotes, setExportNotes] = useState('')
  const [exportMode, setExportMode] = useState<ExportMode>('all_users')
  const [identifierMode, setIdentifierMode] = useState<'anonymized' | 'full'>('anonymized')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([])
  const [userFilter, setUserFilter] = useState('')

  useEffect(() => {
    loadUsers()
    loadExportHistory()

    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)

    setEndDate(today.toISOString().split('T')[0])
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    const filtered = getFilteredUsers()
    setSelectedUsers(filtered.map(u => u.id))
  }, [exportMode, allUsers])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, student_id, research_code, sport, program_year, role, research_participant')
        .order('full_name')

      if (error) throw error
      setAllUsers(data || [])
      setSelectedUsers((data || []).map(u => u.id))
    } catch (err) {
      console.error('Error loading users:', err)
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

  const getFilteredUsers = () => {
    let users = allUsers
    if (exportMode === 'research_only') {
      users = users.filter(u => u.research_participant && u.research_code)
    }
    if (userFilter.trim()) {
      const q = userFilter.toLowerCase()
      users = users.filter(u =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.student_id?.toLowerCase().includes(q) ||
        u.research_code?.toLowerCase().includes(q)
      )
    }
    return users
  }

  const filteredUsers = getFilteredUsers()

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const toggleAllUsers = () => {
    const filtered = filteredUsers
    const allSelected = filtered.every(u => selectedUsers.includes(u.id))
    if (allSelected) {
      setSelectedUsers(prev => prev.filter(id => !filtered.some(u => u.id === id)))
    } else {
      setSelectedUsers(prev => [...new Set([...prev, ...filtered.map(u => u.id)])])
    }
  }

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId]
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
    if (selectedUsers.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one user' })
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
        .in('user_id', selectedUsers)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .order('user_id', { ascending: true })
        .order('entry_date', { ascending: true })

      if (error) throw error

      const userMap = new Map(allUsers.map(u => [u.id, u]))

      const csvRows: string[] = []

      const identifierHeader = identifierMode === 'anonymized' ? 'identifier' : 'full_name'
      const headers = [
        identifierHeader,
        identifierMode === 'full' ? 'email' : null,
        identifierMode === 'full' ? 'student_id' : null,
        'sport',
        'program_year',
        'entry_date',
        ...selectedFields,
      ].filter(Boolean) as string[]

      if (includeNotes) headers.push('notes')
      if (includeInjuryNotes) headers.push('injury_sickness_notes')
      csvRows.push(headers.join(','))

      entries.forEach((entry: WellnessEntry) => {
        const u = userMap.get(entry.user_id)
        if (!u) return

        let identifier: string
        if (identifierMode === 'anonymized') {
          identifier = u.research_code || `USER-${entry.user_id.slice(0, 8)}`
        } else {
          identifier = u.full_name || u.email
        }

        const row: string[] = [
          `"${identifier}"`,
        ]

        if (identifierMode === 'full') {
          row.push(`"${u.email || ''}"`)
          row.push(`"${u.student_id || ''}"`)
        }

        row.push(`"${u.sport || ''}"`)
        row.push(`"${u.program_year || ''}"`)
        row.push(entry.entry_date)

        selectedFields.forEach(field => {
          const value = entry[field as keyof WellnessEntry]
          row.push(value !== null && value !== undefined ? String(value) : '')
        })

        if (includeNotes) {
          const notes = entry.notes || ''
          row.push(`"${notes.replace(/"/g, '""')}"`)
        }

        if (includeInjuryNotes) {
          const injuryNotes = entry.injury_sickness_notes || ''
          row.push(`"${injuryNotes.replace(/"/g, '""')}"`)
        }

        csvRows.push(row.join(','))
      })

      const csvContent = csvRows.join('\n')
      const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent)
      const link = document.createElement('a')
      const filename = `wellbeing_export_${startDate}_to_${endDate}_${new Date().getTime()}.csv`
      link.setAttribute('href', dataUri)
      link.setAttribute('download', filename)
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      const researchCodes = selectedUsers
        .map(id => userMap.get(id)?.research_code || userMap.get(id)?.full_name || id)
        .filter(Boolean) as string[]

      await supabase
        .from('research_exports')
        .insert({
          exported_by: user?.id,
          start_date: startDate,
          end_date: endDate,
          participant_count: selectedUsers.length,
          research_codes: researchCodes,
          fields_exported: selectedFields,
          notes: exportNotes.trim() || null
        })

      setMessage({
        type: 'success',
        text: `Successfully exported ${entries.length} records from ${selectedUsers.length} users`
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
        <div className="text-gray-600">Loading users...</div>
      </div>
    )
  }

  const groupedFields = METRIC_FIELDS.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = []
    acc[field.category].push(field)
    return acc
  }, {} as Record<string, typeof METRIC_FIELDS>)

  const allFilteredSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedUsers.includes(u.id))

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Microscope className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Research Data Export</h2>
            <p className="text-sm text-gray-600">Export wellbeing data as CSV for research analysis</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">User Scope</label>
            <div className="flex gap-2">
              <button
                onClick={() => setExportMode('all_users')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  exportMode === 'all_users'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                }`}
              >
                <Users className="w-3.5 h-3.5 inline mr-1.5" />
                All Users
              </button>
              <button
                onClick={() => setExportMode('research_only')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  exportMode === 'research_only'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                }`}
              >
                <Microscope className="w-3.5 h-3.5 inline mr-1.5" />
                Research Participants Only
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Identifier in Export</label>
            <div className="flex gap-2">
              <button
                onClick={() => setIdentifierMode('anonymized')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  identifierMode === 'anonymized'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                Anonymized Code
              </button>
              <button
                onClick={() => setIdentifierMode('full')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  identifierMode === 'full'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                Full Name + Email
              </button>
            </div>
            {identifierMode === 'full' && (
              <p className="text-xs text-amber-700 mt-1.5 bg-amber-50 px-2 py-1 rounded">
                Full identifiers included - handle with care
              </p>
            )}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Users ({selectedUsers.filter(id => filteredUsers.some(u => u.id === id)).length}/{filteredUsers.length} selected)
                </h3>
                <button
                  onClick={toggleAllUsers}
                  className="text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  {allFilteredSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <input
                type="text"
                placeholder="Search users..."
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-gray-500 text-center">No users found</div>
                ) : (
                  filteredUsers.map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(u.id)}
                        onChange={() => toggleUser(u.id)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 text-sm truncate">
                            {u.full_name || u.email}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            u.role === 'coach' || u.role === 'admin'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {u.role}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {u.research_code && (
                            <span className="font-mono text-green-700 mr-2">{u.research_code}</span>
                          )}
                          {u.sport && <span>{u.sport}</span>}
                          {u.program_year && <span> · Year {u.program_year}</span>}
                        </div>
                      </div>
                    </label>
                  ))
                )}
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
              <div className="border border-gray-200 rounded-lg max-h-72 overflow-y-auto">
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

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                Include student notes (free-text)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeInjuryNotes}
                  onChange={(e) => setIncludeInjuryNotes(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                Include injury/sickness notes
              </label>
              {(includeNotes || includeInjuryNotes) && (
                <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1.5 rounded ml-6">
                  Free-text notes may contain identifiable information
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Notes (optional)
              </label>
              <textarea
                value={exportNotes}
                onChange={(e) => setExportNotes(e.target.value)}
                placeholder="Add notes about this export for your records..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleExport}
            disabled={exporting || selectedUsers.length === 0 || selectedFields.length === 0}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            {exporting
              ? 'Generating Export...'
              : `Export ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''} to CSV`}
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
              <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
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
              <p className="text-sm text-gray-600">Recent data exports</p>
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
                      {record.participant_count} users · {record.fields_exported.length} fields
                    </div>
                    {record.notes && (
                      <div className="text-xs text-gray-500 mt-1 italic">{record.notes}</div>
                    )}
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
