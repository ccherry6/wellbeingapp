import React from 'react'
import { LogOut, Settings, Download } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { BDCLogo } from '../BDCLogo'

// PWA Install prompt component
function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null)
  const [showInstall, setShowInstall] = React.useState(false)

  React.useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowInstall(false)
    }
  }

  if (!showInstall) return null

  return (
    <button
      onClick={handleInstall}
      className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100"
      title="Install as App"
    >
      <Download className="w-4 h-4" />
      <span className="text-sm">Install App</span>
    </button>
  )
}

export function Header() {
  const { user, userProfile, signOut, switchRole } = useAuth()
  const [isSigningOut, setIsSigningOut] = React.useState(false)

  // Check if user can switch roles (coaches and admins based on actual_role)
  const canSwitchRoles = () => {
    if (!userProfile) return false
    return userProfile.actual_role === 'coach' || userProfile.actual_role === 'admin'
  }

  const handleSignOut = async () => {
    try {
      console.log('Header: Sign out button clicked')
      setIsSigningOut(true)
      await signOut()
    } catch (error) {
      console.error('Header: Sign out failed:', error)
      // Force reload even if sign out fails
      window.location.href = '/'
    }
  }

  const handleRoleSwitch = async () => {
    if (!canSwitchRoles()) return
    
    const newRole = userProfile?.role === 'student' ? 'coach' : 'student'
    console.log('Header: Switching from', userProfile?.role, 'to', newRole)
    await switchRole(newRole)
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="mr-3">
              <BDCLogo className="h-12 w-auto" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Thrive Wellbeing
              </h1>
              <p className="text-xs text-gray-600">Empowering High Performance Youth Wellness</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {userProfile?.full_name || user?.email}
              </p>
              <p className="text-xs text-gray-600">
                <span className="font-medium capitalize">{userProfile?.role || 'User'}</span>
                {canSwitchRoles() && <span className="text-blue-600"> (Can switch views)</span>}
              </p>
            </div>
            <PWAInstallPrompt />
            {canSwitchRoles() && (
              <button
                onClick={handleRoleSwitch}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100"
                title={`Switch to ${userProfile?.role === 'student' ? 'Coach' : 'Student'} view`}
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm">
                  Switch to {userProfile?.role === 'student' ? 'Coach' : 'Student'}
                </span>
              </button>
            )}
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSigningOut ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <span className="text-sm">Signing Out...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Sign Out</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}