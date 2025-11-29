import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import { Capacitor } from '@capacitor/core'

interface NotificationSettings {
  browser_notifications: boolean
  email_notifications: boolean
  notification_time: string // HH:MM format in Australian Pacific Time
}

export function useNotifications() {
  const { user } = useAuth()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [settings, setSettings] = useState<NotificationSettings>({
    browser_notifications: true,
    email_notifications: true,
    notification_time: '08:00'
  })
  const isMobileApp = Capacitor.isNativePlatform()

  useEffect(() => {
    // Check current notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }

    // Load user notification settings
    if (user) {
      loadNotificationSettings()
    }
  }, [user])

  useEffect(() => {
    // Set up daily notification scheduler
    if (user && permission === 'granted' && settings.browser_notifications) {
      scheduleDailyNotification()
    }
  }, [user, permission, settings])

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return false
    }

    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }

  const loadNotificationSettings = async () => {
    try {
      // Load from database
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle()

      if (error) {
        console.error('Error loading notification settings:', error)
        return
      }

      if (data) {
        setSettings({
          browser_notifications: data.browser_notifications,
          email_notifications: data.email_notifications,
          notification_time: data.notification_time.substring(0, 5) // Convert from HH:MM:SS to HH:MM
        })
      } else {
        // Create default settings if none exist
        const defaultSettings = {
          user_id: user!.id,
          browser_notifications: true,
          email_notifications: true,
          notification_time: '08:00:00',
          timezone: 'Australia/Sydney'
        }

        const { error: insertError } = await supabase
          .from('notification_settings')
          .insert(defaultSettings)

        if (insertError) {
          console.error('Error creating default notification settings:', insertError)
        }
      }
    } catch (error) {
      console.error('Error loading notification settings:', error)
    }
  }

  const updateNotificationSettings = async (newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)

    try {
      // Prepare data for database (convert HH:MM to HH:MM:SS)
      const dbSettings: any = {}

      if (newSettings.browser_notifications !== undefined) {
        dbSettings.browser_notifications = newSettings.browser_notifications
      }
      if (newSettings.email_notifications !== undefined) {
        dbSettings.email_notifications = newSettings.email_notifications
      }
      if (newSettings.notification_time !== undefined) {
        dbSettings.notification_time = newSettings.notification_time + ':00' // Convert HH:MM to HH:MM:SS
      }

      // Upsert to database
      const { error } = await supabase
        .from('notification_settings')
        .upsert(
          {
            user_id: user!.id,
            ...dbSettings
          },
          {
            onConflict: 'user_id'
          }
        )

      if (error) {
        console.error('Error updating notification settings:', error)
        throw error
      }

      console.log('Notification settings updated successfully')
    } catch (error) {
      console.error('Error updating notification settings:', error)
    }
  }

  const scheduleDailyNotification = () => {
    // Clear any existing intervals
    if (window.notificationInterval) {
      clearInterval(window.notificationInterval)
    }

    const now = new Date()
    const [hours, minutes] = settings.notification_time.split(':').map(Number)
    
    // Create scheduled time for today
    const scheduledTime = new Date()
    scheduledTime.setHours(hours, minutes, 0, 0)
    
    // If the time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1)
    }

    const timeUntilNotification = scheduledTime.getTime() - now.getTime()

    // Schedule the first notification
    setTimeout(() => {
      checkAndSendNotification()
      
      // Set up recurring daily notifications
      window.notificationInterval = setInterval(checkAndSendNotification, 24 * 60 * 60 * 1000)
    }, timeUntilNotification)

    console.log(`Next notification scheduled for: ${scheduledTime.toLocaleString()}`)
  }

  const checkAndSendNotification = async () => {
    if (!user) return

    try {
      // Check if user has already completed today's questionnaire
      const today = new Date().toISOString().split('T')[0]

      // Check database for today's entry
      const { data, error } = await supabase
        .from('wellness_entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .maybeSingle()

      if (error) {
        console.error('Error checking wellness entries:', error)
        // If error checking, send notification anyway
        sendBrowserNotification()
        return
      }

      // If no entry for today, send notification
      if (!data) {
        sendBrowserNotification()
      }
    } catch (error) {
      console.error('Error checking questionnaire status:', error)
      // If error checking, send notification anyway
      sendBrowserNotification()
    }
  }

  const sendBrowserNotification = () => {
    if (permission === 'granted' && settings.browser_notifications) {
      const notification = new Notification('BDC Thrive - Daily Check-in', {
        body: 'Good morning! Time for your daily wellbeing questionnaire. Click to open the app.',
        icon: '/BDC Logo.jpg',
        badge: '/BDC Logo.jpg',
        tag: 'daily-reminder',
        requireInteraction: true
      })

      notification.onclick = () => {
        window.focus()
        // Try to open the app or focus the existing window
        if (window.location.pathname !== '/') {
          window.location.href = '/'
        }
        notification.close()
      }

      // Auto-close after 30 seconds
      setTimeout(() => notification.close(), 30000)
    }
  }

  const sendTestNotification = () => {
    if (permission === 'granted') {
      sendBrowserNotification()
    }
  }

  return {
    permission,
    settings,
    requestPermission,
    updateNotificationSettings,
    sendTestNotification,
    checkAndSendNotification,
    isMobileApp
  }
}