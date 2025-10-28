import React, { useState, useEffect } from 'react'
import { UserPlus, Mail, Trash2, CheckCircle, XCircle, Users, Copy, GraduationCap, User, Microscope, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { formatDateAEST } from '../../lib/dateUtils'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: string
  actual_role: string
  student_id: string | null
  sport: string | null
  program_year: number | null
  created_at: string
  research_code: string | null
  research_participant: boolean
  research_notes: string | null
}

export default function UserManagement() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<'coach' | 'student'>('coach')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'coaches' | 'students'>('students')

  const REGISTRATION_CODE = 'BDC2026'

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, role, actual_role, student_id, sport, program_year, created_at, research_code, research_participant, research_notes')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id) {
      setMessage({ type: 'error', text: 'You must be logged in to send invitations' })
      return
    }

    setSending(true)
    setMessage(null)

    try {
      const inviteUrl = import.meta.env.VITE_APP_URL || window.location.origin

      const { data: inviterProfile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle()

      const { data: tokenData, error: insertError } = await supabase
        .from('invitation_tokens')
        .insert({
          email: inviteEmail,
          role: inviteRole,
          invited_by: user.id
        })
        .select()
        .single()

      if (insertError || !tokenData) {
        console.error('Database error:', insertError)
        throw new Error('Failed to create invitation')
      }

      const inviteUrlWithToken = `${inviteUrl}?token=${tokenData.token}`
      console.log('📧 Sending invitation email to:', inviteEmail)
      console.log('🎫 Invitation URL:', inviteUrlWithToken)
      const emailPayload = {
        inviteeName: inviteName,
        inviteeEmail: inviteEmail,
        role: inviteRole,
        registrationCode: REGISTRATION_CODE,
        inviteUrl: inviteUrlWithToken,
        inviterName: inviterProfile?.full_name || 'BDC Admin'
      }

      console.log('📨 Email payload:', emailPayload)

      const emailResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invitation-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify(emailPayload)
        }
      )

      const emailResult = await emailResponse.json()
      console.log('📧 Email response:', emailResult)

      if (!emailResponse.ok) {
        console.error('Email send failed:', emailResult)
        throw new Error(emailResult.error || 'Failed to send invitation email')
      }

      setMessage({
        type: 'success',
        text: `Invitation sent successfully to ${inviteEmail}!\n\nThe recipient will receive an email with:\n• Registration link\n• Registration code: ${REGISTRATION_CODE}\n• Instructions to complete signup`
      })

      setInviteEmail('')
      setInviteName('')
      setInviteRole('coach')
      loadUsers()
    } catch (err) {
      console.error('Invitation error:', err)
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to send invitation. Please try again.'
      })
    } finally {
      setSending(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole, actual_role: newRole })
        .eq('id', userId)

      if (error) throw error

      setMessage({ type: 'success', text: 'User role updated successfully' })
      loadUsers()
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update role'
      })
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete ${userEmail}? This cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId)

      if (error) throw error

      setMessage({ type: 'success', text: 'User deleted successfully' })
      loadUsers()
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Only database administrators can delete users. You can change their role instead.'
      })
    }
  }

  const handleResearchCodeUpdate = async (userId: string, researchCode: string, notes: string) => {
    try {
      const isParticipant = researchCode.trim() !== ''

      const { error } = await supabase
        .from('user_profiles')
        .update({
          research_code: researchCode.trim() || null,
          research_participant: isParticipant,
          research_notes: notes.trim() || null
        })
        .eq('id', userId)

      if (error) throw error

      setMessage({ type: 'success', text: 'Research code updated successfully' })
      loadUsers()
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update research code'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading users...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">You must be logged in to manage users.</div>
      </div>
    )
  }

  const coaches = users.filter(u => u.actual_role === 'coach' || u.actual_role === 'admin')
  const students = users.filter(u => u.actual_role === 'student')

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <UserPlus className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Invite New User</h2>
            <p className="text-sm text-gray-600">Send an invitation to join as coach or student</p>
          </div>
        </div>

        <form onSubmit={handleInvite} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Enter full name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@bdc.nsw.edu.au"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'coach' | 'student')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="coach">Coach (Full Access)</option>
              <option value="student">Student</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Mail className="w-5 h-5" />
            {sending ? 'Sending Email...' : 'Send Invitation Email'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm whitespace-pre-line ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message.text}
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Registration Code:</h4>
          <div className="flex items-center gap-2">
            <code className="bg-white px-3 py-2 rounded border border-blue-200 text-blue-900 font-mono flex-1">
              {REGISTRATION_CODE}
            </code>
            <button
              onClick={() => copyToClipboard(REGISTRATION_CODE, 'code')}
              className="p-2 bg-white border border-blue-200 rounded hover:bg-blue-100 transition-colors"
              title="Copy registration code"
            >
              {copiedField === 'code' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-blue-600" />
              )}
            </button>
          </div>
          <p className="text-sm text-blue-800 mt-2">
            Share this code with new users when they register
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            <p className="text-sm text-gray-600">{users.length} total users ({coaches.length} coaches, {students.length} students)</p>
          </div>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('students')}
              className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'students'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Students ({students.length})
            </button>
            <button
              onClick={() => setActiveTab('coaches')}
              className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'coaches'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4" />
              Coaches ({coaches.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'students' ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Student</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Student ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Sport</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Year</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Research Code</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">
                      No students found. Invite students using the form above.
                    </td>
                  </tr>
                ) : (
                  students.map((userProfile) => {
                    const [editingResearch, setEditingResearch] = useState(false)
                    const [tempResearchCode, setTempResearchCode] = useState(userProfile.research_code || '')
                    const [tempResearchNotes, setTempResearchNotes] = useState(userProfile.research_notes || '')

                    return (
                      <tr key={userProfile.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">
                            {userProfile.full_name || 'No name'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDateAEST(userProfile.created_at)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{userProfile.email}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {userProfile.student_id || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {userProfile.sport || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {userProfile.program_year ? `Year ${userProfile.program_year}` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          {editingResearch ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={tempResearchCode}
                                onChange={(e) => setTempResearchCode(e.target.value)}
                                placeholder="e.g., SA-001"
                                className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                              <input
                                type="text"
                                value={tempResearchNotes}
                                onChange={(e) => setTempResearchNotes(e.target.value)}
                                placeholder="Notes (optional)"
                                className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    handleResearchCodeUpdate(userProfile.id, tempResearchCode, tempResearchNotes)
                                    setEditingResearch(false)
                                  }}
                                  className="flex-1 text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 flex items-center justify-center gap-1"
                                >
                                  <Save className="w-3 h-3" />
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingResearch(false)
                                    setTempResearchCode(userProfile.research_code || '')
                                    setTempResearchNotes(userProfile.research_notes || '')
                                  }}
                                  className="flex-1 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingResearch(true)}
                              className="flex items-center gap-1 text-sm text-gray-700 hover:text-green-600 transition-colors"
                            >
                              {userProfile.research_code ? (
                                <>
                                  <Microscope className="w-4 h-4 text-green-600" />
                                  <span className="font-mono font-medium text-green-700">{userProfile.research_code}</span>
                                </>
                              ) : (
                                <>
                                  <Microscope className="w-4 h-4" />
                                  <span className="text-gray-500">Assign code</span>
                                </>
                              )}
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={userProfile.role}
                            onChange={(e) => handleRoleChange(userProfile.id, e.target.value)}
                            disabled={userProfile.id === user?.id}
                            className="text-sm px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="student">Student</option>
                            <option value="coach">Coach</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleDeleteUser(userProfile.id, userProfile.email)}
                            disabled={userProfile.id === user?.id}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Coach</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coaches.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      No coaches found. Invite coaches using the form above.
                    </td>
                  </tr>
                ) : (
                  coaches.map((userProfile) => (
                    <tr key={userProfile.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {userProfile.full_name || 'No name'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDateAEST(userProfile.created_at)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{userProfile.email}</td>
                      <td className="py-3 px-4">
                        <select
                          value={userProfile.role}
                          onChange={(e) => handleRoleChange(userProfile.id, e.target.value)}
                          disabled={userProfile.id === user?.id}
                          className="text-sm px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="student">Student</option>
                          <option value="coach">Coach</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDeleteUser(userProfile.id, userProfile.email)}
                          disabled={userProfile.id === user?.id}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
