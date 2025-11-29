import React, { useState } from 'react'
import { Bell, Clock, Mail, Smartphone, TestTube, Send } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export function NotificationSettings() {
  const {
    permission,
    settings,
    requestPermission,
    updateNotificationSettings,
    sendTestNotification,
    isMobileApp
  } = useNotifications()
  const { user } = useAuth()
  const [sendingTestEmail, setSendingTestEmail] = useState(false)
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null)

  const handlePermissionRequest = async () => {
    const granted = await requestPermission()
    if (!granted) {
      alert('Please enable notifications in your browser settings to receive daily reminders.')
    }
  }

  const handleTimeChange = (time: string) => {
    updateNotificationSettings({ notification_time: time })
  }

  const handleBrowserToggle = (enabled: boolean) => {
    updateNotificationSettings({ browser_notifications: enabled })
  }

  const handleEmailToggle = (enabled: boolean) => {
    updateNotificationSettings({ email_notifications: enabled })
  }

  const sendTestEmail = async () => {
    if (!user) return

    setSendingTestEmail(true)
    setTestEmailResult(null)

    try {
      // Get user profile for name
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single()

      const response = await supabase.functions.invoke('send-reminder-email', {
        body: {
          studentEmail: profile?.email || user.email,
          studentName: profile?.full_name || user.email,
          reminderTime: settings.notification_time
        }
      })

      console.log('Email function response:', response)

      if (response.error) {
        console.error('Email error:', response.error)

        // Check if it's a configuration issue
        if (response.error.message && response.error.message.includes('Email service not configured')) {
          setTestEmailResult('Email not configured yet. Contact your administrator to set up RESEND_API_KEY.')
        } else {
          setTestEmailResult('Failed to send email. Check console for details or contact your coach.')
        }
      } else if (response.data && response.data.error) {
        console.error('Email service error:', response.data)

        // Show specific error if available
        if (response.data.details) {
          console.error('Error details:', response.data.details)
        }

        if (JSON.stringify(response.data).includes('RESEND_API_KEY')) {
          setTestEmailResult('Email service not configured. Contact your administrator.')
        } else {
          setTestEmailResult('Email service error. Please contact your coach.')
        }
      } else if (response.data && response.data.success) {
        setTestEmailResult('Test email sent successfully! Check your inbox.')
      } else {
        setTestEmailResult('Unexpected response. Check console for details.')
      }
    } catch (error) {
      setTestEmailResult('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setSendingTestEmail(false)
      setTimeout(() => setTestEmailResult(null), 5000)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <Bell className="w-6 h-6 text-indigo-500 mr-3" />
        <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
      </div>

      <div className="space-y-6">
        {/* Permission Status - Hide browser notifications on mobile */}
        {!isMobileApp && (
        <div className="p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Smartphone className="w-5 h-5 text-gray-500 mr-2" />
              <span className="font-medium text-gray-900">Browser Notifications</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              permission === 'granted' 
                ? 'bg-green-100 text-green-800' 
                : permission === 'denied'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {permission === 'granted' ? 'Enabled' : permission === 'denied' ? 'Blocked' : 'Not Set'}
            </span>
          </div>
          
          {permission !== 'granted' && (
            <div className="mb-3">
              {permission === 'denied' ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Notifications Blocked</h4>
                  <p className="text-sm text-red-700 mb-3">
                    Notifications have been blocked for this site. To enable them:
                  </p>
                  <ol className="text-sm text-red-700 space-y-1 mb-3 list-decimal list-inside">
                    <li>Click the lock icon (🔒) or info icon (ℹ️) in your browser's address bar</li>
                    <li>Find "Notifications" in the permissions list</li>
                    <li>Change it from "Block" to "Allow"</li>
                    <li>Refresh this page</li>
                  </ol>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Refresh Page
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Enable browser notifications to receive daily reminders for your wellbeing check-in.
                  </p>
                  <button
                    onClick={handlePermissionRequest}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  >
                    Enable Notifications
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Daily reminder notifications</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.browser_notifications}
                onChange={(e) => handleBrowserToggle(e.target.checked)}
                disabled={permission === 'denied'}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 ${permission === 'denied' ? 'bg-gray-300' : 'bg-gray-200'} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 ${permission === 'denied' ? 'peer-checked:bg-gray-400' : ''}`}></div>
            </label>
          </div>
        </div>
        )}

        {/* Notification Time */}
        <div className="p-4 rounded-lg border border-gray-200">
          <div className="flex items-center mb-3">
            <Clock className="w-5 h-5 text-gray-500 mr-2" />
            <span className="font-medium text-gray-900">Daily Reminder Time</span>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="time"
              value={settings.notification_time}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <span className="text-sm text-gray-600">
              Daily reminder at this time (your local time)
            </span>
          </div>
        </div>

        {/* Email Notifications */}
        <div className="p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-gray-500 mr-2" />
              <span className="font-medium text-gray-900">Email Reminders</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.email_notifications}
                onChange={(e) => handleEmailToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          <p className="text-sm text-gray-600">
            Receive email reminders if you haven't completed your daily check-in
          </p>
        </div>

        {/* Test Browser Notification - Only show on web */}
        {!isMobileApp && permission === 'granted' && (
          <div className="p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TestTube className="w-5 h-5 text-gray-500 mr-2" />
                <div>
                  <span className="font-medium text-gray-900">Test Browser Notification</span>
                  <p className="text-sm text-gray-600">Send a test browser notification to verify it's working</p>
                </div>
              </div>
              <button
                onClick={sendTestNotification}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Send Test
              </button>
            </div>
          </div>
        )}

        {/* Test Email */}
        <div className="p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <Send className="w-5 h-5 text-gray-500 mr-2" />
              <div className="flex-1">
                <span className="font-medium text-gray-900">Test Email Reminder</span>
                <p className="text-sm text-gray-600">Send a test email reminder to verify email functionality</p>
                {testEmailResult && (
                  <p className={`text-sm mt-2 ${testEmailResult.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                    {testEmailResult}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={sendTestEmail}
              disabled={sendingTestEmail}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingTestEmail ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">How Daily Reminders Work:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Email reminders are sent at your chosen time each day</li>
          <li>• Only sent if you haven't completed your daily check-in yet</li>
          <li>• Reminders stop once you complete your daily questionnaire</li>
          <li>• Use the test button to verify email delivery</li>
          {!isMobileApp && (
            <>
              <li>• Browser notifications can also be enabled for instant alerts</li>
              <li>• Browser notifications appear even when the app is closed</li>
            </>
          )}
        </ul>
      </div>
    </div>
  )
}