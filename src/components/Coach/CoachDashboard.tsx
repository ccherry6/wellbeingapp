import React, { useState, useEffect } from 'react'
import { Users, TrendingUp, Calendar, Download, FileImage, FileText, AlertCircle, UserSearch, MessageCircle, Book, Target, Activity, BarChart2, UserPlus, Microscope } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { StudentOverview } from './StudentOverview'
import { AnalyticsCharts } from './AnalyticsCharts'
import { AlertHistory } from './AlertHistory'
import { StudentDeepDive } from './StudentDeepDive'
import { ContactFollowUp } from './ContactFollowUp'
import ResourceManagement from './ResourceManagement'
import RiskScoring from './RiskScoring'
import CorrelationAnalysis from './CorrelationAnalysis'
import WeeklySummary from './WeeklySummary'
import UserManagement from './UserManagement'
import ResearchExport from './ResearchExport'
import { BDCLogo } from '../BDCLogo'
import { formatDateAEST } from '../../lib/dateUtils'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface Student {
  id: string
  full_name: string
  student_id: string
  sport: string
  team: string
  email: string
}

export function CoachDashboard() {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedView, setSelectedView] = useState<'overview' | 'analytics' | 'alerts' | 'deepdive' | 'contacts' | 'resources' | 'risk' | 'correlations' | 'weekly' | 'users' | 'research'>('overview')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      // Get all user profiles
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('full_name')

      if (error) {
        throw error
      }

      // Filter to include students and any users who have wellness entries
      const usersWithWellnessData = []
      
      for (const user of data || []) {
        const { data: hasEntries } = await supabase
          .from('wellness_entries')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)

        // Include students OR any user who has wellness entries (including admin/coach)
        if (user.role === 'student' || (hasEntries && hasEntries.length > 0)) {
          usersWithWellnessData.push(user)
        }
      }

      setStudents(usersWithWellnessData.map(user => ({
        id: user.id,
        full_name: user.full_name || '',
        student_id: user.student_id || '',
        sport: user.sport || '',
        team: user.program_year?.toString() || 'N/A',
        email: user.email
      })))
    } catch (error) {
      // Silently handle error
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    try {
      const { data: responses, error } = await supabase
        .from('wellness_entries')
        .select(`
          *,
          user_profiles (
            full_name,
            student_id,
            sport
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Convert to CSV
      const headers = [
        'Date', 'Student Name', 'Student ID', 'Sport', 'Team',
        'Sleep Quality', 'Sleep Hours', 'Energy Level',
        'Training Fatigue', 'Muscle Soreness', 'Mood', 'Stress Level',
        'Academic Pressure', 'Relationship Satisfaction', 'Program Belonging', 'Notes'
      ]

      const csvContent = [
        headers.join(','),
        ...responses.map(row => [
          formatDateAEST(row.created_at),
          row.user_profiles?.full_name || '',
          row.user_profiles?.student_id || '',
          row.user_profiles?.sport || '',
          '',
          row.sleep_quality,
          row.sleep_hours,
          row.energy_level,
          row.training_fatigue,
          row.muscle_soreness,
          row.mood,
          row.stress_level,
          row.academic_pressure,
          row.relationship_satisfaction,
          row.program_belonging,
          row.notes || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `wellbeing-data-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      alert('Error exporting data. Please try again.')
    }
  }

  const exportChartsAsPDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const chartsContainer = document.getElementById('analytics-charts')

      if (!chartsContainer) {
        alert('Please switch to the Analytics tab first to export charts')
        return
      }

      // Add title page
      pdf.setFontSize(20)
      pdf.text('BDC Wellbeing Analytics Report', 20, 30)
      pdf.setFontSize(12)
      pdf.text(`Generated on: ${formatDateAEST(new Date())}`, 20, 45)
      pdf.text(`Total Students: ${students.length}`, 20, 55)

      // Capture charts as images
      const canvas = await html2canvas(chartsContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 170 // A4 width minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight)

      // Use data URI approach for better mobile compatibility
      const pdfOutput = pdf.output('datauristring')
      const link = document.createElement('a')
      link.href = pdfOutput
      link.download = `wellbeing-charts-${new Date().toISOString().split('T')[0]}.pdf`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      alert('Error exporting charts. Please try again.')
    }
  }

  const exportChartsAsImages = async () => {
    try {
      const chartsContainer = document.getElementById('analytics-charts')
      
      if (!chartsContainer) {
        alert('Please switch to the Analytics tab first to export charts')
        return
      }

      const canvas = await html2canvas(chartsContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })
      
      const link = document.createElement('a')
      link.download = `wellbeing-charts-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      alert('Error exporting charts. Please try again.')
    }
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coach Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor student wellbeing and performance</p>
        </div>
      <div className="flex items-center space-x-4">
        <BDCLogo className="h-12 w-auto" />
        <div className="flex space-x-2">
          <div className="relative group">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={exportData}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export Data (CSV)
              </button>
              <button
                onClick={exportChartsAsPDF}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export Charts (PDF)
              </button>
              <button
                onClick={exportChartsAsImages}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-sm rounded-b-lg"
              >
                <FileImage className="w-4 h-4 mr-2" />
                Export Charts (PNG)
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex space-x-1 mb-6 flex-wrap">
          <button
            onClick={() => {
              setSelectedView('overview')
              setSelectedStudentId(null)
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'overview'
                ? 'bg-blue-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Student Overview
          </button>
          <button
            onClick={() => {
              setSelectedView('analytics')
              setSelectedStudentId(null)
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'analytics'
                ? 'bg-blue-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Analytics
          </button>
          <button
            onClick={() => {
              setSelectedView('alerts')
              setSelectedStudentId(null)
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'alerts'
                ? 'bg-blue-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Alert History
          </button>
          <button
            onClick={() => {
              setSelectedView('contacts')
              setSelectedStudentId(null)
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'contacts'
                ? 'bg-blue-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <MessageCircle className="w-4 h-4 inline mr-2" />
            Contact Follow-up
          </button>
          <button
            onClick={() => {
              setSelectedView('resources')
              setSelectedStudentId(null)
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'resources'
                ? 'bg-blue-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Book className="w-4 h-4 inline mr-2" />
            Resources
          </button>
          <button
            onClick={() => {
              setSelectedView('risk')
              setSelectedStudentId(null)
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'risk'
                ? 'bg-blue-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Target className="w-4 h-4 inline mr-2" />
            Risk Scoring
          </button>
          <button
            onClick={() => {
              setSelectedView('correlations')
              setSelectedStudentId(null)
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'correlations'
                ? 'bg-blue-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Correlations
          </button>
          <button
            onClick={() => {
              setSelectedView('weekly')
              setSelectedStudentId(null)
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'weekly'
                ? 'bg-blue-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <BarChart2 className="w-4 h-4 inline mr-2" />
            Weekly Summary
          </button>
          <button
            onClick={() => {
              setSelectedView('users')
              setSelectedStudentId(null)
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'users'
                ? 'bg-blue-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            User Management
          </button>
          <button
            onClick={() => {
              setSelectedView('research')
              setSelectedStudentId(null)
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'research'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Microscope className="w-4 h-4 inline mr-2" />
            Research Export
          </button>
        </div>

        {selectedView === 'overview' && (
          <StudentOverview
            students={students}
            onStudentClick={(studentId) => {
              setSelectedStudentId(studentId)
              setSelectedView('deepdive')
            }}
          />
        )}
        {selectedView === 'analytics' && <AnalyticsCharts />}
        {selectedView === 'alerts' && <AlertHistory />}
        {selectedView === 'contacts' && <ContactFollowUp />}
        {selectedView === 'resources' && <ResourceManagement />}
        {selectedView === 'risk' && <RiskScoring />}
        {selectedView === 'correlations' && <CorrelationAnalysis />}
        {selectedView === 'weekly' && <WeeklySummary />}
        {selectedView === 'users' && <UserManagement />}
        {selectedView === 'research' && <ResearchExport />}
        {selectedView === 'deepdive' && selectedStudentId && (
          <StudentDeepDive
            studentId={selectedStudentId}
            onBack={() => {
              setSelectedView('overview')
              setSelectedStudentId(null)
            }}
          />
        )}
      </div>
    </div>
  )
}