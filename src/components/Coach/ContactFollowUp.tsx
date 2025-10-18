import React, { useState, useEffect } from 'react'
import { MessageCircle, Clock, Check, Calendar, AlertTriangle, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { format } from 'date-fns'

interface ContactRequest {
  id: string
  entry_date: string
  created_at: string
  student_id: string
  student_name: string
  student_email: string
  sport: string
  speak_to_who: string
  speak_to_email: string
  contact_status: 'pending' | 'contacted' | 'scheduled' | 'completed'
  contacted_by?: string
  contacted_by_name?: string
  contacted_at?: string
  contact_notes?: string
  is_injured_or_sick?: boolean
  injury_sickness_notes?: string
}

export function ContactFollowUp() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<ContactRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'contacted' | 'scheduled' | 'completed'>('all')

  useEffect(() => {
    fetchContactRequests()
  }, [])

  const fetchContactRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('wellness_entries')
        .select(`
          id,
          entry_date,
          created_at,
          user_id,
          speak_to_who,
          speak_to_email,
          contact_status,
          contacted_by,
          contacted_at,
          contact_notes,
          is_injured_or_sick,
          injury_sickness_notes,
          user_profiles!inner (
            id,
            full_name,
            email,
            sport
          )
        `)
        .eq('wants_to_speak', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedRequests: ContactRequest[] = (data || []).map((entry: any) => ({
        id: entry.id,
        entry_date: entry.entry_date,
        created_at: entry.created_at,
        student_id: entry.user_id,
        student_name: entry.user_profiles.full_name,
        student_email: entry.user_profiles.email,
        sport: entry.user_profiles.sport,
        speak_to_who: entry.speak_to_who,
        speak_to_email: entry.speak_to_email,
        contact_status: entry.contact_status || 'pending',
        contacted_by: entry.contacted_by,
        contacted_at: entry.contacted_at,
        contact_notes: entry.contact_notes,
        is_injured_or_sick: entry.is_injured_or_sick,
        injury_sickness_notes: entry.injury_sickness_notes
      }))

      setRequests(formattedRequests)
    } catch (error) {
      // Silently handle error
    } finally {
      setLoading(false)
    }
  }

  const updateContactStatus = async (
    requestId: string,
    status: 'pending' | 'contacted' | 'scheduled' | 'completed',
    notes?: string
  ) => {
    try {
      const { error } = await supabase
        .from('wellness_entries')
        .update({
          contact_status: status,
          contacted_by: user?.id,
          contacted_at: new Date().toISOString(),
          contact_notes: notes || null
        })
        .eq('id', requestId)

      if (error) throw error

      await fetchContactRequests()
      setSelectedRequest(null)
    } catch (error) {
      alert('Failed to update contact status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'contacted': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'scheduled': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'completed': return 'bg-green-100 text-green-800 border-green-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'contacted': return <MessageCircle className="w-4 h-4" />
      case 'scheduled': return <Calendar className="w-4 h-4" />
      case 'completed': return <Check className="w-4 h-4" />
      default: return <MessageCircle className="w-4 h-4" />
    }
  }

  const filteredRequests = statusFilter === 'all'
    ? requests
    : requests.filter(r => r.contact_status === statusFilter)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Contact Follow-up</h2>
        <div className="flex space-x-2">
          {['all', 'pending', 'contacted', 'scheduled', 'completed'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter as any)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === filter
                  ? 'bg-blue-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="text-sm font-medium text-yellow-900 mb-1">Pending</h3>
          <p className="text-2xl font-bold text-yellow-700">
            {requests.filter(r => r.contact_status === 'pending').length}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-900 mb-1">Contacted</h3>
          <p className="text-2xl font-bold text-blue-700">
            {requests.filter(r => r.contact_status === 'contacted').length}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="text-sm font-medium text-purple-900 mb-1">Scheduled</h3>
          <p className="text-2xl font-bold text-purple-700">
            {requests.filter(r => r.contact_status === 'scheduled').length}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-sm font-medium text-green-900 mb-1">Completed</h3>
          <p className="text-2xl font-bold text-green-700">
            {requests.filter(r => r.contact_status === 'completed').length}
          </p>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No contact requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{request.student_name}</h3>
                      <p className="text-sm text-gray-600">
                        {request.student_email} • {request.sport}
                      </p>
                    </div>
                    {request.is_injured_or_sick && (
                      <span className="flex items-center space-x-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Injured/Sick</span>
                      </span>
                    )}
                  </div>

                  <div className="ml-13 space-y-2">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Wants to speak with:</strong> {request.speak_to_who}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Email: {request.speak_to_email}
                      </p>
                    </div>

                    {request.is_injured_or_sick && request.injury_sickness_notes && (
                      <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                        <p className="text-sm font-medium text-orange-900 mb-1">Injury/Sickness Notes:</p>
                        <p className="text-sm text-orange-800">{request.injury_sickness_notes}</p>
                      </div>
                    )}

                    {request.contact_notes && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 mb-1">Follow-up Notes:</p>
                        <p className="text-sm text-gray-700">{request.contact_notes}</p>
                        {request.contacted_at && (
                          <p className="text-xs text-gray-500 mt-2">
                            Updated: {format(new Date(request.contacted_at), 'MMM dd, yyyy h:mm a')}
                          </p>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-gray-500">
                      Requested: {format(new Date(request.created_at), 'MMM dd, yyyy h:mm a')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2 ml-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getStatusColor(request.contact_status)}`}>
                    {getStatusIcon(request.contact_status)}
                    <span className="capitalize">{request.contact_status}</span>
                  </span>

                  {selectedRequest === request.id ? (
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2 w-64">
                      <textarea
                        id={`notes-${request.id}`}
                        placeholder="Add follow-up notes..."
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        rows={2}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            const notes = (document.getElementById(`notes-${request.id}`) as HTMLTextAreaElement)?.value
                            updateContactStatus(request.id, 'contacted', notes)
                          }}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        >
                          Contacted
                        </button>
                        <button
                          onClick={() => {
                            const notes = (document.getElementById(`notes-${request.id}`) as HTMLTextAreaElement)?.value
                            updateContactStatus(request.id, 'scheduled', notes)
                          }}
                          className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                        >
                          Scheduled
                        </button>
                        <button
                          onClick={() => {
                            const notes = (document.getElementById(`notes-${request.id}`) as HTMLTextAreaElement)?.value
                            updateContactStatus(request.id, 'completed', notes)
                          }}
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          Completed
                        </button>
                        <button
                          onClick={() => setSelectedRequest(null)}
                          className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedRequest(request.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Update Status
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
