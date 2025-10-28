import React, { useState } from 'react'
import { Trash2, Microscope, Save } from 'lucide-react'
import { formatDateAEST } from '../../lib/dateUtils'

interface StudentRowProps {
  userProfile: {
    id: string
    email: string
    full_name: string | null
    role: string
    student_id: string | null
    sport: string | null
    program_year: number | null
    created_at: string
    research_code: string | null
    research_notes: string | null
  }
  currentUserId: string | undefined
  onRoleChange: (userId: string, newRole: string) => void
  onDelete: (userId: string, userEmail: string) => void
  onResearchCodeUpdate: (userId: string, researchCode: string, notes: string) => void
}

export function StudentRow({
  userProfile,
  currentUserId,
  onRoleChange,
  onDelete,
  onResearchCodeUpdate
}: StudentRowProps) {
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
                  onResearchCodeUpdate(userProfile.id, tempResearchCode, tempResearchNotes)
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
          onChange={(e) => onRoleChange(userProfile.id, e.target.value)}
          disabled={userProfile.id === currentUserId}
          className="text-sm px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="student">Student</option>
          <option value="coach">Coach</option>
          <option value="admin">Admin</option>
        </select>
      </td>
      <td className="py-3 px-4">
        <button
          onClick={() => onDelete(userProfile.id, userProfile.email)}
          disabled={userProfile.id === currentUserId}
          className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete user"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  )
}
