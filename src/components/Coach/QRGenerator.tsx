import React, { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'
import { QrCode, RefreshCw, Copy, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Student {
  id: string
  full_name: string
  student_id: string
  sport: string
  program_year: string
}

export function QRGenerator() {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [qrToken, setQrToken] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .in('role', ['student', 'admin'])
        .order('full_name')

      if (error) throw error
      
      setStudents(data.map(user => ({
        id: user.id,
        full_name: user.full_name || '',
        student_id: user.student_id || '',
        sport: user.sport || '',
        program_year: user.program_year?.toString() || '',
      })))
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const generateQRCode = async () => {
    if (!selectedStudent) return

    setLoading(true)
    try {
      // Generate a unique session token
      const sessionToken = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now

      const { error } = await supabase
        .from('login_sessions')
        .insert({
          qr_code: sessionToken,
          user_id: selectedStudent,
          expires_at: expiresAt.toISOString(),
          is_used: false
        })

      if (error) throw error
      
      setQrToken(sessionToken)
    } catch (error) {
      console.error('Error generating QR code:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const selectedStudentData = students.find(s => s.id === selectedStudent)

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <QrCode className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl font-semibold text-gray-900">QR Code Generator</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Student
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Choose a student...</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.full_name} ({student.student_id}) - {student.sport}
                </option>
              ))}
            </select>
          </div>

          {selectedStudentData && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Selected Student</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Name:</strong> {selectedStudentData.full_name}</p>
                <p><strong>ID:</strong> {selectedStudentData.student_id}</p>
                <p><strong>Sport:</strong> {selectedStudentData.sport}</p>
                <p><strong>Program Year:</strong> {selectedStudentData.program_year}</p>
              </div>
            </div>
          )}

          <button
            onClick={generateQRCode}
            disabled={!selectedStudent || loading}
            className="w-full bg-blue-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-800 focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <QrCode className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Generating...' : 'Generate QR Code'}
          </button>

          {qrToken && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">QR Code Generated!</h4>
                <p className="text-sm text-green-700">
                  This QR code is valid for 24 hours and can only be used once.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Token
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={qrToken}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-sm font-mono"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-300 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center">
          {qrToken ? (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="text-center mb-4">
                <h3 className="font-semibold text-gray-900">
                  QR Code for {selectedStudentData?.full_name}
                </h3>
                <p className="text-sm text-gray-600">
                  Student can scan this to login
                </p>
              </div>
              <QRCode
                value={qrToken}
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
              <p className="text-xs text-gray-500 text-center mt-3">
                Expires in 24 hours
              </p>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <QrCode className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Select a student and generate a QR code</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">How QR Login Works:</h4>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Select a student from the dropdown</li>
          <li>2. Click "Generate QR Code" to create a unique login token</li>
          <li>3. Student scans the QR code or enters the token manually</li>
          <li>4. Student is automatically logged in and can complete their check-in</li>
          <li>5. QR code expires after 24 hours or after one use</li>
        </ol>
      </div>
    </div>
  )
}